import { spawn, type ChildProcess } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../..', import.meta.url))

/**
 * One API process per Playwright worker (docs/testability.md, Parallel isolation).
 * The store is in memory, so a worker's reset can never touch another worker.
 */
export async function startApi(port: number): Promise<{ url: string; stop: () => Promise<void> }> {
  // Node itself, not `npx`: a signal must reach the process that owns the port.
  const child: ChildProcess = spawn(process.execPath, ['--import', 'tsx', 'api/src/index.ts'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', TIMBRE_TEST_MODE: '1' },
    stdio: 'ignore',
  })
  const url = `http://127.0.0.1:${port}`
  const deadline = Date.now() + 20_000
  for (;;) {
    try {
      const response = await fetch(`${url}/api/categories`)
      if (response.ok) break
    } catch {
      // not listening yet
    }
    if (Date.now() > deadline) {
      child.kill('SIGKILL')
      throw new Error(`API on port ${port} did not start`)
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return {
    url,
    stop: () =>
      new Promise((resolve) => {
        if (child.exitCode !== null) return resolve()
        const force = setTimeout(() => child.kill('SIGKILL'), 3000)
        child.once('exit', () => {
          clearTimeout(force)
          resolve()
        })
        child.kill('SIGTERM')
      }),
  }
}
