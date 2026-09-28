# Launch checklist — Louisiana Industrial Readiness

## 1. Hosting
Pick one:

- **Simple VPS** (Hetzner, DigitalOcean, Linode): install Docker, clone this repo, `docker compose up --build`, put Caddy or nginx in front for HTTPS.
- **Split deploy**: frontend on Cloudflare Pages / Netlify, backend on a small VPS or Fly.io, MongoDB on Atlas.
- **Single box**: build the frontend, set `FRONTEND_BUILD` so FastAPI serves the SPA.

Do not launch on a laptop.

## 2. Environment
Required before real customers:

- [ ] `JWT_SECRET` — long random string
- [ ] `ADMIN_EMAIL` / `ADMIN_PASSWORD` — only you know these
- [ ] `OWNER_EMAIL` — where paid-order and contact alerts go
- [ ] `FRONTEND_URL` — public site URL
- [ ] `CORS_ORIGINS` — exact public origins, comma-separated
- [ ] `COOKIE_SECURE=true` on HTTPS
- [ ] `MONGO_URL` pointing at a durable database with backups

## 3. Stripe
- [ ] Create account in the operating LLC name
- [ ] Complete KYC
- [ ] Test mode first: `sk_test_...`
- [ ] Webhook: `https://YOURDOMAIN/api/stripe/webhook`
  - `checkout.session.completed`
  - `charge.refunded`
- [ ] Paste `STRIPE_WEBHOOK_SECRET`
- [ ] Place one test $249 order end-to-end
- [ ] Flip to `sk_live_...` only after the test order worked

If Stripe keys are empty the app still runs in demo mode (orders mark paid immediately). That is for rehearsal, not customers.

## 4. Email
- [ ] Resend account
- [ ] Verify `laindustrialready.com` (or your domain)
- [ ] `RESEND_API_KEY` + `EMAIL_FROM`
- [ ] Send checklist, contact, and “order paid” to yourself

## 5. Domain
- [ ] `laindustrialready.com` and `www` → your host
- [ ] SSL
- [ ] Update `sitemap.xml` if the domain is not that one

## 6. End-to-end test (test mode)
- [ ] Register a client → checkout audit → complete intake → upload one file
- [ ] Admin scores the audit → PDF generates → status **delivered** → client sees the PDF in `/app`
- [ ] Same client → checkout `proof_standard` → $249 credit shows
- [ ] Checkout `triage` → intake with URL + estimating acknowledgement
- [ ] Public `/p/demo` renders and quote form emails you
- [ ] Contact form emails you
- [ ] Checklist download emails you + the subscriber

## 7. Soft launch
- Send the cold email in `OUTREACH.md` to 20 Louisiana contractors you already know
- One Facebook / group comment. Do not spam
- Watch `/admin`. Turn the first paid order around fast
