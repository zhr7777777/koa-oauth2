const { missingParameterError } = require('./utils')

exports.extendAPIOutput = async (ctx, next) => { 
  ctx.apiSuccess = (data, message) => ({
    code: 200,
    message: message || '',
    data,
  })

  ctx.apiError = ({ errCode, errMsg }) => ({
    code: errCode || -1,
    message: errMsg || ''
  })

  await next()  // 原来这个这里没有加await，导致下一个中间件中的没有等待异步操作，直接返回Not Found
}

exports.checkAuthorizeCallBackParams = async (ctx, next) => {
  let code = ctx.query.code
  if (!code) {
    return ctx.body = ctx.apiError(missingParameterError('code'))
  }
  await next()
}