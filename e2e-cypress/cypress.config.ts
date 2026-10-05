import { createRequire } from 'node:module'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'cypress'

// Workspaces hoist dependencies to the repo root; Cypress only looks next to the config.
const require = createRequire(import.meta.url)

export default defineConfig({
  // Flakiness gets fixed, not retried (docs/testability.md, CI).
  retries: 0,
  video: false,
  screenshotOnRunFailure: true,
  viewportWidth: 1280,
  viewportHeight: 900,
  defaultCommandTimeout: 6000,
  // One JSON per spec, merged into a single HTML report by CI (and `npm run cy:report`).
  reporter: require.resolve('mochawesome'),
  reporterOptions: { reportDir: 'reports/mochawesome', reportFilename: '[name]', overwrite: false, html: false, json: true },
  e2e: {
    baseUrl: 'http://localhost:4173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    setupNodeEvents(on) {
      on('task', {
        log(message: string) {
          console.log(message)
          return null
        },
      })
    },
  },
  component: {
    specPattern: 'cypress/component/**/*.cy.ts',
    supportFile: 'cypress/support/component.ts',
    indexHtmlFile: 'cypress/support/component-index.html',
    devServer: {
      framework: 'vue',
      bundler: 'vite',
      viteConfig: {
        plugins: [vue(), tailwindcss()],
        resolve: { alias: { '@': fileURLToPath(new URL('../app/src', import.meta.url)) } },
      },
    },
  },
})
