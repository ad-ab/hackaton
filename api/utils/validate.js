const { validate } = require('superstruct');

module.exports = (data, schema, ctx) => {
  const [error, result] = validate(data, schema);

  if (!result) {
    console.error(`${ctx.method} ${ctx.url} ${error.message}`);
    return;
  }

  return result;
};
