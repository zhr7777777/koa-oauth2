const mongoose = require('mongoose')

exports.oauth2InfoSchema = mongoose.Schema({ 
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
})

// exports.kittySchema = mongoose.Schema({ // 这里的schema是挂到上面的mongoose，不能exports出去使用
//   name: String
// });


const authUser = {
  101019034: {
    accessToken: '',
    code: '',
    redirectUri: 'http://127.0.0.1:3002/callback',
    clientSecret: 'xffcncgmveu6slxg',
    expires: 0
  }
}

// exports.get = (key, callback) => {
//   if (!(key in authUser)) {
//     callback(new Error('Not found clientId'))
//     return
//   }
//   callback(null, authUser[key])
// }

// exports.set = (key, value, field, callback) => {
//   if (!(key in authUser)) {
//     callback(new Error('Not found clientId'))
//     return
//   }
//   authUser[key][field] = value
//   callback()
// }