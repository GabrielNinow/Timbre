import type { ProductDetail, ProductSummary, SellerRef, User } from '@timbre/contracts'
import { stockOf } from './catalog.js'
import type { Store, StoreProduct, StoreUser } from './store.js'

export function toSellerRef(store: Store, sellerId: string): SellerRef {
  const seller = store.sellerById(sellerId)
  if (!seller) throw new Error(`Vendedor inexistente no fixture: ${sellerId}`)
  return {
    id: seller.id,
    name: seller.name,
    slug: seller.slug,
    tier: seller.tier,
    state: seller.state,
  }
}

export function toProductSummary(store: Store, product: StoreProduct): ProductSummary {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    categoryId: product.categoryId,
    price: product.price,
    listPrice: product.listPrice,
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

export function toProductDetail(store: Store, product: StoreProduct): ProductDetail {
  return {
    ...toProductSummary(store, product),
    description: product.description,
    images: [...product.images],
    specs: product.specs.map((spec) => ({ ...spec })),
    ...(product.variants
      ? {
          variants: product.variants.map((group) => ({
            label: group.label,
            options: group.options.map((option) => ({ ...option })),
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
