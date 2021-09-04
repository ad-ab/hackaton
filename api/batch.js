const findCommentById = require('./utils/findCommentById');

module.exports = function batch({ db }) {
  return async function (ctx) {
    const batchResult = [];
    for (let i = ctx.request.body.length - 1; i >= 0; i--) {
      const {
        id,
        location,
        limit,
        after,
        replies1stLevelLimit,
        replies2ndLevelLimit,
        replies3rdLevelLimit,
      } = ctx.request.body[i];

      if (id) {
        const comment = await findCommentById(db, id);
        if (comment) {
          batchResult.push(comment);
        }
      } else {
        // TODO: Implement 'list-comments' logic here ...
      }
    }

    ctx.body = batchResult;
  };
};
