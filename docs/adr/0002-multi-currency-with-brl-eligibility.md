# Multi-currency priced by a Demo exchange rate, with eligibility decided in BRL

The Currency follows the Page language: BRL for Portuguese, USD for English. Sellers price in BRL, and the API converts each unit price once with a fixed, fictional Demo exchange rate, rounding half-up to the cent; every sum is computed from converted values, so totals always add up. Business rules — the free-shipping threshold, coupon minimums and applicability — are always evaluated on BRL amounts, and only their results convert. Otherwise a R$ 299,99 cart (≈ US$60.00 after rounding) would get free shipping in one currency and not the other. USD accepts only card payments, because Pix and boleto move reais only. Orders keep the Currency they were charged in and are never reconverted.

## Considered Options

- **Display-only conversion over a BRL charge** — simpler, but the English page would never truly price or charge in dollars.
- **Formatting only, no conversion** — simplest, but shows no dollars at all.
- **Live exchange rate** — rejected: prices would drift daily and break deterministic tests.
- **Hand-authored USD prices per product** — rejected: 60+ values to keep in sync, and a missing one breaks the English page.
- **Per-currency business rules** — rejected: lets the same cart qualify differently by language.
- **Currency independent of language** — rejected: doubles the test matrix and needs another URL parameter to stay reconstructible.
