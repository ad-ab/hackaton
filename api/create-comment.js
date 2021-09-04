const { is, size, object, string, nullable } = require('superstruct');
const { v4: uuid } = require('uuid');
const cursor = require('./utils/cursor');

const CreateWepPageRequest = object({
  author: size(string(), 1, 36),
  text: size(string(), 5, 128000),
  parent: nullable(size(string(), 1, 36)),
});

module.exports = function ({ db }) {
  return async function post(ctx) {
    if (!is(ctx.request.body, CreateWepPageRequest)) {
      ctx.status = 400;
      return;
    }

    const collection = db.collection('comments');
    const { author, text, parent: parentId } = ctx.request.body;
    const { location } = ctx.params;

    if (parentId) {
      const parent = await collection.findOne({ _id: parentId });
      if (!parent || parent.location !== location) {
        ctx.status = 400;
        return;
      }
    }

    const comment = {
      _id: uuid(),
      parentId,
      author,
      text,
      location,
      created: Date.now(),
    };

    await collection.insertOne(comment);

    ctx.body = {
      id: comment._id,
      author: comment.author,
      text: comment.text,
      parent: comment.parentId ? { id: comment.parentId } : null,
      created: comment.created,
      repliesStartCursor: cursor.encode(comment._id, comment.created),
      replies: {
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
        edges: [],
      },
    };

    ctx.status = 201;
  };
};
