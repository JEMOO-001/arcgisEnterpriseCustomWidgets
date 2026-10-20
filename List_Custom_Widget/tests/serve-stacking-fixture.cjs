const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const webpack = require('../../client/node_modules/webpack')
const client = path.resolve(__dirname, '../../client')
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'list-category-preview-'))

const routes = {
  '/': { file: path.join(__dirname, 'preview.html'), type: 'text/html' },
  '/stacking': { file: path.join(__dirname, 'stacking.html'), type: 'text/html' },
  '/widget-preview.js': { file: path.join(output, 'widget-preview.js'), type: 'text/javascript' },
  '/widget.css': { file: path.join(__dirname, '../src/runtime/widget.css'), type: 'text/css' }
}

const server = http.createServer((request, response) => {
  const route = routes[new URL(request.url, 'http://127.0.0.1').pathname]
  if (!route) {
    response.writeHead(404)
    response.end('Not found')
    return
  }
  response.writeHead(200, { 'Content-Type': `${route.type}; charset=utf-8`, 'Cache-Control': 'no-store' })
  response.end(fs.readFileSync(route.file))
})

webpack({
  mode: 'development',
  devtool: false,
  entry: path.join(__dirname, 'preview.tsx'),
  output: { path: output, filename: 'widget-preview.js' },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    modules: [path.join(client, 'node_modules')],
    alias: Object.fromEntries(['jimu-core$', 'jimu-ui$', 'jimu-arcgis$'].map(name => [name, path.join(__dirname, 'sdk-boundary.tsx')]))
  },
  module: { rules: [
    { test: /\.tsx?$/, use: { loader: path.join(client, 'node_modules/ts-loader'), options: {
      transpileOnly: true,
      configFile: path.join(__dirname, 'tsconfig.preview.json')
    } } },
    { test: /\.css$/, use: [path.join(client, 'node_modules/style-loader'), path.join(client, 'node_modules/css-loader')] }
  ] }
}, (error, stats) => {
  if (error || stats.hasErrors()) {
    console.error(error || stats.toString({ all: false, errors: true }))
    process.exitCode = 1
    return
  }
  server.listen(4178, '127.0.0.1', () => console.log('Real widget preview (sample SDK boundary): http://127.0.0.1:4178/; grid regression: /stacking'))
})
