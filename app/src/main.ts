import '@fontsource-variable/archivo/standard.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@/style.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from '@/App.vue'
import { clockKey, systemClock } from '@/composables/clock'
import { i18n } from '@/i18n'
import { router } from '@/router'

const app = createApp(App)

app.provide(clockKey, systemClock)
app.use(createPinia())
app.use(i18n)
app.use(router)

app.mount('#app')
