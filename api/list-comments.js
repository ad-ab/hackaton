const { is, number, object, optional, string } = require('superstruct');
const cursor = require('./utils/cursor');
const { v4: uuid } = require('uuid');

module.exports = function ({ db }) {
  return async function get(ctx) {
    const col = db.collection('comments');

    const paramsObject = object({
      location: string(),
    });

    const queryParamsObject = object({
      limit: string(),
      after: optional(string()),
      replies1stLevelLimit: optional(number()),
      replies2ndLevelLimit: optional(number()),
      replies3rdLevelLimit: optional(number()),
    });

    if (
      !is(ctx.params, paramsObject) ||
      !is(ctx.request.query, queryParamsObject)
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

    let level = 1;

    limit = parseInt(limit);
    if (limit <= 0) {
      ctx.status = 400;
      return;
    }

    let paramsArray = [{ location }];

    if (after === undefined) paramsArray.push({ parentId: null });

    let mongoQuery = [
      {
        $match: {
          $and:
            // {
            //   created: {
            //     $gte: 1630709278772,
            //   },
            // },
            paramsArray,
        },
      },
      {
        $graphLookup: {
          from: 'comments',
          startWith: '$_id',
          connectFromField: '_id',
          connectToField: 'parentId',
          as: 'children',
          maxDepth: 2,
          depthField: 'level',
        },
      },
      {
        $limit: limit,
      },
    ];

    let result = await col.aggregate(mongoQuery).toArray();

    var tree = { edges: [] };
    for (var item of result) {
      item.children.sort((a, b) => {
        if (a.level > b.level) return 1;
        else if (a.level < b.level) return -1;
        else {
          return a.created > b.created ? 1 : b.created > a.created ? -1 : 0;
        }
      });
      item.children.push({
        _id: item._id,
        author: item.author,
        text: item.text,
        parent: item.parentId,
        created: item.created,
      });
      tree.edges.push(createDataTree(item.children));
    }

    ctx.body = tree;
  };
};

function createDataTree(dataset) {
  const hashTable = Object.create(null);
  // dataset.push({ parent: { id: null }, id: rootId })
  dataset.forEach(
    (aData) =>
      (hashTable[aData._id] = {
        cursor: cursor.encode(aData.parentId || 0, aData.created),
        node: {
          id: aData._id,
          author: aData.author,
          text: aData.text,
          parent: aData.parentId ? { id: aData.parentId } : null,
          created: aData.created,
          repliesStartCursor: cursor.encode(aData._id || 0, aData.created),
          replies: [],
        },
      })
  );
  const dataTree = [];
  dataset.forEach((aData) => {
    if (aData.parentId)
      hashTable[aData.parentId].node.replies.push(hashTable[aData._id]);
    else dataTree.push(hashTable[aData._id]);
  });
  return dataTree;
}
