// Finds a freely licensed Wikimedia Commons photo for each fixture product.
// Writes candidates to app/scripts/product-photos.json for review; download is a separate step.
//   node --import tsx app/scripts/find-product-photos.mjs
import { writeFile } from 'node:fs/promises'
import { products } from '../../packages/fixtures/src/index.ts'

const API = 'https://commons.wikimedia.org/w/api.php'
const HEADERS = { 'user-agent': 'TimbrePortfolio/1.0 (https://github.com/GabrielNinow/Timbre)' }
const FREE = /^(cc0|public domain|pd\b|cc by(-sa)? \d)/i

/** Portuguese packaging words that are not part of a model name. */
const NOISE = /\b(par|unidade|pe[cç]as|pratos|baquetas|cabo|palheta|pacote|encordoamento|suporte de guitarra|afinador|case r[ií]gido para guitarra|pedalboard|banco para bateria|fone|set|\d+m|\d+ª ger|\(|\))\b/gi

/**
 * Hand-written searches: [query, word the file title must contain]. Where Commons has
 * no photo of the exact model, the family or the kind of product stands in.
 */
const OVERRIDES = {
  'p-0102': [['Gibson Les Paul Studio', 'Les Paul'], ['Gibson Les Paul', 'Les Paul']],
  'p-0103': [['Squier Telecaster', 'Telecaster'], ['Fender Telecaster', 'Telecaster']],
  'p-0104': [['Tagima guitar', 'Tagima'], ['Telecaster guitar', 'Telecaster']],
  'p-0106': [['Ibanez RG guitar', 'Ibanez'], ['Ibanez electric guitar', 'Ibanez']],
  'p-0108': [['Fender Jazz Bass', 'Jazz Bass']],
  'p-0109': [['Music Man StingRay bass', 'StingRay'], ['Music Man StingRay', 'Stingray']],
  'p-0110': [['Gretsch Streamliner', 'Gretsch'], ['Gretsch guitar', 'Gretsch']],
  'p-0111': [['Strinberg guitar', 'Strinberg'], ['SG electric guitar', 'SG']],
  'p-0112': [['Cort bass guitar', 'Cort'], ['Cort Action', 'Cort']],
  'p-0113': [['Seizi guitar', 'Seizi'], ['Superstrat guitar', 'guitar']],
  'p-0114': [['Jackson Dinky', 'Jackson'], ['Jackson guitar', 'Jackson']],
  'p-0201': [['Roland Juno-DS', 'Juno'], ['Roland Juno', 'Juno']],
  'p-0203': [['Yamaha P-125', 'P-125'], ['Yamaha digital piano', 'Yamaha']],
  'p-0204': [['Korg Minilogue', 'minilogue']],
  'p-0205': [['Casio CT-S', 'Casio'], ['Casio keyboard', 'Casio']],
  'p-0206': [['Arturia KeyStep', 'KeyStep']],
  'p-0207': [['Novation Launchkey', 'Launchkey']],
  'p-0209': [['Nord Electro', 'Nord'], ['Nord Stage', 'Nord']],
  'p-0210': [['Alesis V25', 'Alesis'], ['Alesis keyboard', 'Alesis']],
  'p-0301': [['Pearl Export drum kit', 'Pearl'], ['Pearl drums', 'Pearl']],
  'p-0302': [['Tama Imperialstar', 'Tama'], ['Tama drum kit', 'Tama']],
  'p-0304': [['Zildjian cymbals', 'Zildjian']],
  'p-0305': [['drum kit', 'drum']],
  'p-0306': [['Meinl cymbal', 'Meinl']],
  'p-0307': [['Latin Percussion congas', 'conga'], ['congas', 'conga']],
  'p-0308': [['Vic Firth drumsticks', 'Vic Firth'], ['drumsticks', 'drumstick']],
  'p-0401': [['Focusrite Scarlett 2i2', 'Scarlett']],
  'p-0402': [['Audio-Technica ATH-M40x', 'ATH-M'], ['Audio-Technica headphones', 'Audio-Technica']],
  'p-0403': [['KRK Rokit', 'KRK'], ['KRK studio monitor', 'KRK']],
  'p-0405': [['Behringer UMC', 'Behringer'], ['Behringer U-Phoria', 'Behringer']],
  'p-0407': [['Yamaha HS5', 'HS5'], ['Yamaha HS studio monitor', 'Yamaha HS']],
  'p-0408': [['Universal Audio Volt', 'Volt'], ['Universal Audio interface', 'Universal Audio']],
  'p-0409': [['PreSonus Eris', 'Eris'], ['PreSonus monitor', 'PreSonus']],
  'p-0504': [['TC Electronic Hall of Fame', 'Hall of Fame'], ['TC Electronic pedal', 'TC Electronic']],
  'p-0507': [['Zoom G1 guitar effects', 'Zoom'], ['Zoom multi-effects', 'Zoom']],
  'p-0508': [['MXR Phase 90', 'Phase'], ['MXR pedal', 'MXR']],
  'p-0509': [['Boss RC-5 Loop Station', 'RC-5'], ['Boss Loop Station', 'Loop Station']],
  'p-0601': [['guitar cable jack', 'cable'], ['instrument cable', 'cable']],
  'p-0603': [['Elixir guitar strings', 'string'], ['guitar strings', 'string']],
  'p-0604': [['Hercules guitar stand', 'stand'], ['guitar stand', 'stand']],
  'p-0605': [['clip-on guitar tuner', 'tuner'], ['Korg tuner', 'tuner']],
  'p-0606': [['guitar hard case', 'case'], ['guitar case', 'case']],
  'p-0607': [['Pedaltrain pedalboard', 'pedalboard'], ['guitar pedalboard', 'pedalboard']],
  'p-0608': [['drum throne', 'throne'], ['drum stool', 'stool']],
  'p-0609': [['Shure SE215', 'SE215'], ['Shure in-ear monitors', 'Shure']],
}

