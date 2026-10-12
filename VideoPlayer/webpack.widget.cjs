const path = require('path')
const clientRoot = path.resolve(__dirname, '../../..')
const sdk = require(path.join(clientRoot, 'webpack/webpack.common')).getCommon()
const CopyWebpackPlugin = require(path.join(clientRoot, 'node_modules/copy-webpack-plugin'))

module.exports = {
  mode: 'production',
  context: clientRoot,
  entry: {
    'dist/runtime/widget': [path.join(clientRoot, 'jimu-core/lib/set-public-path.ts'), path.join(__dirname, 'src/runtime/widget.tsx')],
    'dist/setting/setting': [path.join(clientRoot, 'jimu-core/lib/set-public-path.ts'), path.join(__dirname, 'src/setting/setting.tsx')]
  },
  output: { path: path.join(__dirname, 'build/VideoPlayer'), filename: '[name].js', libraryTarget: 'system', publicPath: '' },
  resolve: { alias: sdk.moduleAlias, extensions: sdk.extensions, mainFields: sdk.resolveMainFields },
  resolveLoader: { modules: [path.join(clientRoot, 'node_modules')] },
  module: { rules: sdk.getModuleRules(path.join(__dirname, 'tsconfig.json')) },
  externals: [sdk.externalFunction],
  optimization: { ...sdk.optimization, splitChunks: false, runtimeChunk: false },
  plugins: [new CopyWebpackPlugin({ patterns: ['manifest.json', 'config.json', 'icon.svg'].map(file => ({ from: path.join(__dirname, file), to: file })).concat([
    { from: path.join(__dirname, 'src/runtime/translations'), to: 'dist/runtime/translations' }
  ]) })],
  stats: 'errors-warnings'
}
