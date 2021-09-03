const Koa = require('koa')
const app = new Koa()

app.use(async (ctx) => {
  console.log(`${ctx.method} ${ctx.url}`)
  ctx.body = 'OK'
})

app.listen(8000)
console.log('Listening on 8000 ...')
