const Koa = require('koa');
const app = new Koa();
const bodyParser = require('koa-bodyparser');
const { MongoClient } = require('mongodb');

const logger = require('./logger');
const webpages = require('./webpages');
const comments = require('./comments');
const batch = require('./batch');

const port = process.env.NODE_ENV === 'production' ? 80 : 8000;
(async () => {
  const dbUrl = process.env.APP_DB_URL || 'mongodb://localhost:27017';

  const db = await MongoClient.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then((client) => client.db());

  app
    .use(bodyParser({ strict: false }))
    .use(logger)
    .use(webpages({ db }))
    .use(comments({ db }))
    .use(batch({}));

  app.listen(port);
})()
  .then(() => console.log(`Listening on ${port} ...`))
  .catch((err) => console.log(`Err: ${err}`));
