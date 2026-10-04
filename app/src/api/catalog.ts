import {
  categoryListSchema,
  productListResponseSchema,
  sellerPageResponseSchema,
  type CategoryList,
  type ProductListResponse,
  type SellerPageResponse,
} from '@timbre/contracts'
import { apiGet, type RequestOptions } from '@/api/client'

export function fetchCategories(options: RequestOptions = {}): Promise<CategoryList> {
  return apiGet('/categories', categoryListSchema, options)
}

export function fetchProducts(
  params: URLSearchParams,
  options: Omit<RequestOptions, 'params'> = {},
): Promise<ProductListResponse> {
  return apiGet('/products', productListResponseSchema, { ...options, params })
}

export function fetchSeller(
  slug: string,
  params: URLSearchParams,
  options: Omit<RequestOptions, 'params'> = {},
): Promise<SellerPageResponse> {
  return apiGet(`/sellers/${encodeURIComponent(slug)}`, sellerPageResponseSchema, {
    ...options,
    params,
  })
}
