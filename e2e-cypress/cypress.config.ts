import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'cypress'

export default defineConfig({
  // Flakiness gets fixed, not retried (docs/testability.md, CI).
  retries: 0,
  video: false,
  screenshotOnRunFailure: true,
  viewportWidth: 1280,
  viewportHeight: 900,
  defaultCommandTimeout: 6000,
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
