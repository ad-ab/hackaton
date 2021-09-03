const Koa = require('koa')
const app = new Koa()
const bodyParser = require('koa-bodyparser')
const logger = require('./logger')

app.use(bodyParser({ strict: false }))
app.use(logger)

app.listen(8000)
console.log('Listening on 8000 ...')
