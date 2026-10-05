/**
 * Public files (product images) live under the build's base path: `/` in
 * development, `/Timbre/` on GitHub Pages. The API returns root-relative paths.
 */
export function assetUrl(path: string): string {
  if (!path.startsWith('/')) return path
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`
}
