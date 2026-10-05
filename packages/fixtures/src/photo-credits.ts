import data from './photo-credits.json' with { type: 'json' }

/**
 * Freely licensed Wikimedia Commons photos for the products that have one, written
 * by `app/scripts/download-product-photos.mjs`. Every photo shown is credited on the
 * app's credits page. Products without an entry keep their generated placeholder.
 */
export interface PhotoCredit {
  title: string
  author: string
  license: string
  licenseUrl: string | null
  source: string
}

export const photoCredits: Readonly<Record<string, PhotoCredit>> = data
