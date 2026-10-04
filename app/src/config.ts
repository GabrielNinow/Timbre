/** The home page's seller spotlight: `s-01`, Casa do Som. Fixed so the page is deterministic. */
export const SPOTLIGHT_SELLER_SLUG = 'casa-do-som'

export const HOME_ROW_SIZE = 8

/**
 * The Demo accounts (CONTEXT.md): their credentials are public on purpose, so any
 * Visitor can sign in. Mirrors `packages/fixtures`, which the app does not bundle.
 */
export const DEMO_PASSWORD = 'Teste@1234'
export const DEMO_ACCOUNTS = [
  { key: 'ana', name: 'Ana Souza', email: 'ana.souza@timbre.test' },
  { key: 'bruno', name: 'Bruno Lima', email: 'bruno.lima@timbre.test' },
  { key: 'locked', name: 'Conta bloqueada', email: 'bloqueado@timbre.test' },
  { key: 'slow', name: 'Login lento', email: 'lento@timbre.test' },
] as const
