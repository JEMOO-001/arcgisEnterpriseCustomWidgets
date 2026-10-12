const path = require('path')
const ts = require('../../../..' + '/node_modules/typescript')
const configPath = path.resolve(__dirname, '../tsconfig.json')
const json = ts.readConfigFile(configPath, ts.sys.readFile)
const parsed = ts.parseJsonConfigFileContent(json.config, ts.sys, path.dirname(configPath))
const program = ts.createProgram(parsed.fileNames, parsed.options)
const diagnostics = [...(json.error ? [json.error] : []), ...parsed.errors, ...ts.getPreEmitDiagnostics(program)]
console.log(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
  getCanonicalFileName: filename => filename, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n'
}))
console.log(diagnostics.length ? `${diagnostics.length} type errors` : 'Widget type check passed.')
process.exitCode = diagnostics.length ? 1 : 0
