import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { products } from '../../packages/fixtures/src/products.ts'
const here = dirname(fileURLToPath(import.meta.url))
const outDir = join(here, '..', 'public', 'img', 'products')
const SUNKEN = '#E6E4DF'
const LINE_HEAVY = '#C3C0B9'
const MUTED = '#63706E'
const FAINT = '#8D9895'

const glyphs = {
  'c-01': `
    <g transform="translate(0,-30)">
    <rect x="336" y="112" width="60" height="44" rx="10"/>
    <rect x="350" y="150" width="32" height="150" rx="6"/>
    <path d="M366 286c-48 0-92 28-92 70 0 32 32 40 32 62 0 30-50 38-50 76 0 32 46 54 110 54s110-22 110-54c0-38-50-46-50-76 0-22 32-30 32-62 0-42-44-70-92-70Z"/>
    <circle cx="366" cy="404" r="32"/>
    </g>`,
  'c-02': `
    <rect x="228" y="268" width="344" height="164" rx="12"/>
    <path d="M285 268v164M342 268v164M400 268v164M457 268v164M514 268v164"/>
    <rect x="266" y="268" width="30" height="92" rx="4"/>
    <rect x="380" y="268" width="30" height="92" rx="4"/>
    <rect x="438" y="268" width="30" height="92" rx="4"/>`,
  'c-03': `
    <ellipse cx="400" cy="266" rx="150" ry="52"/>
    <path d="M250 266v148a150 52 0 0 0 300 0V266"/>
    <path d="M292 300v148M400 318v148M508 300v148"/>`,
  'c-04': `
    <rect x="358" y="150" width="84" height="168" rx="42"/>
    <path d="M310 288a90 90 0 0 0 180 0"/>
    <path d="M400 378v72M336 450h128"/>`,
  'c-05': `
    <rect x="262" y="192" width="276" height="272" rx="18"/>
    <circle cx="400" cy="272" r="42"/>
    <path d="M400 244v28"/>
    <rect x="342" y="368" width="116" height="48" rx="24"/>`,
  'c-06': `
    <rect x="212" y="382" width="66" height="42" rx="10"/>
    <rect x="522" y="382" width="66" height="42" rx="10"/>
    <path d="M278 403c48 0 40-140 122-140s74 140 122 140"/>`,
}
function escapeXml(value) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char],
  )
}
function svgFor(product) {
  const glyph = glyphs[product.categoryId]
  if (!glyph) throw new Error(`sem glifo para a categoria ${product.categoryId}`)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-labelledby="t-${product.id}">
  <title id="t-${product.id}">${escapeXml(product.name)}</title>
  <rect width="800" height="800" fill="${SUNKEN}"/>
  <g fill="none" stroke="${LINE_HEAVY}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">${glyph}
  </g>
  <text x="400" y="596" text-anchor="middle" fill="${MUTED}" font-family="Archivo Variable, Archivo, Helvetica Neue, Arial, sans-serif" font-size="46" font-weight="600">${escapeXml(product.brand)}</text>
  <text x="400" y="648" text-anchor="middle" fill="${FAINT}" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="24" letter-spacing="2">${product.id.toUpperCase()}</text>
</svg>
`
}
await mkdir(outDir, { recursive: true })
const expected = new Set(products.map((product) => `${product.id}.svg`))
for (const existing of await readdir(outDir).catch(() => [])) {
  if (!expected.has(existing)) await rm(join(outDir, existing))
}
for (const product of products) {
  await writeFile(join(outDir, `${product.id}.svg`), svgFor(product), 'utf8')
}
console.log(`${products.length} placeholders escritos em ${outDir}`)