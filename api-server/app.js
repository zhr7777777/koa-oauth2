const Koa = require('koa')
// const mount = require('koa-mount')
const { connectRedis, geneRedisAsync } = require('./db/redis')
connectRedis()

const Boom = require('@hapi/boom')
const api = require('./routers')
const Router = require('@koa/router')
const bodyParser = require('koa-bodyparser')
const fs = require('fs')
const { randomString } = require('./lib/utils')
// const database = require('./lib/database')
const { invalidParameterError, getTimeStamp } = require('./lib/utils')
const { connectMongo, mongoModels } = require('./db/mongo')
connectMongo()
const { redisGetAsync } = geneRedisAsync()
const { extendAPIOutput, verifyAccessToken, checkAuthorizeParams, generateRateLimiter } = require('./lib/middlewares')

const app = new Koa()
const router = new Router()

const authorizePage = fs.readFileSync(`${__dirname}/static/authorize.html`)

router.get('/api/v1/userinfo', verifyAccessToken, generateRateLimiter('/api/v1/userinfo', 2), api.getCommentList)

router.get('/oauth2/userinfo', checkAuthorizeParams, async (ctx, next) => {
  ctx.type = 'html'
  ctx.body = authorizePage
})
router.post('/oauth2/userinfo', checkAuthorizeParams, async (ctx, next) => {
  const { client_id, redirect_uri } = ctx.query
  const code = randomString(10) // Todo： code设置一个过期时间
  const whereStr = { clientId: client_id }  // 查询条件
  const updateStr = { $set: { code } }
  try {
    const updateRes = await mongoModels.oauth2Info.updateOne(whereStr, updateStr)
    let { n, nModified, ok } = updateRes
    if (nModified === 0) {
      return ctx.body = ctx.apiError({ errMsg: '更新code失败' })
    }
    const redirectUrl = new URL(redirect_uri)
    redirectUrl.searchParams.append('code', code)
    ctx.redirect(redirectUrl.href)
  } catch(err) {
    console.log(err)
    return ctx.body = ctx.apiError({})
  }
  // database.set(client_id, code, 'code', err => {
  //   if(err) {
  //     return ctx.body = ctx.apiError({
  //       errCode: -1,
  //       errMsg: err instanceof Error ? err.toString() : '保存code失败'
  //     })
  //   }
  //   const redirectUrl = new URL(redirect_uri)
  //   redirectUrl.searchParams.append('code', code)
  //   ctx.redirect(redirectUrl.href)
  // })
})
router.post('/oauth2/access_token', async (ctx, next) => {
  let { clientId, code, clientSecret } = ctx.request.body
  const info = await mongoModels.oauth2Info.findOne({ clientId })
  if (!info) {
    return ctx.body = ctx.apiError({ errMsg: '无效的client_id' })
  }
  if (code !== info.code) {
    return ctx.body = ctx.apiError(invalidParameterError('code'))
  }
  if (clientSecret !== info.clientSecret) {
    return ctx.body = ctx.apiError(invalidParameterError('client_secret'))
  }
  let expires = getTimeStamp() + 10000
  let accessToken = randomString(20) + '.' + String(expires)
  const whereStr = { clientId }
  const updateStr = { $set: { code: '', accessTokenInfo: { accessToken, expires } } }
  try {
    const updateRes = await mongoModels.oauth2Info.updateOne(whereStr, updateStr)
    let { n, nModified, ok } = updateRes
    if (nModified === 0) {
      return ctx.body = ctx.apiError({ errMsg: '更新accessToken失败' })
    }
  } catch(err) {
    console.log(err)
    return ctx.body = ctx.apiError({})
  }
  ctx.body = ctx.apiSuccess({
    accessToken,
    expires
  })  
  // database.get(clientId, (err, value) => {
  //   if (err) {
  //     return ctx.body = ctx.apiError({
  //       errCode: -1,
  //       errMsg: err instanceof Error ? err.toString() : '查询clientId失败'
  //     })
  //   }
  //   if(code !== value.code) {
  //     return ctx.body = ctx.apiError(invalidParameterError('code'))
  //   }
  //   if(clientSecret !== value.clientSecret) {
  //     return ctx.body = ctx.apiError(invalidParameterError('client_secret'))
  //   }
  //   let expires = getTimeStamp() + 10
  //   let accessToken = randomString(20) + '.' + String(expires)
  //   database.set(clientId, '', 'code', err => {
  //     if (err) {
  //       console.log('重置code失败')
  //     }
  //   })
  //   database.set(clientId, accessToken, 'accessToken', err => {
  //     if (err) {
  //       return console.log('保存accessToken失败')
  //     }
  //     ctx.body = ctx.apiSuccess(accessToken)
  //   })
  //   database.set(clientId, expires, 'expires', err => {
  //     if (err) {
  //       return console.log('保存expires失败')
  //     }
  //   })
  // })
})

router.get('/mongo', async (ctx, next) => {
  try {
    const whereStr = { clientId: 101019034 };  // 查询条件
    // var updateStr = { $set: { code : "https://www.runoob.com" } }
    // await mongoModels.oauth2Info.updateOne(whereStr, updateStr).then(res => {
    //   console.log(res)
    // }).catch(err => {
    //   console.log(err)
    // })
    // let expires = getTimeStamp() + 10
    // let accessToken = randomString(20) + '.' + String(expires)
    // // const whereStr = { clientId: client_id }
    // const updateStr = { $set: { code: '', accessTokenInfo: { accessToken, expires } } }
    // await mongoModels.oauth2Info.updateOne(whereStr, updateStr).then(res => {
    //   let { n, nModified, ok } = res
    //   if (nModified === 0) {
    //     return ctx.body = ctx.apiError({ errMsg: '更新accessToken失败' })
    //   }
    // }).catch(err => {
    //   console.log(err)
    //   return ctx.body = ctx.apiError({})
    // })
    // ctx.body = ctx.apiSuccess({
    //   accessToken,
    //   expires
    // })
    await mongoModels.oauth2Info.findOne({ clientId: 101019034 }).then(res => {
      ctx.body = res
    })
  } catch(err) {
    console.log(err)
  }
  await next()
})

router.get('/redis', async (ctx, next) => {
  // const count = await redisClient.get('access_count')
  // console.log(count)
  // await redisSetAsync('access_count', 28)
  // const countNum = await redisGetAsync('access_count')
  // console.log(countNum)
  // await redisSetAsync('test', 28)
  // await redisExpireAsync('test', 10)
  let count = await redisGetAsync('test1')
  console.log(count)
  // redisClient.get('access_count', (err, countNum) => {
  //   if(err) {
  //     return res.send('get access_count error')
  //   }
  //   console.log(countNum)

  //   // redisClient.set('access_count', countNum, function(err) {
  //   //   if(err) {
  //   //     return res.send('set access_count error')
  //   //   }
  //   //   res.send(String(countNum))
  //   // })
  //   ctx.body = countNum
  // })
})

app.use(bodyParser())
app.use(extendAPIOutput)

app
  .use(router.routes())
  .use(router.allowedMethods({
    throw: true,
    notImplemented: () => new Boom.notImplemented(),
    methodNotAllowed: () => new Boom.methodNotAllowed()
  }))

app.listen(3001, () => {

})