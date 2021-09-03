const fs = require('fs')
const csvStringify = require('csv-stringify/lib/sync')

const FILE_PATH_TXT = './log.txt'
const FILE_PATH_CSV = './log.csv'

module.exports = async function logger(ctx, next) {
  const time = new Date().toISOString()

  fs.appendFileSync(FILE_PATH_TXT, `${time}: ${ctx.method} ${ctx.url}\n`)
  fs.appendFileSync(
    FILE_PATH_CSV,
    csvStringify([
      {
        time,
        method: ctx.method,
        url: ctx.url,
        body: ctx.request.body ? JSON.stringify(ctx.request.body) : '',
      },
    ])
  )

  console.log(`${ctx.method} ${ctx.url}`)
  return next()
}
