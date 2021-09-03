const Router = require('koa-router');

module.exports = function webpages({ db }) {
  return new Router({ prefix: '/webPages/:location/comment' })
    .get('/', get)
    .post('/', post)
    .routes();

  async function get(ctx) {
    ctx.status = 200;
  }

  async function post(ctx) {
    ctx.status = 200;
  }
};
