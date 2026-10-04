import { ACCOUNTS, draft, openProduct, price, resultsReady, switchLanguage, toUsd } from '../actions'

/** Money attributes differ between Currencies by design (ADR 0002); everything else must match. */
const MONEY = ['data-price', 'data-list-price', 'data-discount-percent', 'data-percent', 'data-currency']

function structure(): Cypress.Chainable<string[]> {
  return cy.document().then((doc) =>
    [...doc.querySelectorAll<HTMLElement>('main [data-testid]')].map((el) => {
      const attrs = [...el.attributes]
        .filter((attr) => attr.name.startsWith('data-'))
        .map((attr) => (MONEY.includes(attr.name) || (attr.name === 'data-value' && el.dataset.facet === 'price') ? attr.name : `${attr.name}=${attr.value}`))
        .sort()
      return `${el.tagName}|${attrs.join(',')}`
    }),
  )
}

describe('bilingual pages (ADR 0001)', () => {
  const READY: Record<string, string> = {
    '/': '[data-testid="seller-spotlight"][data-state="ready"] [data-testid="seller-spotlight-products-grid"]',
    '/search?condition=new': '[data-testid="results-grid"]',
    '/c/guitars': '[data-testid="results-grid"]',
  }
  for (const path of Object.keys(READY)) {
    it(`renders ${path} with the same structure in both languages`, () => {
      const settle = () => {
        cy.get(READY[path]!).should('exist')
        cy.get('[data-state="loading"]').should('not.exist')
      }
      cy.open(path)
      settle()
      structure().then((portuguese) => {
        cy.open(path === '/' ? '/en' : `/en${path}`)
        settle()
        cy.document().its('documentElement.lang').should('eq', 'en')
        structure().should('deep.equal', portuguese)
      })
    })
  }

  it('keeps path and query when switching language', () => {
    cy.open('/c/guitars?condition=new&sort=price-desc')
    resultsReady()
    switchLanguage('en')
    cy.location().should((location) => {
      expect(location.pathname).to.eq('/en/c/guitars')
      expect(location.search).to.eq('?condition=new&sort=price-desc')
    })
    cy.byTestId('language-option').filter('[aria-current="true"]').should('have.attr', 'data-language', 'en')
  })

  it('renders an unknown prefix as not-found', () => {
    cy.open('/fr/search')
    cy.byTestId('not-found').should('exist')
  })
})

describe('multi-currency (ADR 0002)', () => {
  it('prices every card in dollars at the Demo exchange rate', () => {
    cy.open('/search?sort=price-asc')
    resultsReady()
    cy.get('[data-testid="product-card"]').then(($cards) => {
      const brl = Object.fromEntries([...$cards].map((card) => [card.dataset.productId, Number(card.querySelector<HTMLElement>('[data-testid="product-card-price"]')!.dataset.price)]))
      cy.open('/en/search?sort=price-asc')
      resultsReady()
      cy.get('[data-testid="product-card"]').each(($card) => {
        const id = $card.attr('data-product-id')!
        cy.wrap($card).find('[data-testid="product-card-price"]').should('have.attr', 'data-price', String(toUsd(brl[id]!)))
      })
    })
  })

  it('converts the price filter with the language', () => {
    cy.open('/search?price=20000-50000&condition=used')
    resultsReady()
    cy.byTestId('results-count').invoke('attr', 'data-count').then((count) => {
      switchLanguage('en')
      cy.location('search').should('eq', '?price=4000-10000&condition=used')
      cy.byTestId('results-count').should('have.attr', 'data-count', count)
      cy.get('[data-testid="filter-option"][data-facet="price"][data-value="4000-10000"]').should('have.attr', 'data-selected', 'true')
    })
  })

  it('prices a variant in dollars on the product page', () => {
    openProduct('p-0103', '/en', '?option=v-0103-sonic-blue')
    cy.byTestId('product-price').should('have.attr', 'data-price', String(toUsd(344900)))
  })

  it('adds up the same cart exactly in both currencies, with the same shipping outcome', () => {
    // R$ 299,40: just under the free-shipping threshold, so neither currency ships for free.
    cy.seedCart([{ productId: 'p-0602', quantity: 6 }])
    for (const [prefix, shipping] of [['', 2490], ['/en', 498]] as const) {
      cy.open(`${prefix}/cart`)
      cy.byTestId('cart-page').should('have.attr', 'data-state', 'ready')
      price('summary-shipping').should('eq', shipping)
      cy.get('[data-testid="cart-line-total"]').then(($lines) => {
        const sum = [...$lines].reduce((total, el) => total + Number(el.dataset.price), 0)
        price('summary-subtotal').should('eq', sum)
        price('summary-subtotal').then((subtotal) => price('summary-total').should('eq', subtotal + shipping))
      })
    }
  })

  it('offers card only under /en and bounces a Pix draft back to payment', () => {
    cy.seedSession(ACCOUNTS.ana)
    cy.seedCart([{ productId: 'p-0104' }])
    cy.seedCheckout(draft('pix'))
    cy.open('/en/checkout/review')
    cy.location('pathname').should('eq', '/en/checkout/payment')
    cy.byTestId('payment-error').should('have.attr', 'data-error-code', 'PAYMENT_METHOD_UNAVAILABLE')
    cy.byTestId('payment-method-tab').should('have.length', 1).and('have.attr', 'data-method', 'card')
    cy.byTestId('cart-count').should('have.attr', 'data-count', '1')
  })

  it('keeps a BRL order in reais under /en', () => {
    cy.seedSession(ACCOUNTS.bruno)
    cy.open('/en/orders/TMB-100236')
    cy.byTestId('order-total').should('have.attr', 'data-currency', 'BRL').invoke('text').should('match', /^R\$/)
  })
})
