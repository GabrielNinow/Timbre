# Timbre

A Brazilian marketplace for musical instruments and audio gear, built as a portfolio
piece. The public deployment is a demo: every product, seller, account and payment
is fictional, and nothing a visitor does has real-world effect.

## Language

**Visitor**:
Anyone using the public demo. Never a real customer; no real personal data is ever
collected from them.
_Avoid_: User (ambiguous with Account), customer, buyer

**Demo account**:
One of the fixture accounts (Ana, Bruno, …) whose credentials are shown publicly so
any Visitor can sign in as it.
_Avoid_: Test user, real account

## Language and content

**Page language**:
The language a page renders in: Portuguese by default, English under the `/en` prefix.
Chosen by the address alone, never by the browser.
_Avoid_: Locale (in conversation), browser language

**Currency**:
The money every price on a page is shown and charged in. Follows the Page language:
reais for Portuguese, dollars for English.
_Avoid_: Display currency, selected currency

**Demo exchange rate**:
The fixed, fictional rate that turns a seller's price in reais into dollars. Never
moves, so a dollar price is always predictable.
_Avoid_: Live rate, quote, FX rate

**Listing content**:
Text a seller wrote: product name, description, specs, store bio. Shown exactly as
written, in every page language; never translated.
_Avoid_: Product copy, translatable content

**Platform copy**:
Text Timbre itself owns: interface labels, category names, condition and tier names,
shipping and order status names, error explanations. Exists in every page language.
_Avoid_: Labels, strings, UI text
