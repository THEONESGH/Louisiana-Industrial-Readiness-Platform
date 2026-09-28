# Start here — what this project is and how to begin

## One-sentence version

Louisiana Industrial Readiness is a paid document shop that takes a Louisiana contractor’s messy file (COI, W-9, safety pages, project list, website) and turns it into something a GC or industrial buyer can actually use.

## Why it exists

Gulf Coast industrial work (LNG, fabrication, civil, marine, electrical, trucking, temp power) still runs on packets. Primes ask for the same ten things. Most small LA operators have the work history and do not have the packet. They lose invites because the file looks unfinished, not because they cannot do the job.

This product does **not** get anyone on a SpaceX list. It does **not** broker work. It packages proof.

## Who buys

Louisiana operating companies already doing the work:

- Trucking / heavy haul
- Welding / fabrication
- Electrical
- Civil / sitework
- Marine support
- Sanitation, catering, waste, temp power, fencing, security, janitorial, equipment rental

Buyer is usually the owner or the person who answers the “can you send your packet?” email.

## What they buy, in order

1. Free checklist (`/checklist`) — lead magnet
2. $249 48-hour audit — ten categories, red / yellow / green, plain-English fix list, PDF memo
3. $995 Proof Pack (or $1,495 rush) — capabilities sheet, project sheets, public `/p/<slug>` page. $249 credited if bought within 14 days of the audit
4. Bid Desk when a live invite lands — $149 triage up to $1,750 rush assembly. You assemble the response folder. The client submits. You never price, size, or sign.

## What you are operating

A solo shop with three surfaces:

1. **Public site** — trust, products, legal pages, checklist, sample, contact
2. **Client portal** (`/app`) — pay, intake, upload files, message you, download deliverables
3. **Admin desk** (`/admin`) — queue, scorecard + PDF, status, proof-page editor, leads CSV

You are the fulfillment engine. The software is the storefront and the job ticket system.

## First 7 days — do this in order

### Day 1 — Run it
- Install Docker or local Python/Node/Mongo
- Copy `backend/.env.example` → `backend/.env` and change admin password
- `docker compose up --build` **or** follow README local start
- Log in at `/login` as admin
- Register a fake client, start a demo checkout (no Stripe key = demo paid order), fill intake, score an audit, generate the PDF

### Day 2 — Make it yours
- Change `ADMIN_EMAIL`, `OWNER_EMAIL`, `EMAIL_FROM` to addresses you control
- Decide the live domain. Default brand domain in copy is `laindustrialready.com`
- Write the About page facts that are true for you (parish, years, what you will and will not do)
- Read `docs/OPERATOR.md` once all the way through

### Day 3 — Money and mail
- Stripe account + test keys
- Resend account + verify sending domain
- Webhook endpoint `/api/stripe/webhook`
- Send yourself one checklist lead and one contact form to prove email works

### Day 4 — Legal wrapper (not legal advice — talk to a LA attorney)
- Form or confirm the LLC that will invoice
- Bank account + Stripe KYC in that entity’s name
- Keep `/legal/terms`, `/legal/privacy`, `/legal/disclaimer` aligned with how you actually operate
- Get a bookkeeper plan even if it is a spreadsheet for month one

### Day 5 — Fulfillment dry run
- Time yourself doing one audit from a real public contractor website (do not contact them yet)
- Write the memo as if they paid
- Confirm you can produce it in under two focused hours. If not, tighten the scorecard comments, do not invent scope

### Day 6 — Outreach list
- Write 20 names you already know in Louisiana trades
- Personalize the cold email in `docs/OUTREACH.md`
- Do not blast. Twenty real notes beat two hundred templates

### Day 7 — Soft launch
- Send the 20 emails
- Post one honest comment in one relevant group using the Facebook template
- Watch `/admin` for checklist leads
- Turn the first paid order around faster than the 48-hour promise

## What “good” looks like in 90 days

- 40–80 checklist leads
- 8–15 paid audits
- 3–6 Proof Packs (this is the real money)
- 2–4 Bid Desk jobs from people who already bought an audit
- Zero fabricated claims
- One public proof page that is true and you are proud to show

Revenue math if you hit the low end: 8 × $249 + 3 × $995 ≈ $5,000 before fees. High end of that range is closer to $12k–$15k. This is a services business with software attached, not a SaaS multiple.

## What will kill it

- Promising SpaceX / LED / “I can get you on the list”
- Inventing EMR, insurance limits, or a safety program the client does not have
- Slow first delivery
- Spending two weeks on branding instead of sending the 20 emails
- Building a job board

## Read next

1. `docs/LAUNCH.md` — go-live switches
2. `docs/OPERATOR.md` — how to fulfill
3. `docs/OUTREACH.md` — the words
4. `docs/MARKETING.md` — 90-day plan and positioning
