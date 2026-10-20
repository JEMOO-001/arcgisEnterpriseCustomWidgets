const path = require('node:path')
const ts = require('../../client/node_modules/typescript')
const configPath = path.resolve(__dirname, '../../client/your-extensions/widgets/List_Custom_Widget/tsconfig.check.json')
const config = ts.readConfigFile(configPath, ts.sys.readFile)
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'))
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath))
const program = ts.createProgram(parsed.fileNames, parsed.options)
const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)]
console.log(diagnostics.length ? ts.formatDiagnosticsWithColorAndContext(diagnostics, {
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
  getCanonicalFileName: filename => filename
}) : 'List Category typecheck passed')
if (diagnostics.length) process.exitCode = 1
