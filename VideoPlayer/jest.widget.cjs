const path = require('path')
const clientRoot = path.resolve(__dirname, '../../..')
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
  transform: { '^.+\\.tsx?$': [path.join(clientRoot, 'node_modules/ts-jest'), { isolatedModules: true, tsconfig: path.join(__dirname, 'tsconfig.json') }] },
  moduleNameMapper: {
    '^jimu-core$': path.join(clientRoot, 'dist/jimu-core/index.js'),
    '^esri/(.*)$': path.join(clientRoot, 'node_modules/@arcgis/core/$1.js')
  },
  cacheDirectory: '<rootDir>/work/jest-cache',
  clearMocks: true,
  reporters: ['default']
}
