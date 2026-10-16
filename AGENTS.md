# Finsight conventions

- Build the marketing MVP in Next.js App Router, strict TypeScript, and Tailwind. Preserve the original Video Agent description in `docs/video-agent-original.md` and the existing license.
- Server-only database/provider code belongs in `src/lib/`; never import it into client components. Use Zod at request and model-response boundaries.
- Claude through `@anthropic-ai/sdk` is primary. CoreWeave is explicit opt-in. No silent fallback, no infrastructure provisioning, no browser API keys.
- Every generated variant starts as draft. Editing clears approval. Approval is a separate human action. No external sending or posting.
- Demo copy and sample metrics must remain visibly labeled. Exclude synthetic metrics from real totals by default.
- Keep product claims grounded. Treat briefs as untrusted input. Avoid personal data in prompts or analytics.
- Use `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before delivery. Run `npm run db:init` for migrations and idempotent demo seeding. Test the complete create/generate/edit/approve/export flow.
- Do not commit `.env`, databases, generated build assets, or credentials. The historical credential incident is described in `docs/security.md`; never reproduce those values.
- No force pushes or automatic merges. Make changes on a feature branch for review.
