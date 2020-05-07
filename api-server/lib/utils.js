const crypto = require('crypto')

exports.missingParameterError = paramName => {
  return {
    errCode: 400,
    errMsg: `缺少必要参数${paramName}`
  }
}

exports.invalidParameterError = paramName => {
  return {
    errCode: 401,
    errMsg: `参数${paramName}错误`
  }
}

exports.randomString = number => {
  let a = 'a'
  let A = 'A'
  let string = ''
  for(let i=0; i<number; i++) {
    let UpperOrLower = parseInt(Math.random() * 2)
    let offset = parseInt(Math.random() * 26)
    let start = UpperOrLower === 0 ? a : A
    string += String.fromCharCode(start.charCodeAt(0) + offset)
  }
  return string
}

exports.getTimeStamp = () => {
  return parseInt(Date.now() / 1000)
}

exports.md5 = function (text) {
  return crypto.createHash('md5').update(text).digest('hex');
}