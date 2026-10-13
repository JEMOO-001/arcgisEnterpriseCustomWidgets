const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const routes = {
  '/': { file: path.join(__dirname, 'stacking.html'), type: 'text/html' },
  '/widget.css': { file: path.join(__dirname, '../src/runtime/widget.css'), type: 'text/css' }
}

http.createServer((request, response) => {
  const route = routes[new URL(request.url, 'http://127.0.0.1').pathname]
  if (!route) {
    response.writeHead(404)
    response.end('Not found')
    return
  }
  response.writeHead(200, { 'Content-Type': `${route.type}; charset=utf-8`, 'Cache-Control': 'no-store' })
  response.end(fs.readFileSync(route.file))
}).listen(4178, '127.0.0.1', () => {
  console.log('Stacking fixture: http://127.0.0.1:4178/')
})
