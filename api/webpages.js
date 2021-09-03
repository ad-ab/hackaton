const Router = require('koa-router');
const { is, size, object, string, optional } = require('superstruct');
const { v4: uuid } = require('uuid');

module.exports = function webpages({ db }) {
  return new Router({ prefix: '/webPages/:location/comment' })
    .get('/', get)
    .post('/', post)
    .routes();

  async function get(ctx) {
    ctx.status = 200;
  }

  async function post(ctx) {
    const CreatePostPayload = object({
      author: size(string(), 1, 36),
      text: size(string(), 5, 128000),
      parent: optional(size(string(), 1, 36)),
    });
    if (!is(ctx.request.body, CreatePostPayload)) {
      ctx.status = 400;
      return;
    }

    const { author, text, parent: parentId } = ctx.request.body;
    const { location } = ctx.params;

    const collection = db.collection('comments');
    const newComment = {
      _id: uuid(),
      parentId,
      author,
      text,
      location,
      created: Date.now(),
    };

    if (parentId) {
      const parent = await collection.findOne({ _id: parentId });
      if (!parent) {
        ctx.status = 400;
        return;
      }
    }

    await collection.insertOne(newComment);

    ctx.status = 201;
  }
};
