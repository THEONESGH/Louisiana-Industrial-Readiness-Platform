import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, formatErr } from "../lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function PublicProof() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({name:"",email:"",company:"",phone:"",needed_by:"",scope:""});
  const [sent, setSent] = useState(false);
  useEffect(() => {
    api.get(`/proof-pages/${slug}`).then(r => setPage(r.data)).catch(() => setNotFound(true));
  }, [slug]);
  if (notFound) return <div className="section container-doc"><h1 className="text-3xl font-bold uppercase">404 — Page Not Found</h1><p className="mt-2">This proof page is not published.</p></div>;
  if (!page) return <div className="section container-doc"><Loader2 className="animate-spin"/></div>;
  const c = page.content;
  const submit = async (e) => {
    e.preventDefault();
    try { await api.post("/proof-quotes", { slug, ...form }); setSent(true); toast.success("Quote request sent."); }
    catch (err) { toast.error(formatErr(err)); }
  };
  return (
    <div className="section container-doc max-w-5xl">
      <div className="doc-card doc-shadow p-8 sm:p-12" data-testid="proof-page">
        <div className="flex justify-between items-start border-b-2 ink-border pb-4 mb-6">
          <div>
            <div className="meta-label">CAPABILITIES · INDUSTRIAL</div>
            <h1 className="text-3xl sm:text-4xl font-bold uppercase mt-1">{c.company_name}</h1>
            <div className="meta-label mt-1">{c.parish}</div>
          </div>
          <div className="stamp">BID READY</div>
        </div>
        <p className="font-serif text-lg mb-8 leading-relaxed">{c.intro}</p>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="meta-label mb-2">SERVICES MATRIX</div>
            <ul className="border ink-border">{c.services?.map(s => <li key={s} className="p-2 border-b hairline last:border-0">{s}</li>)}</ul>
          </div>
          <div>
            <div className="meta-label mb-2">SERVICE AREA</div>
            <p className="font-serif">{c.service_area}</p>
          </div>
        </div>
        <div className="mt-8">
          <div className="meta-label mb-2">SELECTED PROJECTS</div>
          <table className="w-full text-sm border ink-border">
            <thead className="bg-[color:var(--paper-alt)]"><tr><th className="text-left p-2 border-r hairline">Project</th><th className="text-left p-2 border-r hairline w-20">Year</th><th className="text-left p-2">Scope</th></tr></thead>
            <tbody>{c.projects?.map((p,i) => <tr key={i} className="border-t hairline"><td className="p-2 border-r hairline font-medium">{p.name}</td><td className="p-2 border-r hairline font-mono">{p.year}</td><td className="p-2 font-serif">{p.scope}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="mt-6 font-serif italic text-[color:var(--ink-muted)]">{c.notes}</p>
      </div>

      <div className="doc-card doc-shadow mt-8" id="quote">
        <div className="meta-label mb-2">REQUEST · QUOTE</div>
        <h2 className="text-2xl font-bold uppercase mb-4">Request a quote</h2>
        {sent ? <p className="font-serif text-lg" data-testid="quote-sent">Received. {c.company_name} will respond directly.</p> : (
          <form onSubmit={submit} className="grid md:grid-cols-2 gap-4" data-testid="quote-form">
            <F label="Name *" v={form.name} on={v=>setForm({...form,name:v})} req testId="q-name"/>
            <F label="Company *" v={form.company} on={v=>setForm({...form,company:v})} req testId="q-company"/>
            <F label="Email *" type="email" v={form.email} on={v=>setForm({...form,email:v})} req testId="q-email"/>
            <F label="Phone *" v={form.phone} on={v=>setForm({...form,phone:v})} req testId="q-phone"/>
            <F label="Needed by" v={form.needed_by} on={v=>setForm({...form,needed_by:v})} testId="q-needed"/>
            <div className="md:col-span-2"><label className="meta-label block mb-1">Scope *</label><textarea className="input-box" rows={4} value={form.scope} onChange={e=>setForm({...form,scope:e.target.value})} required data-testid="q-scope"/></div>
            <div className="md:col-span-2"><button className="btn-primary" data-testid="q-submit">Send Quote Request</button></div>
          </form>
        )}
      </div>
    </div>
  );
}

function F({ label, v, on, type="text", req, testId }) {
  return <div><label className="meta-label block mb-1">{label}</label><input className="input-box" type={type} value={v} onChange={e=>on(e.target.value)} required={req} data-testid={testId}/></div>;
}
