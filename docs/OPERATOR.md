# Operator manual — Louisiana Industrial Readiness

## Daily flow
1. Log in at `/login` with your admin credentials.
2. Open `/admin`. Filter by status. Priority order: `paid_incomplete_intake` → `queued` → `needs_client` → `in_progress`.
3. Click **Open →** on any order.
4. Read the intake. Read the uploaded files. If anything critical is missing, send a message from the order page and set status to **needs client**.

## 48-hour audit
1. Verify payment (Stripe session confirms paid_at).
2. Review the client's website and any uploaded documents.
3. Fill the 10-category scorecard (Red / Yellow / Green + one-line comment each).
4. Write a 2–4 sentence Summary paragraph and a Recommended-next-step line.
5. Click **Save & Generate PDF** — this stores the memo under Deliverables.
6. Set status to **delivered** (this emails the client).

## Proof Pack
1. Verify the facts the client gave you. Do not invent projects, licenses, or insurance numbers.
2. Draft the 1-page capabilities sheet.
3. Draft up to 3 project sheets from client facts only.
4. Build the `/p/<slug>` page (backend endpoint `POST /api/admin/proof-pages`, or add a UI later).
5. Send the draft via the order message thread. Set status to **needs_client**.
6. Two revision rounds. On final approval, set the proof page `published: true` and status to **delivered**.

## Bid Invite Response Desk
1. Confirm the client has forwarded the invite (URL or file upload).
2. Confirm the "we have estimating covered" acknowledgement is checked.
3. Deliver only what the tier includes. **Never** price, estimate, size, or sign anything.
4. Do NOT auto-submit to the GC. Delivery is the memo/response folder — the client submits.

## Refusing bad requests
If a prospect asks you to "just say" they have a safety program they don't have, or to invent EMR / insurance numbers, or promise a Starbase intro — refuse politely, in writing, and close the order. Never fabricate. This is the whole product.

## Backups
- PDF generator down? Upload a handmade PDF via the order files section with category **deliverable**.
- Email service down? Contact the client via phone (from intake) and note it in the message thread.

## Sales calls — never say
- "I can get you on the SpaceX list."
- "We have contacts at LNG / One Acadiana / LED."
- "We guarantee you'll be awarded work."
- "Your insurance will pass."
- "This is legal / estimating / engineering advice."
