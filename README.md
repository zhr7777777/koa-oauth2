## 基于koa2实现OAuth2

## 运行
启动本地mongodb，端口27017，新建oauth2数据库，导入数据/api-server/oauth2Info.json
启动本地redis，端口6379

```bash
cd api-server
npm run pm2

cd ..
npm run pm2
```
访问http://127.0.0.1:3002/
点击第三方登录跳转到用户授权

用户授权显示用户信息

![](https://github.com/zhr7777777/koa-oauth2/blob/master/README/authorization.jpg)
![](https://github.com/zhr7777777/koa-oauth2/blob/master/README/user_info.jpg)

### 概述
项目实现了oauth2认证，也是微信授权的基本流程。
1. 第三方应用登录页需要访问api-server的/api/v1/userinfo接口，没有accessToken时显示第三方登录。
2. 用户点击登录重定向到授权页面，授权页面验证client_id和redirect_uri
3. 用户点击授权，跳转到redirect_uri并加上参数code
4. redirect_uri页面拿到code，和client_id，client_secret去请求accessToken，获得accessToken，重定向到登录页

### 项目struction

api-server:
```javascript
├── db                          ---------------------- 数据库
│   ├── mongo                
│   │   └── index.js            ---------------------- 定义schema，链接mongo
│   └── redis                
│       └── index.js            ---------------------- 链接redis，promisify redis方法
├── lib
│   ├── middlewares.js          ---------------------- 自定义中间件：1. 验证参数 2. 格式化返回json 3. 限制请求频率    
│   ├── mockdata.js
│   └── util.js                 ---------------------- 工具函数
├── routers
│   └── index.js
├── static                      ---------------------- 静态资源
│   └──authorize.html           ---------------------- 授权页面
└── app.js                      ---------------------- 入口
```

client:
```javascript
├── lib
│   ├── middlewares.js          ---------------------- 自定义中间件，eg: 1. 验证参数 2. 格式化返回json
│   └── util.js                 ---------------------- 工具函数
├── static                      ---------------------- 静态资源
│   └──index.html               ---------------------- 授权页面
└── app.js                      ---------------------- 入口
```

### 项目features
1.使用redis实现了一个限制请求频率的中间件：
```javascript
// 对应api和client_id生成唯一key
function generateRateLimiterKey(api, id) {
  return md5(api + id)
}

// 返回中间件，设置key的过期时间实现在一段时间内统计api请求次数，超过limit则限制请求
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
```
（也可以使用rate-limiter-flexible包）

2.生成token后面带上过期的时间戳，可以验证这个时间戳是否过期，然后再查数据库验证token有效性，减轻数据库查询压力