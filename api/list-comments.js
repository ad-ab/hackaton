const { is, number, object, optional, string } = require('superstruct');
const validate = require('./utils/validate');
const findCommentsByLocation = require('./utils/findCommentsByLocation');

module.exports = function ({ db }) {
  return async function get(ctx) {
    const col = db.collection('comments');

    const paramsObject = object({
      location: string(),
    });

    const queryParamsObject = object({
      limit: string(),
      after: optional(string()),
      replies1stLevelLimit: optional(string()),
      replies2ndLevelLimit: optional(string()),
      replies3rdLevelLimit: optional(string()),
    });

    if (
      !validate(ctx.params, paramsObject, ctx) ||
      !validate(ctx.request.query, queryParamsObject, ctx)
    ) {
      ctx.status = 400;
      return;
    }

    const { location } = ctx.params;

    let {
      limit,
      after,
      replies1stLevelLimit,
      replies2ndLevelLimit,
      replies3rdLevelLimit,
    } = ctx.request.query;

    limit = parseInt(limit);
    if (limit <= 0) {
      ctx.status = 400;
      return;
    }

    let tree = await findCommentsByLocation(ctx, db, location, after, limit);

    ctx.body = map(tree);
  };
};

function map(nodes) {
  return {
    pageInfo: {
      hasNextPage: true,
      endCursor: nodes.length > 0 ? nodes[nodes.length - 1].id : null,
    },
    edges: nodes.map((item) => ({
      cursor: item.cursor,
      node: {
        id: item.id,
        author: item.author,
        text: item.text,
        parent: item.parent,
        created: item.created,
        repliesStartCursor: item.repliesStartCursor,
        replies: map(item.children),
      },
    })),
  };
}
