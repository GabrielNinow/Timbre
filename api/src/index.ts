import { buildApp } from './app.js'

const port = Number(process.env.PORT ?? 3333)
const host = process.env.HOST ?? '127.0.0.1'

const { app } = await buildApp({ logger: true })

try {
  await app.listen({ port, host })
  app.log.info(
    `Timbre API on http://${host}:${port} — test mode ${process.env.TIMBRE_TEST_MODE === '1' ? 'on' : 'off'}`,
  )
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
