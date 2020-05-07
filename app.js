const Koa = require('koa')
const Router = require('@koa/router')
const fs = require('fs')
const { extendAPIOutput, checkAuthorizeCallBackParams } = require('./lib/middlewares')
const axios = require('axios')
const { getTimeStamp } = require('./lib/utils')

const app = new Koa()
const router = new Router()

let accessToken = ''
let expires = 0
const clientId = 101019034
const clientSecret = 'xffcncgmveu6slxg'
const loginPage = fs.readFileSync(`${__dirname}/static/index.html`)

router.get('/', async (ctx, next) => {
  if (!accessToken || getTimeStamp() > expires) {
    ctx.type = 'html'
    ctx.body = loginPage
    return
  }
  try {
    const res = await axios.get('http://127.0.0.1:3001/api/v1/userinfo', {
      params: {
        access_token: accessToken,
        client_id: clientId
      }
    })
    if(res.data.code !== 200) {
      console.log(res.data)
      ctx.body = res.data
      return
    }
    ctx.body = res.data
  } catch(err) {} 
})

router.get('/callback', checkAuthorizeCallBackParams, async (ctx, next) => {
  try {
    const res = await axios.post('http://127.0.0.1:3001/oauth2/access_token', {
      clientId,
      code: ctx.query.code,
      clientSecret
    })
    if(res.data.code !== 200) {
      throw new Error(res.data.message)
    }
    accessToken = res.data.data.accessToken
    expires = res.data.data.expires
    ctx.redirect('/')
  } catch(err) {
    ctx.body = ctx.apiError({
      errCode: -1,
      errMsg: err instanceof Error ? err.toString() : '未知错误'
    })
  }
})

app.use(extendAPIOutput)
app.use(router.routes())

app.listen(3002, () => {
  console.log('Listening on port 3002')
})