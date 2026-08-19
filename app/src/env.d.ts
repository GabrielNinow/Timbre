/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_KITCHEN_SINK?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}