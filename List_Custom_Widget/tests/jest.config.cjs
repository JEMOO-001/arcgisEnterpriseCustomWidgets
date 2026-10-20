const path = require('node:path')
const client = path.resolve(__dirname, '../../client')

module.exports = {
  rootDir: path.resolve(__dirname, '..'),
  testEnvironment: path.join(client, 'node_modules/jest-environment-jsdom'),
  moduleDirectories: [path.join(client, 'node_modules'), 'node_modules'],
  transform: {
    '^.+\\.tsx?$': [path.join(client, 'node_modules/ts-jest'), {
      isolatedModules: true,
      tsconfig: { jsx: 'react', module: 'commonjs', target: 'es2020', esModuleInterop: true }
    }]
  },
  moduleNameMapper: {
    '^jimu-(core|arcgis|ui)$': '<rootDir>/tests/sdk-boundary.tsx',
    '\\.css$': '<rootDir>/tests/style-boundary.cjs'
  },
  setupFilesAfterEnv: [path.join(client, 'node_modules/@testing-library/jest-dom')],
  testMatch: ['<rootDir>/tests/*.test.tsx']
}
