# Verification — 16 October 2026

Passed on Windows ARM64 with Node 24.18, npm 11.16, and headless Microsoft Edge:

- Dependency installation and locked package versions.
- `npm run lint`: no warnings/errors.
- `npm run typecheck`: passed.
- `npm test`: 22 tests across three suites passed. Covers generation schemas and channel limits, demo output, human approval transitions, provider boundaries, safe URLs, analytics formulas, CSV formula escaping, origin checks, body limits, and sanitized errors.
- `npm run build`: optimized Next.js production build passed.
- `npm run db:init` on a fresh temporary SQLite database, then again: migration successful, idempotent seed retained exactly three products, one campaign, three drafts, and one synthetic metric entry.
- `npm run test:e2e` against the production server: passed. Browser created a product, generated X variants, edited, approved, and exported CSV. Actual routes verified the other three channels, missing-Claude-key demo behavior, disabled CoreWeave behavior, edit-clears-approval, reject, invalid-count handling, cross-origin rejection, product update, and cascade deletion. Analytics showed expected CTR and conversion rate; UTM output and synthetic metric filtering worked. Desktop and 390px mobile screenshots captured. No horizontal mobile page overflow or browser exceptions. Test-created products/campaigns/metrics were removed.
- Production npm audit: zero vulnerabilities. Five high-severity development-tool dependency findings remain in the ESLint/fast-glob/micromatch/braces chain. Registry `braces` latest was 3.0.3; no compatible patched chain was offered. No forced downgrade of Next/ESLint was applied. Recheck this development-only issue before upgrading tooling.
- Source and browser bundle checks found no new credential values. Provider code and system prompt remain outside browser chunks. Environment variable names shown in Settings are expected; their values are not exposed.

## Reproduce browser tests

Run the production server with no provider credentials, then in a second shell:

```sh
npm run test:e2e
```

Requires Microsoft Edge installed. `TEST_BASE_URL` defaults to `http://localhost:3000`. `ARTIFACT_DIR` defaults to ignored `test-results/`. The script checks that providers are unconfigured before any generation, preventing accidental paid tests. The in-app browser bridge failed to initialize on this machine, so browser QA used installed Edge through Playwright.

## Not verified / deployment limits

- Live Anthropic generation was not called: no new Anthropic key is configured. Set `ANTHROPIC_API_KEY`, restart, and verify one generation with an accessible model.
- CoreWeave paid inference and the actual account model catalog were not called: no credentials are configured. Catalog access and invalid-model rejection are tested with mocks; runtime catalog verification occurs before real CoreWeave generation. No model ID is assumed.
- No deployment was made. SQLite needs a persistent Node host; Vercel requires a hosted database and matching migrations. Protect the unauthenticated MVP using host access controls.
- Historical credential-like values in the original repository require owner revocation/rotation. They were not used; current templates contain placeholders only. Git history was preserved.
