# English technical surface, bilingual pages chosen by URL

Timbre is a Brazilian marketplace, yet every technical surface — code, URLs, API values, error messages, docs — is English, so the project reads to any reviewer. Pages exist in two Page languages: Portuguese by default and English under an `/en` prefix. The language comes from the address alone, never from the browser, so the same URL renders identically in every test runner and CI machine. Brazilian domain names (`pix`, `boleto`, CEP, UF) stay as they are, and Listing content is never translated: real marketplaces show a seller's listing as written, and inventing translations no seller wrote would be dishonest.

## Considered Options

- **Portuguese everywhere** — authentic, but opaque to most reviewers of a portfolio piece.
- **Language from a saved preference or `navigator.language`** — rejected: the same URL would render differently across runners, breaking the rule that a page is reconstructible from its URL.
- **API translates Listing content per locale** — rejected: doubles the fixture content and puts a locale on every contract and test.
