const { missingParameterError, invalidParameterError, getTimeStamp, md5 } = require('./utils')
const database = require('./database')
const { mongoModels } = require('../db/mongo')
const { geneRedisAsync } = require('../db/redis')
const { redisGetAsync, redisSetAsync, redisIncrAsync, redisExpireAsync } = geneRedisAsync()

exports.extendAPIOutput = async (ctx, next) => {
  ctx.apiSuccess = (data, message) => ({
    code: 200,
    message: message || '',
    data,
  })

  ctx.apiError = ({ errCode, errMsg }) => ({
    code: errCode || -1,
    message: errMsg || '未知错误'
  })

  await next()
}

exports.verifyAccessToken = async (ctx, next) => {
  let accessToken = ctx.request.body.access_token || ctx.query.access_token
  let clientId = ctx.request.body.client_id || ctx.query.client_id

  if(!accessToken) {
    return ctx.body = ctx.apiError(missingParameterError('access_token'))
  }
  if (!clientId) {
    return ctx.body = ctx.apiError(missingParameterError('client_id'))
  }
  const info = await mongoModels.oauth2Info.findOne({ clientId })
  if (!info) {
    return ctx.body = ctx.apiError(invalidParameterError('client_id'))
  }
  if (!info.accessTokenInfo.accessToken || accessToken !== info.accessTokenInfo.accessToken) {
    return ctx.body = ctx.apiError(invalidParameterError('access_token'))
  }
  let timeStamp = accessToken.includes('.') && !isNaN(accessToken.split('.')[1]) ? Number(accessToken.split('.')[1]) : info.accessTokenInfo.expires
  if (getTimeStamp() > timeStamp) {
    const whereStr = { clientId }  // 查询条件
    const updateStr = { $set: { accessTokenInfo: { accessToken: '', expires: 0 } } }
    try {
      const updateRes = await mongoModels.oauth2Info.updateOne(whereStr, updateStr)
      let { n, nModified, ok } = updateRes
      if (nModified === 0) {
        return ctx.body = ctx.apiError({ errMsg: '重置access_token失败' })
      }
    } catch(err) {
      console.log(err)
      return ctx.body = ctx.apiError({})
    }
    return ctx.body = ctx.apiError({
      errCode: -1,
      errMsg: 'access_token已过期'
    })
  }
  await next()
  // database.get(clientId, (err, value) => {
  //   if(err) {
  //     return ctx.body = ctx.apiError({
  //       errCode: -1,
  //       errMsg: err instanceof Error ? err.toString() : '查询clientId失败'
  //     })
  //   }
  //   if(accessToken !== value.accessToken) {
  //     return ctx.body = ctx.apiError(invalidParameterError('access_token'))
  //   }
  //   let timeStamp = accessToken.includes('.') && !isNaN(accessToken.split('.')[1]) ? Number(accessToken.split('.')[1]) : value.expires
  //   console.log(accessToken)
  //   if (getTimeStamp() > timeStamp) {
  //     database.set(clientId, '', accessToken, err => {
  //       if(err) {
  //         return console.log('重置access_token失败')
  //       }
  //     })
  //     return ctx.body = ctx.apiError({
  //       errCode: -1,
  //       errMsg: 'access_token已过期'
  //     })
  //   }
  //   next()
  // })
}

exports.checkAuthorizeParams = async (ctx, next) => {
  let clientId = ctx.query.client_id
  let redirectUri = ctx.query.redirect_uri
  if (!clientId) {
    return ctx.body = ctx.apiError(missingParameterError('client_id'))
  }
  if (!redirectUri) {
    return ctx.body = ctx.apiError(missingParameterError('redirect_uri'))
  }
  const res = await mongoModels.oauth2Info.findOne({ clientId })
  if (!res) {
    return ctx.body = ctx.apiError({ errMsg: '无效的client_id' })
  }
  if (redirectUri !== res.redirectUri) {
    return ctx.body = ctx.apiError(invalidParameterError('redirect_uri'))
  }
  await next()
  // database.get(clientId, (err, value) => {
  //   if (err) {
  //     return ctx.body = ctx.apiError({
  //       errCode: -1,
  //       errMsg: err instanceof Error ? err.toString() : '查询clientId失败'
  //     })
  //   }
  //   if (redirectUri !== value.redirectUri) {
  //     return ctx.body = ctx.apiError(invalidParameterError('redirect_uri'))
  //   }
  //   next()
  // })
}

function generateRateLimiterKey(api, id) {
  return md5(api + id) + ':' + parseInt(new Date().getSeconds() / 10)
}

exports.generateRateLimiter = (api, limit) => {
  return async (ctx, next) => {
    const clientId = ctx.request.body.client_id || ctx.query.client_id
    const key = generateRateLimiterKey(api, clientId)
    console.log(key)
    let count = await redisGetAsync(key)
    console.log(count)
    if(count === null) {
      await redisSetAsync(key, 1)
      await redisExpireAsync(key, 10)
    } else {
      count = await redisIncrAsync(key)
      console.log(count)
      if (count > limit) {
        return ctx.body = ctx.apiError({ errMsg: '请求过于频繁' })
      }
    }
    await next()
  }
}