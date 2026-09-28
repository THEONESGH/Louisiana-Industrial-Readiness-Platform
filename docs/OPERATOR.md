# Operator manual — Louisiana Industrial Readiness

## Daily flow
1. Log in at `/login` with admin credentials.
2. Open `/admin`. Filter by status. Priority: `paid_incomplete_intake` → `queued` → `needs_client` → `in_progress`.
3. Open the order.
4. Read the intake and uploaded files. If something critical is missing, message the client and set status to **needs client**.

## 48-hour audit
1. Verify payment (`paid_at` is set).
2. Review the client website and uploaded documents.
3. Fill the 10-category scorecard (Red / Yellow / Green + one-line comment each).
4. Write a 2–4 sentence summary and a recommended-next-step line.
5. **Save & Generate PDF** — memo lands under Deliverables.
6. Set status to **delivered** (this emails the client).

Categories: identity, scope, licensing, insurance, safety, projects, workforce, vendor docs, website, response workflow.

## Proof Pack
1. Verify facts the client gave you. Do not invent projects, licenses, or insurance numbers.
2. Draft the 1-page capabilities sheet.
3. Draft up to 3 project sheets from client facts only.
4. Build `/p/<slug>` in `/admin/proof-pages`.
5. Send the draft in the order thread. Status: **needs_client**.
6. Two revision rounds. On approval, publish the proof page and set status **delivered**.

## Bid Invite Response Desk
1. Confirm they forwarded the invite (URL or file).
2. Confirm the “we have estimating covered” acknowledgement.
3. Deliver only what the tier includes. **Never** price, estimate, size, or sign.
4. Do not submit to the GC. Delivery is the folder. The client submits.

## Refusing bad requests
If someone asks you to “just say” they have a safety program they do not have, invent EMR / insurance numbers, or promise a Starbase intro — refuse in writing and close the order. Never fabricate. That *is* the product.

## Backups
- PDF generator down? Upload a handmade PDF on the order with category **deliverable**.
- Email down? Call the number on the intake and note it in the thread.
- Back up Mongo and `backend/uploads/` daily once you have real files.

## Sales calls — never say
- “I can get you on the SpaceX list.”
- “We have contacts at LNG / One Acadiana / LED.”
- “We guarantee you’ll be awarded work.”
- “Your insurance will pass.”
- “This is legal / estimating / engineering advice.”
