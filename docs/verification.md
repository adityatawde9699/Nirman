# Verification record

## Completed checks

- Strict TypeScript check with the offline dependency aliases.
- Next.js **16.3.5** production compilation with cached dependencies and the offline graph renderer.
- Twelve isolated API tests, including the entire judging journey, permission boundaries, rule toggles, risk contributions, uploads, duplicate/final-decision guards, registration, inspection reports, query attachments, notification persistence and seed counts.
- Rendered React journey with real FastAPI ASGI responses: landing → login → five-step wizard → discovery → graph → upload → validation → submission → officer review → query → applicant response → inspection → explicit human approval → renewal → schemes → assistant → admin rule toggle → audit trail.
- Additional rendered route checks for officer review/query pages, applicant project/approval/notification pages, all admin pages, and registration into an empty workspace.
- Python formatting and lint checks for application source.

The generated UI result is [dom-walkthrough.json](../output/playwright/dom-walkthrough.json). It uses an isolated database; its mutations do not change the seeded demo database.

## Execution limits

Next.js server startup was attempted and rejected with `listen EPERM` on port 3000. FastAPI startup completed, but localhost requests could not be made from this sandbox. The environment rejects socket operations and outbound package downloads. Chromium failed during launch. Therefore a live HTTP browser walkthrough, screenshot QA, the Next.js-to-FastAPI network proxy, and PostgreSQL container execution were not verified here. The Docker configuration can be inspected without starting containers; the full runtime requires a normal local environment.

Happy DOM has no layout engine. Recharts may report zero-size containers in that harness. This is a harness geometry limitation; the real CSS assigns explicit chart heights. Browser chart dimensions and responsive appearance remain on the live checklist.

Normal installs use official React Flow and shadcn/ui-pattern Radix/CVA primitives. The offline build substitutes a labeled graph renderer and primitive adapters because those packages were not cached. The official package paths remain implemented in source and should be included in the live browser verification.
