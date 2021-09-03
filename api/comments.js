const Router = require('koa-router')

module.exports = function comments({ db }) {
  return new Router({ prefix: '/comments' })
    .get('/:id', get)
    .delete('/', remove)
    .routes()

  async function get(ctx) {
    ctx.status = 200
  }

  async function remove(ctx) {
    ctx.status = 200
  }
}
