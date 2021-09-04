module.exports = function batch({ db }) {
  return async function (ctx) {
    ctx.status = 200;
  };
};
