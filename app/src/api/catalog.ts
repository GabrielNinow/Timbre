import {
  categoryListSchema,
  notifyMeResponseSchema,
  productDetailSchema,
  shippingQuoteResponseSchema,
  type Currency,
  type ProductDetail,
  type ShippingQuoteResponse,
  productListResponseSchema,
  sellerPageResponseSchema,
  type CategoryList,
  type ProductListResponse,
  type SellerPageResponse,
} from '@timbre/contracts'
import { apiGet, apiSend, type RequestOptions } from '@/api/client'

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

const withCurrency = (currency: Currency) => new URLSearchParams(currency === 'BRL' ? {} : { currency })

export function fetchProduct(
  id: string,
  currency: Currency,
  options: Omit<RequestOptions, 'params'> = {},
): Promise<ProductDetail> {
  return apiGet(`/products/${encodeURIComponent(id)}`, productDetailSchema, {
    ...options,
    params: withCurrency(currency),
  })
}

export function requestNotify(productId: string, email: string): Promise<{ ok: true }> {
  return apiSend(`/products/${encodeURIComponent(productId)}/notify`, notifyMeResponseSchema, {
    method: 'POST',
    body: { email },
  })
}

export function quoteShipping(cep: string, currency: Currency): Promise<ShippingQuoteResponse> {
  return apiSend('/shipping/quote', shippingQuoteResponseSchema, {
    method: 'POST',
    body: { cep },
    params: withCurrency(currency),
  })
}

