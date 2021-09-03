const Router = require('koa-router');
const getCommentResponseBody = require('./utils/getCommentResponseBody');

module.exports = function comments({ db }) {
  return new Router({ prefix: '/comment' })
    .get('/:id', get)
    .delete('/', remove)
    .routes();

  async function get(ctx) {
    const { id } = ctx.params;

    const responseBody = await getCommentResponseBody(db, id);
    if (!responseBody) {
      ctx.status = 404;
      return;
    }

    ctx.body = responseBody;
  }

  async function remove(ctx) {
    ctx.status = 200;
  }
};
