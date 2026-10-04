import type { Currency, ProductDetail, ProductSummary, SellerRef, User } from '@timbre/contracts'
import { stockOf } from './catalog.js'
import { convert } from './currency.js'
import type { Store, StoreProduct, StoreUser } from './store.js'

export function toSellerRef(store: Store, sellerId: string): SellerRef {
  const seller = store.sellerById(sellerId)
  if (!seller) throw new Error(`Seller missing from fixtures: ${sellerId}`)
  return {
    id: seller.id,
    name: seller.name,
    slug: seller.slug,
    tier: seller.tier,
    state: seller.state,
  }
}

export function toProductSummary(
  store: Store,
  product: StoreProduct,
  currency: Currency,
): ProductSummary {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    categoryId: product.categoryId,
    price: convert(product.price, currency),
    listPrice: product.listPrice === null ? null : convert(product.listPrice, currency),
    condition: product.condition,
    year: product.year,
    stock: stockOf(product),
    freeShipping: product.freeShipping,
    imageUrl: product.imageUrl,
    rating: product.rating,
    reviewCount: product.reviewCount,
    listedAt: product.listedAt,
    sponsored: product.sponsored,
    seller: toSellerRef(store, product.sellerId),
  }
}

export function toProductDetail(store: Store, product: StoreProduct, currency: Currency): ProductDetail {
  const base = convert(product.price, currency)
  return {
    ...toProductSummary(store, product, currency),
    currency,
    description: product.description,
    images: [...product.images],
    specs: product.specs.map((spec) => ({ ...spec })),
    ...(product.variants
      ? {
          variants: product.variants.map((group) => ({
            label: group.label,
            // A delta converts as unit prices do: base + delta in the currency equals the
            // converted option price, so the buy path and the product page always agree.
            options: group.options.map((option) => ({
              ...option,
              priceDelta: convert(product.price + option.priceDelta, currency) - base,
            })),
          })),
        }
      : {}),
  }
}

export function toUser(user: StoreUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  }
}

export function availableStock(product: StoreProduct, variantOptionId: string | null): number {
  if (!product.variants) return product.stock ?? 0
  const option = product.variants
    .flatMap((group) => group.options)
    .find((candidate) => candidate.id === variantOptionId)
  return option?.stock ?? 0
}

export function findVariantOption(product: StoreProduct, optionId: string) {
  for (const group of product.variants ?? []) {
    const option = group.options.find((candidate) => candidate.id === optionId)
    if (option) return { group, option }
  }
  return undefined
}
