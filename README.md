# Louisiana Industrial Readiness (LIR)

A Louisiana document-packaging practice for operating companies that need to look buyable to industrial primes.

This repository is a working product, not a mockup. It sells three paid services, takes intake, stores files, scores audits, generates a PDF memo, and publishes public proof pages.

**Not affiliated with SpaceX, Tesla, xAI, NASA, LED, or the State of Louisiana.**  
**Not legal, insurance, engineering, estimating, or procurement advice.**

## What it sells

| SKU | Product | Price |
|---|---|---|
| `audit` | 48-Hour Qualification Audit | $249 |
| `proof_standard` | Industrial Proof Pack | $995 |
| `proof_rush` | Industrial Proof Pack (Rush) | $1,495 |
| `triage` | Bid Desk — 24-hour triage | $149 |
| `map` | Bid Desk — Response Map | $495 |
| `assembly` | Bid Desk — Full Assembly | $1,250 |
| `assembly_rush` | Bid Desk — Full Assembly (Rush) | $1,750 |

Buy the Proof Pack within 14 days of a paid audit and $249 is credited automatically.

Lead magnet: free 2-page checklist at `/checklist`.

## Stack

- Frontend: React 19, React Router 7, Tailwind, shadcn primitives
- Backend: FastAPI + MongoDB + JWT httpOnly cookies
- Payments: Stripe Checkout (optional). If no Stripe key is set, checkout runs in **demo mode** so you can walk the whole operator flow locally
- Email: Resend. If no key is set, emails are logged instead of sent
- Files: local disk, 25 MB, PDF/DOC/DOCX/JPG/PNG/XLS/XLSX
- Audit memo: fpdf2

## Quick start (local)

You need Python 3.11+, Node 20+, and MongoDB 6/7.

```bash
# Mongo
docker run -d --name lir-mongo -p 27017:27017 mongo:7

# Backend
cd backend
cp .env.example .env
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000

# Frontend (second terminal)
cd frontend
cp .env.example .env
npm install --legacy-peer-deps
npm start
```

Open http://localhost:3000

Default local admin (change immediately in `backend/.env`):

- Email: `admin@laindustrialready.local`
- Password: `ChangeMeAdmin2026!`

## Quick start (Docker)

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

- Site: http://localhost:3000
- API: http://localhost:8000/api/health

## Going live

1. Buy or point `laindustrialready.com` (or your domain) at the host.
2. Put real values in `backend/.env`: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `OWNER_EMAIL`, `CORS_ORIGINS`, `FRONTEND_URL`.
3. Create a Stripe account. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Webhook URL: `https://YOURDOMAIN/api/stripe/webhook` events: `checkout.session.completed`, `charge.refunded`.
4. Create a Resend account and verify the sending domain. Add `RESEND_API_KEY` and `EMAIL_FROM`.
5. Set `COOKIE_SECURE=true` and `COOKIE_SAMESITE=lax` on HTTPS same-site deploy. Use `samesite=none` only if the API and site are on different HTTPS origins.
6. Work the launch checklist in `docs/LAUNCH.md`.

Full operator, marketing, and start-the-business guide: `docs/START_HERE.md`.

## Repo map

```
backend/server.py          API, auth, Stripe, PDF, email
frontend/src/pages/        Marketing, products, client portal, admin
docs/OPERATOR.md           How to fulfill an order
docs/OUTREACH.md           Cold email and Facebook copy
docs/LAUNCH.md             Go-live checklist
docs/MARKETING.md          Positioning, channels, 90-day plan
docs/START_HERE.md         What this is + how to begin
```

## Safety rules baked into the product

- No SpaceX / LED / State affiliation claims anywhere
- No legal / insurance / engineering / estimating advice in copy or PDFs
- No job board, matching engine, or lead-selling black book
- Refuse fabricated EMR, insurance, or safety-program claims
