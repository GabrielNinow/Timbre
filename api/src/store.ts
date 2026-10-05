import type {
  Address,
  Condition,
  ErrorCode,
  Order,
  ProductSpec,
  ShippingMethodId,
} from '@timbre/contracts'
import { DEFAULT_CEP } from '@timbre/contracts'
import {
  categories,
  ceps,
  coupons,
  FIRST_CART_SEQUENCE,
  FIRST_ORDER_NUMBER,
  FIXTURE_NOW,
  NEXT_USER_SEQUENCE,
  ORDER_NUMBER_PREFIX,
  orders as orderFixtures,
  products as productFixtures,
  sellers,
  users as userFixtures,
  type CategoryFixture,
  type CepFixture,
  type CouponFixture,
  type SellerFixture,
} from '@timbre/fixtures'

export interface StoreVariantOption {
  id: string
  name: string
  priceDelta: number
  stock: number
}

export interface StoreVariantGroup {
  label: string
  options: StoreVariantOption[]
}

export interface StoreProduct {
  id: string
  slug: string
  name: string
  brand: string
  categoryId: string
  sellerId: string
  price: number
  listPrice: number | null
  condition: Condition
  year: number | null
  stock: number | null
  freeShipping: boolean
  imageUrl: string
  images: string[]
  rating: number
  reviewCount: number
  listedAt: string
  sponsored: boolean
  description: string
  specs: ProductSpec[]
  variants?: StoreVariantGroup[]
}

export interface StoreUser {
  id: string
  name: string
  email: string
  password: string
  createdAt: string
  token: string
  locked: boolean
  loginDelayMs: number
  addresses: Address[]
  hidden: boolean
}

export interface StoreCartLine {
  id: string
  productId: string
  variantOptionId: string | null
  quantity: number
}

export interface StoreCart {
  id: string
  userId: string | null
  cep: string
  couponCode: string | null
  selectedShippingId: ShippingMethodId
  lines: StoreCartLine[]
}

export interface ArmedFailure {
  route: string
  method: string | null
  path: string
  remaining: number
  status: number
  code: ErrorCode
}

/** Bump when the snapshot shape changes: an old snapshot is then ignored, not misread. */
export const SNAPSHOT_VERSION = 1

export interface StoreSnapshot {
  version: number
  products: StoreProduct[]
  users: StoreUser[]
  orders: Order[]
  carts: Array<[string, StoreCart]>
  notifyRequests: Array<[string, string[]]>
  sequences: { cart: number; order: number; user: number; line: number }
}

export class Store {
  products: StoreProduct[] = []
  users: StoreUser[] = []
  orders: Order[] = []
  carts = new Map<string, StoreCart>()
  failures: ArmedFailure[] = []
  /** Notify-me requests, `productId` → emails. Nothing is ever sent. */
  notifyRequests = new Map<string, Set<string>>()

  readonly sellers: readonly SellerFixture[] = sellers
  readonly categories: readonly CategoryFixture[] = categories
  readonly coupons: readonly CouponFixture[] = coupons
  readonly ceps: readonly CepFixture[] = ceps

  now = FIXTURE_NOW

  private cartSeq = FIRST_CART_SEQUENCE
  private orderSeq = FIRST_ORDER_NUMBER
  private userSeq = NEXT_USER_SEQUENCE
  private lineSeq = 1

  constructor() {
    this.reset()
  }

  reset(): void {
    this.products = structuredClone(productFixtures) as unknown as StoreProduct[]
    this.users = structuredClone(userFixtures) as unknown as StoreUser[]
    this.carts = new Map()
    this.failures = []
    this.notifyRequests = new Map()
    this.now = FIXTURE_NOW
    this.cartSeq = FIRST_CART_SEQUENCE
    this.orderSeq = FIRST_ORDER_NUMBER
    this.userSeq = NEXT_USER_SEQUENCE
    this.lineSeq = 1
    this.orders = orderFixtures.map((fixture) => this.buildSeededOrder(fixture))
  }

  /**
   * Everything a Visitor can change, as plain data. The public demo saves it in the
   * browser after every mutation and restores it on load (ADR 0004).
   */
  snapshot(): StoreSnapshot {
    return structuredClone({
      version: SNAPSHOT_VERSION,
      products: this.products,
      users: this.users,
      orders: this.orders,
      carts: [...this.carts.entries()],
      notifyRequests: [...this.notifyRequests.entries()].map(([id, emails]) => [id, [...emails]] as [string, string[]]),
      sequences: { cart: this.cartSeq, order: this.orderSeq, user: this.userSeq, line: this.lineSeq },
    })
  }

  /** Restores a snapshot; returns false (and keeps the fixtures) when it is unusable. */
  restore(snapshot: unknown): boolean {
    const data = snapshot as Partial<StoreSnapshot> | null
    if (!data || data.version !== SNAPSHOT_VERSION || !Array.isArray(data.products) || !data.sequences) return false
    const copy = structuredClone(data as StoreSnapshot)
    // Listing content (photos, copy, prices) comes from the current fixtures, so a deploy
    // reaches Visitors with a saved shop; only stock, the one thing they change, is kept.
    const saved = new Map(copy.products.map((product) => [product.id, product]))
    this.products = (structuredClone(productFixtures) as unknown as StoreProduct[]).map((product) => {
      const old = saved.get(product.id)
      if (!old) return product
      product.stock = old.stock
      for (const option of product.variants?.flatMap((group) => group.options) ?? []) {
        const before = old.variants?.flatMap((group) => group.options).find((o) => o.id === option.id)
        if (before) option.stock = before.stock
      }
      return product
    })
    this.users = copy.users
    this.orders = copy.orders
    // A cart line for a product that is no longer listed is dropped, not left dangling.
    const listed = new Set(this.products.map((product) => product.id))
    for (const [, cart] of copy.carts) cart.lines = cart.lines.filter((line) => listed.has(line.productId))
    this.carts = new Map(copy.carts)
    this.notifyRequests = new Map(copy.notifyRequests.map(([id, emails]) => [id, new Set(emails)]))
    this.cartSeq = copy.sequences.cart
    this.orderSeq = copy.sequences.order
    this.userSeq = copy.sequences.user
    this.lineSeq = copy.sequences.line
    return true
  }

