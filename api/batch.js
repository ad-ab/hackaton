const Router = require('koa-router')

module.exports = function batch({}) {
  return new Router({ prefix: '/batch' }).post('/', post).routes()

  async function post(ctx) {
    ctx.status = 200
  }
}
