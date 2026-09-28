import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, formatErr } from "../lib/api";
import { toast } from "sonner";
import { ArrowRight, FileCheck, ShieldCheck, Clock, AlertCircle, Check } from "lucide-react";

const TRADES = ["Trucking","Welding","Electrical","Civil / Sitework","Fencing","Security","Sanitation","Catering","Waste","Temp Power","Fabrication","Marine Support","Janitorial","Equipment Rental"];

export function Home() {
  return (
    <div>
      <section className="section border-b-2 ink-border">
        <div className="container-doc grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7">
            <div className="stamp mb-6" data-testid="hero-stamp">Louisiana · Industrial · Since 2026</div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-6" data-testid="hero-headline">
              If a prime contractor pulled your file tonight,<br/>
              would they find a <span className="text-[color:var(--gulf)]">company they can buy from</span> — or a website and a rumor?
            </h1>
            <p className="text-lg leading-relaxed text-[color:var(--ink-muted)] mb-8 max-w-2xl" data-testid="hero-sub">
              Louisiana Industrial Readiness packages the proof industrial buyers already ask for. We do not sell access to SpaceX. We make your existing company easier to qualify.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/audit" className="btn-primary" data-testid="hero-cta-audit">Start the $249 Audit <ArrowRight size={16}/></Link>
              <Link to="/bid-desk" className="btn-outline" data-testid="hero-cta-bid">I Have a Bid Invite</Link>
            </div>
            <p className="meta-label mt-6">TURNAROUND · 48 HOURS · AFTER PAYMENT + COMPLETE INTAKE</p>
          </div>
          <div className="lg:col-span-5">
            <div className="doc-card doc-shadow" data-testid="hero-90sec">
              <div className="meta-label mb-3">MEMO · 90-SECOND TEST</div>
              <h3 className="font-serif text-2xl mb-4">The Procurement Manager Test</h3>
              <p className="font-serif text-base leading-relaxed mb-4">
                A GC procurement manager Googles you tonight. In ninety seconds, they must tell:
              </p>
              <ol className="space-y-2 text-sm">
                <li className="flex gap-2"><Check size={16} className="text-[color:var(--pass)] mt-1 shrink-0"/> Which trade you actually cover</li>
                <li className="flex gap-2"><Check size={16} className="text-[color:var(--pass)] mt-1 shrink-0"/> Whether your insurance & safety docs are current</li>
                <li className="flex gap-2"><Check size={16} className="text-[color:var(--pass)] mt-1 shrink-0"/> Whether you can respond to a packet in 24 hours</li>
              </ol>
              <p className="text-xs meta-label mt-6 pt-4 border-t hairline">If they can't, they move on. This is what we fix.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-doc">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-tight">The Catalog</h2>
            <span className="meta-label">v1 · THREE OFFERS</span>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <ProductCard code="LIR-AUD-001" title="48-Hour Qualification Audit" price="$249" turnaround="48 hours" to="/audit"
              blurb="Red/yellow/green scorecard across 10 categories. Written findings. Prioritized fix list. $249 credited toward Proof Pack." testId="card-audit"/>
            <ProductCard code="LIR-PRF-002" title="Industrial Proof Pack" price="$995" priceAlt="$1,495 rush" turnaround="10 business days"
              to="/proof-pack" blurb="Capabilities sheet, scope matrix, up to 3 project sheets, vendor-doc vault, hosted /p/ page, quote form." testId="card-proof"/>
            <ProductCard code="LIR-BID-003" title="Bid Invite Response Desk" price="from $149" turnaround="24 hours" to="/bid-desk"
              blurb="Forward a live invite. Triage · Response Map · Full Assembly. No pricing, no engineering, no signing on your behalf." testId="card-bid"/>
          </div>
        </div>
      </section>

      <section className="section bg-[color:var(--paper-alt)] border-y-2 ink-border">
        <div className="container-doc grid lg:grid-cols-2 gap-10">
          <div>
            <div className="meta-label mb-3">SECTION 04 · SCOPE</div>
            <h2 className="text-3xl font-bold uppercase mb-4">What this is not</h2>
            <ul className="space-y-3 font-serif text-lg">
              <li className="flex gap-3"><AlertCircle size={20} className="mt-1 shrink-0"/> Not a SpaceX portal, not a job board, not a matching engine.</li>
              <li className="flex gap-3"><AlertCircle size={20} className="mt-1 shrink-0"/> Not estimating, engineering, legal, insurance, or licensing advice.</li>
              <li className="flex gap-3"><AlertCircle size={20} className="mt-1 shrink-0"/> Not a broker of introductions, not a lead-seller.</li>
              <li className="flex gap-3"><AlertCircle size={20} className="mt-1 shrink-0"/> Not for individuals hunting Starbase jobs.</li>
            </ul>
          </div>
          <div>
            <div className="meta-label mb-3">SECTION 05 · AUDIENCE</div>
            <h2 className="text-3xl font-bold uppercase mb-4">Who it's for</h2>
            <p className="mb-4 text-[color:var(--ink-muted)]">Existing Louisiana operating companies with real crews or equipment:</p>
            <div className="flex flex-wrap gap-2" data-testid="trades-list">
              {TRADES.map(t => <span key={t} className="border ink-border bg-white px-3 py-1 text-xs font-mono uppercase tracking-wider">{t}</span>)}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-doc">
          <div className="meta-label mb-3">SECTION 06 · WORKFLOW</div>
          <h2 className="text-3xl font-bold uppercase mb-10">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {n:"01",t:"Pay",d:"Choose an offer and pay online. Stripe. Instant receipt."},
              {n:"02",t:"Upload",d:"Complete a plain-English intake. Upload the docs we can work with."},
              {n:"03",t:"Receive",d:"Deliverables land in your client portal. Two revisions on Proof Pack."}
            ].map(s => (
              <div key={s.n} className="doc-card doc-shadow-sm">
                <div className="font-mono text-[color:var(--gulf)] text-3xl font-bold mb-2">{s.n}</div>
                <h3 className="text-xl font-bold uppercase mb-2">{s.t}</h3>
                <p className="text-[color:var(--ink-muted)]">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-[color:var(--ink)] text-[color:var(--paper)]">
        <div className="container-doc text-center">
          <h2 className="text-3xl sm:text-4xl font-bold uppercase mb-4">The clock is already running</h2>
          <p className="text-lg opacity-80 mb-8 max-w-2xl mx-auto">Starbase Louisiana construction begins in 2027. LNG, industrial maintenance, and coastal work do not wait. Start with the audit.</p>
          <Link to="/audit" className="btn-primary" style={{background:"var(--paper)", color:"var(--ink)", boxShadow:"3px 3px 0 0 var(--gulf)"}} data-testid="footer-cta-audit">Start $249 Audit <ArrowRight size={16}/></Link>
        </div>
      </section>
    </div>
  );
}

function ProductCard({ code, title, price, priceAlt, turnaround, to, blurb, testId }) {
  return (
    <div className="doc-card doc-shadow flex flex-col" data-testid={testId}>
      <div className="meta-label mb-2">{code}</div>
      <h3 className="text-2xl font-bold uppercase mb-2 leading-tight">{title}</h3>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold font-mono">{price}</span>
        {priceAlt && <span className="text-sm text-[color:var(--ink-muted)]">/ {priceAlt}</span>}
      </div>
      <p className="text-[color:var(--ink-muted)] mb-6 flex-1">{blurb}</p>
      <div className="flex items-center justify-between border-t hairline pt-4">
        <span className="meta-label flex items-center gap-1"><Clock size={12}/> {turnaround}</span>
        <Link to={to} className="text-sm font-bold uppercase text-[color:var(--gulf)]">Details →</Link>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <div className="section container-doc max-w-4xl">
      <div className="meta-label mb-3">DOCUMENT · WORKFLOW</div>
      <h1 className="text-4xl font-bold uppercase mb-8">How it works</h1>
      <div className="space-y-8 font-serif text-lg leading-relaxed">
        <div><h2 className="font-sans text-2xl uppercase mb-2">01 · Pay</h2><p>Every deliverable is billed as a fixed-price product via Stripe. Your receipt is emailed instantly.</p></div>
        <div><h2 className="font-sans text-2xl uppercase mb-2">02 · Intake</h2><p>A short, plain-English form gathers the facts we need — legal name, trades, insurance limits, three example projects. For a Bid Desk order, forward the invite. For a Proof Pack, upload your logo and any prior capabilities.</p></div>
        <div><h2 className="font-sans text-2xl uppercase mb-2">03 · Human preparation</h2><p>A Louisiana operator (not an AI, not a marketing agency) prepares the deliverable. We do not invent facts, run pricing, or write insurance opinions.</p></div>
        <div><h2 className="font-sans text-2xl uppercase mb-2">04 · Delivery</h2><p>Deliverables appear in your client portal at /app. PDFs, source files where applicable, and — for Proof Pack — a hosted proof page at /p/your-slug that you can send to primes.</p></div>
        <div><h2 className="font-sans text-2xl uppercase mb-2">05 · Revisions</h2><p>Proof Pack includes two revision rounds. Audit findings can be re-run 30 days later for half price.</p></div>
      </div>
    </div>
  );
}

export function WhoItsFor() {
  return (
    <div className="section container-doc max-w-4xl">
      <div className="meta-label mb-3">DOCUMENT · AUDIENCE</div>
      <h1 className="text-4xl font-bold uppercase mb-8">Who it's for</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="doc-card doc-shadow-sm">
          <h2 className="text-2xl font-bold uppercase mb-4 text-[color:var(--pass)]">Yes</h2>
          <ul className="space-y-2 font-serif text-lg">
            <li>— Louisiana operating companies with real crews or equipment</li>
            <li>— Firms that have already lost work over a paperwork gap</li>
            <li>— Contractors chasing LNG, coastal, energy, marine, or industrial maintenance</li>
            <li>— Any operator whose "capability statement" is a Word doc from 2019</li>
          </ul>
        </div>
        <div className="doc-card doc-shadow-sm">
          <h2 className="text-2xl font-bold uppercase mb-4 text-[color:var(--fail)]">No</h2>
          <ul className="space-y-2 font-serif text-lg">
            <li>— Individuals hoping for a job at Starbase</li>
            <li>— Companies wanting introductions we do not sell</li>
            <li>— Anyone asking us to invent qualifications, projects, or insurance status</li>
            <li>— Landlords, staffing agencies, or SpaceX-fan communities</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function Sample() {
  return (
    <div className="section container-doc max-w-4xl">
      <div className="meta-label mb-3">SAMPLE · REDACTED</div>
      <h1 className="text-4xl font-bold uppercase mb-2">Sample deliverable</h1>
      <p className="text-[color:var(--ink-muted)] mb-8">Fictional company. Real format.</p>
      <div className="doc-card doc-shadow p-8 sm:p-12" data-testid="sample-audit">
        <div className="flex justify-between items-start border-b-2 ink-border pb-4 mb-6">
          <div>
            <div className="meta-label">MEMO · 48-HOUR QUALIFICATION AUDIT</div>
            <h2 className="text-2xl font-bold uppercase mt-1">Acadiana Site Services LLC</h2>
          </div>
          <div className="text-right text-xs font-mono">
            <div>ORDER · LIR-AUD-8471</div>
            <div>DATE · 2026-01-28</div>
          </div>
        </div>
        <table className="w-full text-sm border ink-border">
          <thead className="bg-[color:var(--paper-alt)]">
            <tr><th className="text-left p-2 border-r hairline">Category</th><th className="p-2 border-r hairline w-24">Status</th><th className="text-left p-2">Comment</th></tr>
          </thead>
          <tbody>
            {[
              ["Company identity","green","Legal name matches insurance and W-9."],
              ["Scope clarity","yellow","'Sitework and general labor' is too broad — split into a defined services matrix."],
              ["Licensing signals","green","La. Contractor #52*** posted."],
              ["Insurance","yellow","COI dated 8 months ago. Refresh."],
              ["Safety","red","No written safety program on file."],
              ["Project proof","yellow","Two projects named, no dates."],
              ["Workforce","green","Crew size range clear."],
              ["Vendor documents","red","No W-9 on the current website."],
              ["Website","yellow","Homepage reads consumer, not industrial."],
              ["Response workflow","yellow","No public inbox for procurement."],
            ].map(([c,s,cm]) => (
              <tr key={c} className="border-t hairline">
                <td className="p-2 border-r hairline font-medium">{c}</td>
                <td className="p-2 border-r hairline"><span className={`status-pill status-${s}`}>{s.toUpperCase()}</span></td>
                <td className="p-2 font-serif">{cm}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 pt-4 border-t-2 ink-border font-serif">
          <div className="meta-label mb-2">SUMMARY</div>
          <p>Yellow overall. Two red flags — no written safety program, no W-9 posted. Both are 3-day fixes. Recommend Proof Pack to consolidate the scope matrix, capability sheet, and hosted /p/ page in one pass.</p>
        </div>
      </div>
      <div className="mt-8 flex gap-4">
        <Link to="/p/demo" className="btn-outline" data-testid="sample-proof-link">View sample /p/demo page</Link>
        <Link to="/audit" className="btn-primary">Start Your Audit</Link>
      </div>
    </div>
  );
}

export function FAQ() {
  const items = [
    {q:"Are you with SpaceX?", a:"No. We are not affiliated with SpaceX, Tesla, xAI, NASA, Louisiana Economic Development, or the State of Louisiana."},
    {q:"Will this get me hired or awarded a contract?", a:"No. We prepare the documents primes ask for. Award decisions are made by the buyer."},
    {q:"Do I need a live SpaceX bid to buy?", a:"No. Most of our clients buy before any specific opportunity — the same package works for LNG, industrial maintenance, marine, and municipal."},
    {q:"What if I already have a capability statement?", a:"Bring it. We will tell you honestly whether it survives a prime's procurement review, or start from scratch."},
    {q:"What files do you need?", a:"W-9, current COI, license (if applicable), any safety program, EMR letter if you have it, references, 3 example projects. Missing pieces are noted, not fabricated."},
    {q:"Refunds?", a:"Audit refundable only if we miss the 48-hour window for reasons other than incomplete intake. Proof Pack: 50% if cancelled before draft one; none after draft one delivered. Bid Desk: no refund after work starts."},
    {q:"Turnaround?", a:"Audit 48 hours. Proof Pack 10 business days standard / 5 rush. Bid Desk from 24 hours."},
    {q:"Who can see my files?", a:"Only the operator. Files are retained for 24 months and then deleted unless legally required otherwise. We do not sell client files."},
  ];
  return (
    <div className="section container-doc max-w-3xl">
      <div className="meta-label mb-3">DOCUMENT · FAQ</div>
      <h1 className="text-4xl font-bold uppercase mb-8">Frequently asked</h1>
      <div className="space-y-6">
        {items.map((it,i) => (
          <div key={i} className="border-b hairline pb-6" data-testid={`faq-${i}`}>
            <h3 className="text-lg font-bold uppercase mb-2">{it.q}</h3>
            <p className="font-serif text-lg leading-relaxed">{it.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function About() {
  return (
    <div className="section container-doc max-w-3xl">
      <div className="meta-label mb-3">DOCUMENT · ABOUT</div>
      <h1 className="text-4xl font-bold uppercase mb-8">About</h1>
      <div className="font-serif text-lg leading-relaxed space-y-4">
        <p>Louisiana Industrial Readiness is a solo Louisiana research and document-packaging practice.</p>
        <p>We do not staff, broker, or introduce. We take an operating company's existing facts — insurance, safety, projects, references — and package them the way industrial procurement teams already expect to see them.</p>
        <p>Starbase Louisiana opened the conversation. It is not the product. The same audit and proof pack are useful for LNG, industrial maintenance, marine support, municipal, and coastal Louisiana work.</p>
        <p>If you are looking for hype, insider access, or fabricated qualifications, we are not that company.</p>
      </div>
    </div>
  );
}

export function Contact() {
  const [form, setForm] = useState({name:"",email:"",company:"",message:""});
  const [sent, setSent] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    try { await api.post("/contact", form); setSent(true); toast.success("Message received."); }
    catch (err) { toast.error(formatErr(err)); }
  };
  return (
    <div className="section container-doc max-w-2xl">
      <div className="meta-label mb-3">DOCUMENT · CONTACT</div>
      <h1 className="text-4xl font-bold uppercase mb-8">Contact</h1>
      {sent ? <div className="doc-card doc-shadow-sm" data-testid="contact-sent"><p className="font-serif text-lg">Thanks — we'll respond within one business day.</p></div> : (
        <form onSubmit={submit} className="space-y-4" data-testid="contact-form">
          <Field label="Name" value={form.name} onChange={v=>setForm({...form,name:v})} required testId="contact-name"/>
          <Field label="Email" type="email" value={form.email} onChange={v=>setForm({...form,email:v})} required testId="contact-email"/>
          <Field label="Company" value={form.company} onChange={v=>setForm({...form,company:v})} testId="contact-company"/>
          <div>
            <label className="meta-label block mb-1">Message *</label>
            <textarea className="input-box" rows={6} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} required data-testid="contact-message"/>
          </div>
          <button type="submit" className="btn-primary" data-testid="contact-submit">Send Message</button>
        </form>
      )}
    </div>
  );
}

export function Checklist() {
  const [form, setForm] = useState({email:"",name:"",company:""});
  const [sent, setSent] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    try { await api.post("/leads", {...form, source:"checklist"}); setSent(true); toast.success("Check your inbox.");}
    catch (err) { toast.error(formatErr(err));}
  };
  return (
    <div className="section container-doc max-w-3xl">
      <div className="grid md:grid-cols-2 gap-10 items-start">
        <div>
          <div className="stamp mb-4">FREE · 2-PAGE PDF</div>
          <h1 className="text-4xl font-bold uppercase mb-4">Can a prime qualify you from what you have today?</h1>
          <p className="font-serif text-lg text-[color:var(--ink-muted)] mb-6">A 10-item checklist. Two minutes. No sales call. No SpaceX affiliation.</p>
          <ul className="space-y-2 text-sm">
            {["Legal name / insurance / W-9 match","COI currency","Safety program","EMR letter or note","Three named projects","Capability sheet","Vendor references","Response workflow","Louisiana license number"].map((x,i)=>
              <li key={i} className="flex gap-2"><Check size={16} className="text-[color:var(--pass)] mt-1 shrink-0"/> {x}</li>)}
          </ul>
        </div>
        <div className="doc-card doc-shadow">
          {sent ? <p className="font-serif text-lg" data-testid="checklist-sent">Sent. Check your inbox — including spam.</p> : (
            <form onSubmit={submit} className="space-y-4" data-testid="checklist-form">
              <Field label="Business Email *" type="email" value={form.email} onChange={v=>setForm({...form,email:v})} required testId="checklist-email"/>
              <Field label="Name" value={form.name} onChange={v=>setForm({...form,name:v})} testId="checklist-name"/>
              <Field label="Company" value={form.company} onChange={v=>setForm({...form,company:v})} testId="checklist-company"/>
              <button className="btn-primary w-full justify-center" data-testid="checklist-submit">Send Me The Checklist</button>
              <p className="text-xs text-[color:var(--ink-muted)]">One PDF. No newsletter, no upsell drip.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function Legal({ kind }) {
  const CONTENT = {
    terms: {
      title: "Terms of Service",
      body: [
        ["1. Service description","Louisiana Industrial Readiness (\"LIR\") provides three fixed-price document-preparation services (Qualification Audit, Industrial Proof Pack, Bid Invite Response Desk). We do not staff, broker, introduce, submit bids on your behalf, sign anything on your behalf, or price your work."],
        ["2. Truthful materials","Client must provide truthful and accurate information. LIR may refuse or cancel any order if the materials appear fabricated, plagiarized, or misrepresent the client's operating capacity."],
        ["3. No guarantee","LIR does not guarantee any award of contract, listing acceptance, portal approval, insurance approval, or any specific business outcome."],
        ["4. Limitation of liability","LIR's liability is limited to the fees paid for the specific order in question. LIR is not liable for consequential, indirect, incidental, or lost-profit damages."],
        ["5. Indemnity","Client indemnifies LIR against claims arising from client republishing LIR-produced materials with additions, edits, or unverified claims."],
        ["6. Governing law","Louisiana law governs. Venue is Louisiana."],
        ["7. Refunds","Audit: refundable only if LIR misses the 48-hour window for reasons other than incomplete intake. Proof Pack: 50% if cancelled before draft one is delivered; no refund thereafter. Bid Desk: no refund after work has started."],
        ["8. File retention","Client files are retained for 24 months from delivery, then deleted, unless legally required otherwise."],
      ]
    },
    privacy: {
      title: "Privacy Policy",
      body: [
        ["1. What we collect","Name, email, phone, company details, uploaded files necessary to prepare your deliverable."],
        ["2. Payments","Processed by Stripe. LIR does not store card details."],
        ["3. Files","Client files are stored securely and not sold or shared with third parties."],
        ["4. No staffing database","LIR does not operate a job-applicant or staffing database in v1."],
        ["5. Cookies","Essential session cookies only. Optional analytics off by default."],
      ]
    },
    disclaimer: {
      title: "Disclaimer",
      body: [
        ["1. Not advice","Nothing produced by LIR is legal, insurance, engineering, estimating, or procurement advice."],
        ["2. Not a broker","LIR does not broker introductions, sell leads, or place workers."],
        ["3. No affiliation","LIR is not affiliated with SpaceX, Tesla, xAI, NASA, Louisiana Economic Development, One Acadiana, Source Louisiana, or the State of Louisiana."],
        ["4. Public claims","Client is responsible for any claim published on client-owned surfaces after LIR delivery."],
      ]
    }
  };
  const c = CONTENT[kind];
  return (
    <div className="section container-doc max-w-3xl">
      <div className="meta-label mb-3">LEGAL DOCUMENT</div>
      <h1 className="text-4xl font-bold uppercase mb-8">{c.title}</h1>
      <div className="space-y-6 font-serif text-lg leading-relaxed">
        {c.body.map(([h,b],i) => <div key={i}><h2 className="font-sans uppercase text-lg tracking-wide mb-1">{h}</h2><p>{b}</p></div>)}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type="text", required, testId }) {
  return (
    <div>
      <label className="meta-label block mb-1">{label}{required && " *"}</label>
      <input type={type} className="input-box" value={value} onChange={e=>onChange(e.target.value)} required={required} data-testid={testId}/>
    </div>
  );
}
