# Louisiana Industrial Readiness — PRD

## Original problem statement
Build a real, revenue-ready online service business (Louisiana Industrial Readiness / LIR) that sells three document-preparation products to Louisiana operating companies: a $249 48-hour Qualification Audit, a $995/$1,495 Industrial Proof Pack, and a $149/$495/$1,250/$1,750 Bid Invite Response Desk, plus a free PDF checklist lead magnet. Serious industrial-letterhead aesthetic (paper, near-black ink, deep Gulf blue accent). Mobile-first, no SaaS gradients, no SpaceX affiliation claims, no legal/estimating/engineering advice.

## Architecture (v1)
- Frontend: React 19 + React Router 7, Tailwind + shadcn primitives, sonner for toasts.
- Backend: FastAPI (single `server.py`), Motor/MongoDB, JWT httpOnly cookie auth, bcrypt.
- Payments: Stripe Flow A (claimable sandbox). Managed payments (SMP) with automatic-tax fallback. 7 SKUs seeded on startup via `ensure_catalog()`. Webhook at `/api/stripe/webhook`.
- Email: Emergent-managed Resend (transactional only). Safety gate on every send.
- File storage: local disk `/app/backend/uploads/`, 25 MB per file, PDF/DOC/DOCX/JPG/PNG/XLS/XLSX allowed.
- PDF: fpdf2 audit memo generation.

## User personas
1. **Operating contractor (client)** — LA-based trucking, welding, civil, electrical, marine, fabrication, sanitation, temp-power, etc. Buys Audit → Proof Pack → optionally Bid Desk.
2. **Operator (admin)** — solo LA operator running the shop. Reviews intake, scores audits, generates PDFs, publishes proof pages, sends deliverables.

## Core requirements (static)
- No claims of SpaceX / Tesla / xAI / NASA / LED / State of Louisiana affiliation, anywhere.
- No legal / insurance / engineering / estimating / procurement advice in copy or output.
- No forum, job board, matching engine, lead-selling black book.
- v1 must take a paid order on day one.
- Mobile-first down to 375px.

## What's implemented (2026-02)
- Marketing pages: `/`, `/audit`, `/proof-pack`, `/bid-desk`, `/how-it-works`, `/who-its-for`, `/sample`, `/faq`, `/about`, `/contact`, `/checklist`, `/start`, `/legal/{terms,privacy,disclaimer}`.
- Auth: JWT httpOnly cookie, admin auto-seed (reallansfwmod@gmail.com / LIRadmin2026!), register/login/logout/me.
- Stripe checkout for 7 SKUs, 14-day $249 audit → Proof Pack credit auto-applied, webhook + polling status update.
- Client portal `/app` and `/app/order/:id` — orders table, intake form (product-specific fields), file upload/download, message thread, deliverable download.
- Admin portal `/admin` and `/admin/order/:id` — filterable queue, dashboard stats, 10-category audit scorecard with PDF generation, status controls, internal per-product checklist, leads CSV export.
- Public proof page `/p/:slug` with quote-request form; seeded `/p/demo` (Acadiana Site Services LLC).
- Transactional emails: lead magnet, contact form, order paid (client + owner), delivered, quote request.

## Backlog / next
- **P1** Operator manual (`/docs/OPERATOR.md`), outreach templates (`/docs/OUTREACH.md`), launch checklist (`/docs/LAUNCH.md`).
- **P1** Admin proof-page editor UI (backend exists at `POST /api/admin/proof-pages`).
- **P2** Intake-incomplete 24h reminder email cron.
- **P2** Proof-pack credit-expiring day-10 reminder cron.
- **P2** Refund/mark-refunded admin control.
- **P3** SEO sitemap.xml + robots.txt route.
- **P3** OG image generator.
- **Known** CORS preflight OPTIONS through preview URL returns 400 at edge (infra-layer, not app). Real browser POSTs succeed via ACAO on responses.
