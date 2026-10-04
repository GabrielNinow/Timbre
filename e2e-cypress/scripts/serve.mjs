// Serves what CI tests: the production build of the app, and the API in test mode.
// Used by start-server-and-test; stops both processes together.
import { spawn } from 'node:child_process'

const root = new URL('../..', import.meta.url).pathname
const run = (args, env = {}) =>
  spawn('npm', args, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } })

const api = run(['run', 'api:start'], { TIMBRE_TEST_MODE: '1' })
const app = run(['run', 'app:preview'])
const stop = () => {
  api.kill('SIGTERM')
  app.kill('SIGTERM')
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
for (const child of [api, app]) child.on('exit', (code) => {
  stop()
  process.exit(code ?? 0)
})
