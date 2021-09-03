const Koa = require('koa')
const app = new Koa()
const bodyParser = require('koa-bodyparser')
const cors = require('@koa/cors')
const { MongoClient } = require('mongodb')

const logger = require('./logger')
const webpages = require('./webpages')
const comments = require('./comments')
const batch = require('./batch')

;(async () => {
  const dbUrl = process.env.APP_DB_URL

  const db = await MongoClient.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then((client) => client.db())

  app
    .use(bodyParser({ strict: false }))
    .use(logger)
    .use(
      cors({
        allowMethods: 'GET, POST, DELETE',
      })
    )
    .use(webpages({ db }))
    .use(comments({ db }))
    .use(batch({}))

  app.listen(8000)
  console.log('Listening on 8000 ...')
})()
  .then(() => console.log('running'))
  .catch((err) => console.log(`Err: ${err}`))