  requestNotify(productId: string, email: string): void {
    const emails = this.notifyRequests.get(productId) ?? new Set<string>()
    emails.add(email)
    this.notifyRequests.set(productId, emails)
  }

  private buildSeededOrder(fixture: (typeof orderFixtures)[number]): Order {
    const items = fixture.items.map((item, index) => {
      const product = this.productById(item.productId)
      if (!product) throw new Error(`Fixture de pedido aponta para produto inexistente: ${item.productId}`)
      const seller = this.sellerById(product.sellerId)
      const option = item.variantOptionId
        ? product.variants?.flatMap((group) => group.options).find((o) => o.id === item.variantOptionId)
        : undefined
      return {
        id: `${fixture.number}-${index + 1}`,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        imageUrl: product.imageUrl,
        variantName: option?.name ?? null,
        sellerId: product.sellerId,
        sellerName: seller?.name ?? 'Seller',
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        lineTotal: item.unitPrice * item.quantity,
      }
    })
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
    return {
      id: fixture.number,
      number: fixture.number,
      status: fixture.status,
      currency: fixture.currency,
      createdAt: fixture.createdAt,
      userId: fixture.userId,
      items,
      coupon: fixture.couponCode
        ? { code: fixture.couponCode, discount: fixture.couponDiscount }
        : null,
      shipping: {
        address: structuredClone(fixture.shipping.address) as Address,
        methodId: fixture.shipping.methodId,
        price: fixture.shipping.price,
        etaDays: fixture.shipping.etaDays,
      },
      payment: { ...fixture.payment },
      totals: {
        subtotal,
        couponDiscount: fixture.couponDiscount,
        shipping: fixture.shipping.price,
        total: Math.max(0, subtotal - fixture.couponDiscount + fixture.shipping.price),
      },
    }
  }

  productById(id: string): StoreProduct | undefined {
    return this.products.find((product) => product.id === id)
  }

  sellerById(id: string): SellerFixture | undefined {
    return this.sellers.find((seller) => seller.id === id)
  }

  sellerBySlug(slug: string): SellerFixture | undefined {
    return this.sellers.find((seller) => seller.slug === slug)
  }

  categoryBySlug(slug: string): CategoryFixture | undefined {
    return this.categories.find((category) => category.slug === slug)
  }

  couponByCode(code: string): CouponFixture | undefined {
    return this.coupons.find((coupon) => coupon.code === code.toUpperCase())
  }

  userByEmail(email: string): StoreUser | undefined {
    const normalized = email.trim().toLowerCase()
    return this.users.find((user) => user.email === normalized)
  }

  userByToken(token: string): StoreUser | undefined {
    return this.users.find((user) => user.token === token)
  }

  userById(id: string): StoreUser | undefined {
    return this.users.find((user) => user.id === id)
  }

  createUser(input: { name: string; email: string; password: string }): StoreUser {
    const sequence = this.userSeq++
    const id = `u-${String(sequence).padStart(2, '0')}`
    const user: StoreUser = {
      id,
      name: input.name,
      email: input.email,
      password: input.password,
      createdAt: this.now,
      token: `tok_${id}_novo`,
      locked: false,
      loginDelayMs: 0,
      addresses: [],
      hidden: false,
    }
    this.users.push(user)
    return user
  }

  createCart(userId: string | null): StoreCart {
    const cart: StoreCart = {
      id: `cart_${this.cartSeq++}`,
      userId,
      cep: DEFAULT_CEP,
      couponCode: null,
      selectedShippingId: 'standard',
      lines: [],
    }
    this.carts.set(cart.id, cart)
    return cart
  }

  cartById(id: string): StoreCart | undefined {
    return this.carts.get(id)
  }

  cartForUser(userId: string): StoreCart {
    for (const cart of this.carts.values()) {
      if (cart.userId === userId) return cart
    }
    return this.createCart(userId)
  }

  nextLineId(): string {
    return `line_${this.lineSeq++}`
  }

  nextOrderNumber(): string {
    return `${ORDER_NUMBER_PREFIX}${this.orderSeq++}`
  }

  orderById(id: string): Order | undefined {
    return this.orders.find((order) => order.id === id)
  }

  armFailure(rule: { route: string; times: number; status: number; code: ErrorCode }): ArmedFailure {
    const [head = '', tail] = rule.route.trim().split(/\s+/)
    const hasMethod = tail !== undefined
    const armed: ArmedFailure = {
      route: rule.route,
      method: hasMethod ? head.toUpperCase() : null,
      path: hasMethod ? tail : head,
      remaining: rule.times,
      status: rule.status,
      code: rule.code,
    }
    this.failures.push(armed)
    return armed
  }

  takeFailure(method: string, url: string): ArmedFailure | undefined {
    const path = url.split('?')[0] ?? url
    const match = this.failures.find(
      (failure) =>
        failure.remaining > 0 &&
        (failure.method === null || failure.method === method.toUpperCase()) &&
        path.startsWith(failure.path),
    )
    if (!match) return undefined
    match.remaining -= 1
    if (match.remaining === 0) {
      this.failures = this.failures.filter((failure) => failure !== match)
    }
    return match
  }

  nowMs(): number {
    return Date.parse(this.now)
  }
}
