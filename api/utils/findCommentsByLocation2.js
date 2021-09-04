const cursor = require('./cursor');

const generateQuery = (ids, limit) => {
  let query = [
    {
      $match: {
        parentId: { $in: ids },
      },
    },
    {
      $sort: {
        created: 1,
      },
    },
    {
      $group: {
        _id: '$parentId',
        items: {
          $push: '$$ROOT',
        },
      },
    },
    {
      $project: {
        items: { $slice: ['$items', limit + 1] },
      },
    },
    {
      $unwind: {
        path: '$items',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: '$items._id',
        parentId: '$items.parentId',
        author: '$items.author',
        text: '$items.text',
        created: '$items.created',
      },
    },
  ];

  return query;
};

module.exports = async function findCommentsByLocation(
  ctx,
  db,
  location,
  after,
  limit,
  limit1 = 0,
  limit2 = 0,
  limit3 = 0
) {
  const col = db.collection('comments');

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

  if ((limit2 && !limit1) || (limit3 && !limit2)) {
    ctx.status = 400;
    return;
  }

  let maxlimit = 3;

  if (!limit1) {
    maxlimit = 1;
  } else if (!limit2) {
    maxlimit = 2;
  } else if (!limit3) {
    maxlimit = 3;
  }

  let mongoQuery = [
    {
      $match: {
        $and: paramsArray,
      },
    },
    {
      $limit: limit,
    },
    {
      $sort: {
        created: 1,
      },
    },
  ];

  let results = [];

  results.push(
    await col.aggregate(mongoQuery, { allowDiskUse: true }).toArray()
  );

  const mongoQuery2 = generateQuery(
    results[0].map((x) => x._id),
    parseInt(limit1)
  );

  results.push(
    await col.aggregate(mongoQuery2, { allowDiskUse: true }).toArray()
  );

  if (maxlimit > 1) {
    const mongoQuery3 = generateQuery(
      results[1].map((x) => x._id),
      parseInt(limit2)
    );

    results.push(
      await col.aggregate(mongoQuery3, { allowDiskUse: true }).toArray()
    );
    if (maxlimit > 2) {
      const mongoQuery4 = generateQuery(
        results[2].map((x) => x._id),
        parseInt(limit3)
      );

      results.push(
        await col.aggregate(mongoQuery4, { allowDiskUse: true }).toArray()
      );
    }
  }

  let hashTable = {};

  for (let node of results[0]) {
    node.children = [];
    node.hasChildren = false;
    hashTable[node._id] = node;
  }
  for (let node of results[1]) {
    node.children = [];
    hashTable[node.parentId].hasChildren = true;
    hashTable[node._id] = node;

    if (maxlimit > 1) hashTable[node.parentId].children.push(node);
  }
  if (maxlimit > 1) {
    for (let node of results[2]) {
      node.children = [];
      hashTable[node._id] = node;
      hashTable[node.parentId].hasChildren = true;

      if (maxlimit > 2) hashTable[node.parentId].children.push(node);
    }
    if (maxlimit > 2) {
      for (let node of results[3]) {
        hashTable[node._id] = node;
        hashTable[node.parentId].children.push(node);
      }
    }
  }

  return map(results[0]);
};

function map(nodes = []) {
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
