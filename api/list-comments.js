const { is, number, object, optional, string } = require('superstruct');
const cursor = require('./utils/cursor');
const { v4: uuid } = require('uuid');
const validate = require('./utils/validate');

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

    let level = 1;

    limit = parseInt(limit);
    if (limit <= 0) {
      ctx.status = 400;
      return;
    }

    let paramsArray = [{ location }];

    if (after === undefined) paramsArray.push({ parentId: null });
    else {
      var afterParams = cursor.decode(after);
      if (afterParams.length != 2) {
        ctx.status = 400;
        return;
      }
      paramsArray.push({ parentId: afterParams[0] });
      paramsArray.push({ created: { $gt: parseInt(afterParams[1]) } });
    }

    let mongoQuery = [
      {
        $match: {
          $and: paramsArray,
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

    let result = await col
      .aggregate(mongoQuery, { allowDiskUse: true })
      .toArray();

    var tree = [];
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
      tree.push(createDataTree(item.children));
    }

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

function createDataTree(dataset) {
  const hashTable = Object.create(null);
  // dataset.push({ parent: { id: null }, id: rootId })
  dataset.forEach(
    (aData) =>
      (hashTable[aData._id] = {
        cursor: cursor.encode(aData.parentId || 0, aData.created),
        id: aData._id,
        author: aData.author,
        text: aData.text,
        parent: aData.parentId ? { id: aData.parentId } : null,
        created: aData.created,
        repliesStartCursor: cursor.encode(aData._id || 0, aData.created),
        children: [],
      })
  );
  let dataTree = {};
  dataset.forEach((aData) => {
    if (aData.parentId)
      hashTable[aData.parentId].children.push(hashTable[aData._id]);
    else dataTree = hashTable[aData._id];
  });
  return dataTree;
}
