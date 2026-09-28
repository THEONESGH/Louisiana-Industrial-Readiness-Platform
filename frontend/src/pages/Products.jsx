import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, formatErr } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { Check, Clock, ArrowRight, ShieldAlert } from "lucide-react";

async function startCheckout(product_code, navigate, requireLogin, user) {
  if (!user) { toast.error("Please create an account or sign in first."); navigate("/signup?next=" + product_code); return; }
  try {
    const r = await api.post("/payments/checkout", { product_code, origin_url: window.location.origin });
    if (r.data.credit_cents) toast.success(`$${(r.data.credit_cents/100).toFixed(0)} audit credit applied.`);
    window.location.href = r.data.checkout_url;
  } catch (e) { toast.error(formatErr(e)); }
}

function BuyButton({ code, label = "Purchase", testId }) {
  const nav = useNavigate();
  const { user } = useAuth();
  return <button onClick={() => startCheckout(code, nav, true, user)} className="btn-primary" data-testid={testId}>{label} <ArrowRight size={16}/></button>;
}

export function AuditPage() {
  const cats = [
    "Company identity clarity","Scope clarity","Licensing signals","Insurance document quality","Safety documentation",
    "Project proof","Workforce / capacity","Vendor documents (W-9, COI, refs)","Website / findability","Response workflow (24-hour packet)"
  ];
  return (
    <div>
      <section className="section container-doc max-w-4xl">
        <div className="meta-label mb-3">SKU · LIR-AUD-001</div>
        <h1 className="text-4xl sm:text-5xl font-bold uppercase mb-4">48-Hour Qualification Audit</h1>
        <div className="flex items-baseline gap-4 mb-6">
          <span className="text-5xl font-bold font-mono">$249</span>
          <span className="stamp">48-HOUR TURNAROUND</span>
        </div>
        <p className="font-serif text-xl mb-8 text-[color:var(--ink-muted)]">A red / yellow / green scorecard of whether a prime contractor could qualify your company from what exists today.</p>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="meta-label mb-3">WHAT IS SCORED · 10 CATEGORIES</div>
            <ul className="space-y-2 border ink-border" data-testid="audit-categories">
              {cats.map((c,i) => <li key={c} className="flex gap-3 px-3 py-2 border-b hairline last:border-0"><span className="font-mono text-xs text-[color:var(--ink-faint)]">{String(i+1).padStart(2,"0")}</span> {c}</li>)}
            </ul>
          </div>
          <div>
            <div className="meta-label mb-3">WHAT YOU GET</div>
            <ul className="space-y-3 font-serif text-lg">
              <li className="flex gap-2"><Check size={18} className="mt-1 text-[color:var(--pass)] shrink-0"/> Scored PDF memo on LIR letterhead</li>
              <li className="flex gap-2"><Check size={18} className="mt-1 text-[color:var(--pass)] shrink-0"/> Prioritized fix list</li>
              <li className="flex gap-2"><Check size={18} className="mt-1 text-[color:var(--pass)] shrink-0"/> Recommended next step</li>
              <li className="flex gap-2"><Check size={18} className="mt-1 text-[color:var(--pass)] shrink-0"/> <strong>$249 credited</strong> toward Proof Pack within 14 days</li>
            </ul>
            <div className="mt-6 doc-card doc-shadow-sm">
              <div className="meta-label mb-2">CLOCK START RULE</div>
              <p className="font-serif">48 hours begins when payment clears <em>and</em> the intake is complete. Not before.</p>
            </div>
            <div className="mt-8">
              <BuyButton code="audit" label="Purchase Audit — $249" testId="audit-buy"/>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ProofPackPage() {
  return (
    <div>
      <section className="section container-doc max-w-4xl">
        <div className="meta-label mb-3">SKU · LIR-PRF-002</div>
        <h1 className="text-4xl sm:text-5xl font-bold uppercase mb-4">Industrial Proof Pack</h1>
        <div className="flex flex-wrap items-baseline gap-4 mb-6">
          <span className="text-5xl font-bold font-mono">$995</span>
          <span className="text-lg text-[color:var(--ink-muted)]">/ $1,495 rush (5 business days)</span>
        </div>
        <p className="font-serif text-xl mb-8 text-[color:var(--ink-muted)]">The core offer. Everything an industrial buyer asks for, prepared once, delivered as a package your team can send tonight.</p>
        <div className="doc-card doc-shadow p-8" data-testid="proof-checklist">
          <div className="meta-label mb-4">DELIVERABLE CHECKLIST</div>
          <ul className="grid md:grid-cols-2 gap-3 font-serif text-lg">
            {["1-page industrial capabilities sheet (PDF)","Scope-of-services matrix","Up to 3 project sheets (from client facts only)","Vendor-document checklist","Shared vault: W-9, COI, licenses, safety, refs","Hosted /p/ page at laindustrialready.com","Quote-request form on your public page","2-minute Loom/video slot","Two revision rounds"].map(x =>
              <li key={x} className="flex gap-2"><Check size={18} className="mt-1 text-[color:var(--pass)] shrink-0"/> {x}</li>)}
          </ul>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="doc-card doc-shadow-sm">
            <h3 className="text-xl font-bold uppercase mb-2">Standard · $995</h3>
            <p className="text-[color:var(--ink-muted)] mb-3">10 business days.</p>
            <BuyButton code="proof_standard" label="Buy Standard" testId="proof-buy-std"/>
          </div>
          <div className="doc-card doc-shadow-sm">
            <h3 className="text-xl font-bold uppercase mb-2">Rush · $1,495</h3>
            <p className="text-[color:var(--ink-muted)] mb-3">5 business days. Same revisions.</p>
            <BuyButton code="proof_rush" label="Buy Rush" testId="proof-buy-rush"/>
          </div>
        </div>
        <p className="meta-label mt-6">Two revision rounds. 24-month file retention. Credited $249 if you bought an Audit in the last 14 days.</p>
      </section>
    </div>
  );
}

export function BidDeskPage() {
  const tiers = [
    {code:"triage", name:"Triage", price:"$149", turn:"24 hours", desc:"Deadline. Required documents. Missing items. Go/hold recommendation. 5 clarification questions."},
    {code:"map", name:"Response Map", price:"$495", turn:"48 hours", desc:"Everything in Triage plus file plan, responsibility matrix, plain-language scope extract, submission checklist."},
    {code:"assembly", name:"Full Assembly", price:"$1,250", turn:"5 business days", desc:"Populate forms from client-verified information only, branded response folder, naming convention, final client-verification checklist."},
    {code:"assembly_rush", name:"Full Assembly (Rush)", price:"$1,750", turn:"< 72 hours", desc:"Full Assembly delivered inside 72 hours. Used when the deadline is imminent."},
  ];
  return (
    <div>
      <section className="section container-doc max-w-5xl">
        <div className="meta-label mb-3">SKU · LIR-BID-003</div>
        <h1 className="text-4xl sm:text-5xl font-bold uppercase mb-4">Bid Invite Response Desk</h1>
        <p className="font-serif text-xl mb-8 text-[color:var(--ink-muted)]">You just received a live invite. Forward it. We tell you what it says, what is missing, and what a compliant response looks like.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="bid-tiers">
          {tiers.map(t => (
            <div key={t.code} className="doc-card doc-shadow-sm flex flex-col">
              <div className="text-3xl font-mono font-bold">{t.price}</div>
              <div className="text-sm font-bold uppercase mt-1">{t.name}</div>
              <div className="meta-label flex items-center gap-1 mt-1"><Clock size={12}/> {t.turn}</div>
              <p className="text-sm text-[color:var(--ink-muted)] mt-3 flex-1">{t.desc}</p>
              <div className="mt-4"><BuyButton code={t.code} label="Purchase" testId={`bid-buy-${t.code}`}/></div>
            </div>
          ))}
        </div>
        <div className="doc-card mt-10 border-[color:var(--fail)] border-2" data-testid="bid-exclusions">
          <div className="flex items-start gap-3">
            <ShieldAlert className="text-[color:var(--fail)] shrink-0 mt-1"/>
            <div>
              <h3 className="text-xl font-bold uppercase mb-2">Explicitly excluded</h3>
              <p className="font-serif text-lg">No pricing. No takeoffs. No engineering. No legal interpretation. We do not sign or submit on your behalf. We do not auto-submit to third parties.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function StartPage() {
  return (
    <div className="section container-doc max-w-4xl">
      <div className="meta-label mb-3">DOCUMENT · CHOOSER</div>
      <h1 className="text-4xl font-bold uppercase mb-8">Where do you start?</h1>
      <div className="grid md:grid-cols-3 gap-6" data-testid="start-chooser">
        <Link to="/audit" className="doc-card doc-shadow-sm hover:doc-shadow" data-testid="start-audit"><div className="meta-label">01</div><div className="text-2xl font-bold uppercase mt-2">Audit</div><p className="text-[color:var(--ink-muted)] mt-2">You want an honest scorecard first. $249.</p></Link>
        <Link to="/proof-pack" className="doc-card doc-shadow-sm hover:doc-shadow" data-testid="start-proof"><div className="meta-label">02</div><div className="text-2xl font-bold uppercase mt-2">Proof Pack</div><p className="text-[color:var(--ink-muted)] mt-2">You already know what's missing. $995 / $1,495 rush.</p></Link>
        <Link to="/bid-desk" className="doc-card doc-shadow-sm hover:doc-shadow" data-testid="start-bid"><div className="meta-label">03</div><div className="text-2xl font-bold uppercase mt-2">Bid Desk</div><p className="text-[color:var(--ink-muted)] mt-2">You have a live invite. From $149.</p></Link>
      </div>
    </div>
  );
}
