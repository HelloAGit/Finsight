# Finsight Marketing Agent

A working marketing workspace for digital products, built with Next.js App Router, TypeScript, Tailwind, Prisma/SQLite, Zod, and the official Anthropic SDK. Claude is the primary AI provider. No OpenAI API key is required.

The previous **Finsight Video Agent** description is preserved in [docs/video-agent-original.md](docs/video-agent-original.md). This MVP does not implement the older financial or webcam features.

## Run locally

Requires Node 22.16+ or 24 LTS and npm.

```sh
npm ci
cp .env.example .env
npm run db:init
npm run dev
```

PowerShell: use `Copy-Item .env.example .env` if preferred. Open http://localhost:3000. `db:init` applies the committed SQLite migration and idempotently seeds three fictional products, one demo campaign, and labeled synthetic metrics. The whole review flow works without an API key.

## Connect Claude

Create an API key in the [Claude Console](https://platform.claude.com/), set `ANTHROPIC_API_KEY` in `.env`, and restart the app. `ANTHROPIC_MODEL` defaults to `claude-sonnet-5-5`, listed in the [official model reference](https://platform.claude.com/docs/en/models/overview) when implemented. Override it with a structured-output-capable model your account can access. The service uses the official `@anthropic-ai/sdk`, Messages API, `output_config.format`, and Zod validation.

Keys stay on the server. Settings shows only whether a key is present; presence does not prove it works. No key means transparent template demo output. Templates use product facts but do not adapt to goal, tone, or audience; live Claude generation does. Configured-provider failures remain errors, without billable fallback.

Each generation has bounded input fields, at most 2,400 output tokens, a 45-second provider timeout, no automatic retries, one in-flight request per process, and a default ceiling of 20 live requests per process per hour. `AI_MAX_REQUESTS_PER_HOUR=0` disables live calls. Set account spending limits for a monetary cap. Human review remains mandatory.

## Workflow

1. **Products** — create, edit, delete; supply description, benefits, audience, price, landing URL, and brand voice. Deleting a product requires confirmation and also deletes its campaigns, drafts, and metrics.
2. **Campaign Studio** — choose LinkedIn, X, email, or landing-page copy, a goal, audience, tone, and provider. Generate three distinct variants, saved atomically as a campaign and drafts.
3. **Drafts** — edit headline, body, CTA, hashtags, and positioning; approve or reject each variant. Edits clear approval. Copy to clipboard or export CSV with review status and demo/source labels. Exports neutralize spreadsheet formulas. Nothing is sent or published automatically.
4. **Analytics** — generate UTM links and enter additive, non-overlapping reporting-period counts. CTR = clicks / impressions × 100; conversion rate = conversions / clicks × 100, with zero-safe formulas. Counts follow impressions ≥ clicks ≥ leads ≥ conversions. Synthetic metrics are labeled and excluded by default; overview conversions always exclude them. No live platform analytics are claimed.

## Optional CoreWeave

Set all of `COREWEAVE_BASE_URL`, `COREWEAVE_API_KEY`, and `COREWEAVE_MODEL` to enable the adapter. The documented Serverless Inference base URL is `https://api.inference.wandb.ai/v1`. No model identifier is bound by default: retrieve an accessible ID from the authenticated `/models` catalog. The adapter verifies the ID against that catalog before calling `/chat/completions`, validates returned JSON, and rejects incomplete responses. Account catalog verification and live calls require your credentials; tests use mocks and make no paid requests. No OpenAI SDK/account is needed for this compatible protocol.

References: [CoreWeave API](https://docs.coreweave.com/products/inference/serverless/api-reference), [list models](https://docs.coreweave.com/products/inference/serverless/api-reference/list-models), [chat completions](https://docs.coreweave.com/products/inference/serverless/api-reference/chat-completions). No GPUs or infrastructure are provisioned.

## Commands

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

See [verification results and browser test instructions](docs/validation.md). Run `npm run test:e2e` against a local demo server with Microsoft Edge installed and no provider keys. Stop the server before regenerating Prisma or rebuilding on Windows, because the running engine file is locked.

`npm run db:seed` reruns the seed without overwriting existing records. API endpoints: `/api/products` (GET/POST), `/api/products/[id]` (PATCH/DELETE), `/api/campaigns` (GET/POST), `/api/campaigns/generate` (POST), `/api/campaigns/[id]` (PATCH with `draftId`), `/api/analytics` (GET/POST), `/api/settings` (GET, safe provider status only).

## Deployment and boundaries

See [deployment requirements](docs/deployment.md). Standard Next.js builds are Vercel-compatible; the local SQLite file is **not durable on Vercel**. Configure a hosted database and matching Prisma migration before deploying there. No authentication is included: keep the MVP local or behind host access controls, particularly with billable keys. No email sending, posting, scraping, contact harvesting, scheduler, or multi-agent framework is included.

Use aggregate metrics; avoid personal data in briefs and tracking links. Obtain appropriate consent, identify senders, and provide unsubscribe handling before using exported email copy in an email platform. Product information is sent only to the selected generation provider. No Langfuse service is configured.

## Security action for repository owners

The earlier tracked `.env.example` contained credential-like values. They have been replaced with placeholders, but historical commits still contain them. Revoke/rotate those credentials and inspect provider usage. See [docs/security.md](docs/security.md). No historical keys were used by this implementation.

## License

The original [LICENSE](LICENSE) is preserved.
