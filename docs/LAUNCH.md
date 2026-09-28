# Launch checklist — LIR

## 1. Deploy
- Emergent Deploy button → publish the app. The platform swaps Stripe sandbox for your live account keys after you finish claim/KYC.

## 2. Stripe
- Click **Claim your Stripe account** on the Payments tab in the Emergent UI. Complete KYC.
- After KYC, publish again — the platform automatically swaps sandbox keys for your live keys.

## 3. Custom domain
- In the Emergent UI, add `laindustrialready.com` and `www.laindustrialready.com` under Domains.
- Wait for SSL to provision.

## 4. Admin
- Admin user auto-seeds on startup from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in backend env.
- If the platform generated new keys or you rotated the password, restart the backend and re-log in.

## 5. Test each product end-to-end (test mode, before switching to live)
- [ ] Register a client → checkout audit → complete intake → upload one file
- [ ] Admin scores the audit → PDF generates → status: delivered → client sees the PDF in `/app`
- [ ] Same client → checkout `proof_standard` → confirm $249 credit shows on the checkout summary
- [ ] Checkout `triage` from Bid Desk → complete intake with a URL + estimating acknowledgement
- [ ] Public `/p/demo` renders and quote form emails you
- [ ] Contact form emails you
- [ ] Checklist download emails you + subscriber

## 6. Soft launch
- Send the "cold email" template (see OUTREACH.md) to 20 Louisiana contractors you already know.
- Post the Facebook comment template in one relevant thread. Do not spam.
- Watch `/admin` for the first paid order. Turn it around fast.
