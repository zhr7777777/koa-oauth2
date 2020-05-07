const redis = require('redis')
const { promisify } = require('util')

let redisClient = null

exports.connectRedis = () => {
  redisClient = redis.createClient('6379', '127.0.0.1')

  redisClient.on('error', function (error) {
    console.error(error)
  })
}

exports.geneRedisAsync = () => { // 回调转化成promise
  return {
    redisGetAsync: promisify(redisClient.get).bind(redisClient),
    redisSetAsync: promisify(redisClient.set).bind(redisClient),
    redisExpireAsync: promisify(redisClient.expire).bind(redisClient),  // rclient.expire('key',60);//60秒自动过期
    redisIncrAsync: promisify(redisClient.incr).bind(redisClient)
  }
}
