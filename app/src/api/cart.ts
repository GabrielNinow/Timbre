import { cartSchema, type Cart, type Currency } from '@timbre/contracts'
import { apiSend } from '@/api/client'
import { writeStored } from '@/lib/storage'

/** The server owns the cart (rule 4); the client only remembers a guest cart's id. */
function remember(cart: Cart): Cart {
  writeStored('cart', cart.id)
  return cart
}

export async function addCartItem(
  item: { productId: string; variantOptionId?: string; quantity: number },
  currency: Currency,
): Promise<Cart> {
  const cart = await apiSend('/cart/items', cartSchema, {
    method: 'POST',
    body: item,
    params: new URLSearchParams(currency === 'BRL' ? {} : { currency }),
  })
  return remember(cart)
}
