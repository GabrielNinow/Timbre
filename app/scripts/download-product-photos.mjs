// Downloads the approved photos in product-photos.json, converts them to 800px WebP
// under app/public/img/photos/, and writes the credits the app and fixtures read.
//   node app/scripts/download-product-photos.mjs   (needs ImageMagick's `magick`)
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const here = new URL('.', import.meta.url)
const out = new URL('../public/img/photos/', here)
const creditsFile = new URL('../../packages/fixtures/src/photo-credits.json', here)
const HEADERS = { 'user-agent': 'TimbrePortfolio/1.0 (https://github.com/GabrielNinow/Timbre)' }

const list = JSON.parse(await readFile(new URL('./product-photos.json', here), 'utf8'))
await mkdir(out, { recursive: true })
const credits = {}
for (const item of list.filter((entry) => entry.approved)) {
  const response = await fetch(item.thumb, { headers: HEADERS })
  if (!response.ok) throw new Error(`${item.id}: ${response.status}`)
  const source = new URL(`${item.id}.download`, out).pathname
  await writeFile(source, Buffer.from(await response.arrayBuffer()))
  const target = new URL(`${item.id}.webp`, out).pathname
  // Fit inside 800×800 on white, so every card shows the whole instrument.
  execFileSync('magick', [source, '-resize', '800x800', '-background', 'white', '-gravity', 'center', '-extent', '800x800', '-quality', '78', target])
  execFileSync('rm', [source])
  credits[item.id] = { title: item.title, author: item.author, license: item.license, licenseUrl: item.licenseUrl, source: item.source }
  console.log('✓', item.id)
  await new Promise((resolve) => setTimeout(resolve, 150))
}
await writeFile(creditsFile, JSON.stringify(credits, null, 2) + '\n')
console.log(`${Object.keys(credits).length} photos`)
