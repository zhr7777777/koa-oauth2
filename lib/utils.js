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

exports.getTimeStamp = () => {
  return parseInt(Date.now() / 1000)
}