const commentListData = require('../lib/mockdata')

exports.getCommentList = (ctx, next) => {
  ctx.body = ctx.apiSuccess(commentListData)
}