function queriesFor(product) {
  const name = product.name.replace(/\(.*?\)/g, '').replace(NOISE, ' ').replace(/\s+/g, ' ').trim()
  const model = name.replace(new RegExp(`^${product.brand}\\s*`, 'i'), '').trim()
  const words = model.split(' ').filter((word) => word.length > 1)
  // The distinctive token a photo title must contain: the longest model word.
  const key = [...words].sort((a, b) => b.length - a.length)[0] ?? product.brand
  return { key, queries: [name, `${product.brand} ${words.slice(0, 2).join(' ')}`.trim()] }
}

const ENTITIES = { '&amp;': '&', '&quot;': '"', '&#39;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' }
const strip = (html = '') =>
  html.replace(/<[^>]+>/g, '').replace(/&(amp|quot|#39|lt|gt|nbsp);/g, (entity) => ENTITIES[entity]).replace(/\s+/g, ' ').trim()
/** Commons' fallback text when the author is not structured: keep only the name. */
const authorOf = (text) => text.replace(/^No machine-readable author provided\.\s*(.+?)\s+assumed \(based on copyright claims\)\.?$/, '$1')

async function search(query) {
  const params = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: '12',
    gsrsearch: `${query} filetype:bitmap`, prop: 'imageinfo', iiprop: 'url|extmetadata|mime|size', iiurlwidth: '800',
  })
  const response = await fetch(`${API}?${params}`, { headers: HEADERS })
  const body = await response.json()
  return Object.values(body.query?.pages ?? {}).sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
}

const results = []
for (const product of products) {
  const searches = OVERRIDES[product.id] ?? (({ key, queries }) => queries.map((query) => [query, key]))(queriesFor(product))
  const key = searches[0][1]
  let chosen = null
  for (const [query, required] of searches) {
    for (const page of await search(query)) {
      const info = page.imageinfo?.[0]
      const meta = info?.extmetadata ?? {}
      const license = strip(meta.LicenseShortName?.value)
      const title = page.title.replace(/^File:/, '')
      if (!info || !/image\/(jpeg|png)/.test(info.mime)) continue
      if (info.width < 600 || !FREE.test(license)) continue
      if (!title.toLowerCase().includes(required.toLowerCase())) continue
      chosen = {
        id: product.id,
        product: product.name,
        title,
        thumb: info.thumburl,
        source: info.descriptionurl,
        author: authorOf(strip(meta.Artist?.value)) || 'Unknown',
        license,
        licenseUrl: meta.LicenseUrl?.value ?? null,
      }
      break
    }
    if (chosen) break
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  results.push(chosen ?? { id: product.id, product: product.name, title: null, key })
  console.log(product.id, chosen ? `✓ ${chosen.title} [${chosen.license}]` : `· none (key "${key}")`)
  await new Promise((resolve) => setTimeout(resolve, 250))
}
await writeFile(new URL('./product-photos.json', import.meta.url), JSON.stringify(results, null, 2) + '\n')
console.log(`${results.filter((r) => r.title).length}/${results.length} found`)
