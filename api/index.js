const Koa = require('koa')
const app = new Koa()
const bodyParser = require('koa-bodyparser');

app.use(bodyParser());

app.use(async (ctx) => {

  console.log(`${ctx.method} ${ctx.url} ${JSON.stringify(ctx.request.body.test,null, 2)}`)
  ctx.body = 'OK'
})

app.listen(8000)
console.log('Listening on 8000 ...')
