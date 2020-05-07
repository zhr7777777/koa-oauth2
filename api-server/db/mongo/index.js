const mongoose = require('mongoose')
const config = require('../../config')

const oauth2InfoSchema = mongoose.Schema({
  clientId: {
    type: Number,
    required: true
  },
  clientSecret: {
    type: String,
    required: true
  },
  code: String,
  redirectUri: String,
  accessTokenInfo: {
    accessToken: String,
    expires: Number
  }
}, { collection: 'oauth2Info' }) // 指定collection

exports.connectMongo = () => {
  mongoose.connect(config.mongodb, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  const db = mongoose.connection
  db.on('error', function (error) {
    console.log(error)
  })
  db.once('open', function (err) {
    console.log('连接mongodb成功')
  })
}

exports.mongoModels = {
  oauth2Info: mongoose.model('oauth2Info', oauth2InfoSchema)
}

