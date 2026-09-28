import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, API, formatErr } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const CATS = [
  ["identity","Company identity clarity"],
  ["scope","Scope clarity"],
  ["licensing","Licensing signals"],
  ["insurance","Insurance document quality"],
  ["safety","Safety documentation"],
  ["projects","Project proof"],
  ["workforce","Workforce / capacity"],
  ["vendor_docs","Vendor documents"],
  ["website","Website / findability"],
  ["response","Response workflow"],
];

export function AdminPortal() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("all");
  const load = async () => {
    const [o, s] = await Promise.all([api.get("/orders"), api.get("/admin/dashboard")]);
    setOrders(o.data); setStats(s.data);
  };
  useEffect(() => { if (user?.role === "admin") load(); }, [user]);
  if (!user) return <div className="section container-doc"><Link to="/login">Sign in</Link>.</div>;
  if (user.role !== "admin") return <div className="section container-doc">Admin access only.</div>;
  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const setStatus = async (id, status) => {
    try { await api.post(`/admin/orders/${id}/status`, { status }); toast.success("Updated."); load(); } catch (e) { toast.error(formatErr(e)); }
  };
  return (
    <div className="section container-doc">
      <div className="meta-label">ADMIN · OPERATOR CONSOLE</div>
      <h1 className="text-3xl font-bold uppercase mb-8 mt-1">Queue</h1>
      {stats && (
        <div className="grid md:grid-cols-4 gap-4 mb-8" data-testid="admin-stats">
          <Stat label="Total Orders" value={orders.length}/>
          <Stat label="Leads" value={stats.leads}/>
          <Stat label="Revenue" value={`$${((stats.revenue_cents||0)/100).toFixed(0)}`}/>
          <Stat label="In Progress" value={stats.by_status?.in_progress || 0}/>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-4">
        {["all","paid_incomplete_intake","queued","in_progress","needs_client","delivered"].map(s => (
          <button key={s} onClick={()=>setFilter(s)} className={"px-3 py-1 border ink-border text-xs uppercase font-mono " + (filter===s ? "bg-[color:var(--ink)] text-[color:var(--paper)]" : "bg-white")} data-testid={`filter-${s}`}>{s.replace(/_/g," ")}</button>
        ))}
      </div>
      <div className="border-2 ink-border overflow-x-auto" data-testid="admin-orders">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--paper-alt)] border-b-2 ink-border">
            <tr><th className="text-left p-2">Order</th><th className="text-left p-2">Product</th><th className="text-left p-2">Status</th><th className="text-left p-2">Amount</th><th className="text-left p-2">Placed</th><th className="p-2"></th></tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-t hairline">
                <td className="p-2 font-mono text-xs">{o.id.slice(0,8)}</td>
                <td className="p-2">{o.product_name}</td>
                <td className="p-2"><span className="status-pill">{o.status}</span></td>
                <td className="p-2 font-mono">${(o.amount_cents/100).toFixed(0)}</td>
                <td className="p-2 font-mono text-xs">{o.created_at?.slice(0,10)}</td>
                <td className="p-2 text-right"><Link to={`/admin/order/${o.id}`} className="text-[color:var(--gulf)] font-bold uppercase text-xs" data-testid={`admin-open-${o.id}`}>Open →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-8 flex gap-3">
        <a href={`${API}/admin/leads.csv`} className="btn-outline" data-testid="export-leads">Export Leads CSV</a>
        <Link to="/admin/proof-pages" className="btn-outline" data-testid="manage-proof-pages">Manage Proof Pages</Link>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return <div className="doc-card doc-shadow-sm"><div className="meta-label">{label}</div><div className="text-3xl font-mono font-bold mt-1">{value}</div></div>;
}

export function AdminOrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [scores, setScores] = useState({});
  const [summary, setSummary] = useState("");
  const [nextP, setNextP] = useState("Industrial Proof Pack ($995) — recommended within 14 days to apply the $249 credit.");
  const [msg, setMsg] = useState("");

  const load = async () => {
    const r = await api.get(`/orders/${id}`);
    setOrder(r.data);
    if (r.data.score) { setScores(r.data.score.scores || {}); setSummary(r.data.score.summary || ""); setNextP(r.data.score.next_product || nextP); }
  };
  useEffect(() => { if (user?.role === "admin") load(); }, [id, user]);
  if (!user || user.role !== "admin") return <div className="section container-doc">Admin only.</div>;
  if (!order) return <div className="section container-doc"><Loader2 className="animate-spin"/></div>;

  const setCat = (k, field, value) => setScores(s => ({...s, [k]: {...(s[k]||{}), [field]: value}}));

  const saveScore = async () => {
    try { await api.post(`/admin/orders/${id}/score`, { scores, summary, next_product: nextP }); toast.success("Scored & PDF generated."); load(); }
    catch (e) { toast.error(formatErr(e)); }
  };
  const setStatus = async (status) => {
    try { await api.post(`/admin/orders/${id}/status`, { status }); toast.success("Status updated."); load(); } catch (e) { toast.error(formatErr(e)); }
  };
  const sendMsg = async () => { if (!msg) return; try { await api.post("/messages", { order_id: id, body: msg }); setMsg(""); load(); } catch (e) { toast.error(formatErr(e)); } };

  return (
    <div className="section container-doc">
      <Link to="/admin" className="meta-label">← Queue</Link>
      <h1 className="text-3xl font-bold uppercase mt-2">{order.product_name}</h1>
      <div className="meta-label mb-6">ORDER · {order.id.slice(0,8)} · {order.status}</div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="doc-card">
            <h2 className="text-xl font-bold uppercase mb-3">Intake Answers</h2>
            {order.intake ? (
              <table className="w-full text-sm">
                <tbody>{Object.entries(order.intake.answers || {}).map(([k,v]) => <tr key={k} className="border-b hairline"><td className="meta-label py-2 pr-4 align-top w-1/3">{k}</td><td className="py-2 font-serif">{String(v)}</td></tr>)}</tbody>
              </table>
            ) : <p className="text-sm text-[color:var(--ink-muted)]">Intake not yet submitted.</p>}
          </section>

          <section className="doc-card">
            <h2 className="text-xl font-bold uppercase mb-3">Files</h2>
            {order.files?.length ? (
              <ul className="border ink-border divide-y hairline">
                {order.files.map(f => (
                  <li key={f.id} className="flex justify-between p-2 text-sm">
                    <span>{f.original_filename} <span className="meta-label ml-2">{f.category}{f.kind ? " · " + f.kind : ""}</span></span>
                    <a href={`${API}/files/${f.id}`} className="text-[color:var(--gulf)] font-bold">Download</a>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-[color:var(--ink-muted)]">No files uploaded.</p>}
          </section>

          {order.product_code === "audit" && (
            <section className="doc-card">
              <h2 className="text-xl font-bold uppercase mb-3">Audit Scorecard</h2>
              <table className="w-full text-sm border ink-border" data-testid="admin-scorecard">
                <thead className="bg-[color:var(--paper-alt)]">
                  <tr><th className="text-left p-2 border-r hairline">Category</th><th className="p-2 border-r hairline w-40">Status</th><th className="text-left p-2">Comment</th></tr>
                </thead>
                <tbody>
                  {CATS.map(([k,label]) => (
                    <tr key={k} className="border-t hairline">
                      <td className="p-2 border-r hairline font-medium">{label}</td>
                      <td className="p-2 border-r hairline">
                        <select className="input-box" value={scores[k]?.status||""} onChange={e=>setCat(k,"status",e.target.value)} data-testid={`score-${k}-status`}>
                          <option value="">—</option><option value="green">GREEN</option><option value="yellow">YELLOW</option><option value="red">RED</option>
                        </select>
                      </td>
                      <td className="p-2"><input className="input-box" value={scores[k]?.comment||""} onChange={e=>setCat(k,"comment",e.target.value)} data-testid={`score-${k}-comment`}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4"><label className="meta-label block mb-1">Summary paragraph</label><textarea className="input-box" rows={4} value={summary} onChange={e=>setSummary(e.target.value)} data-testid="score-summary"/></div>
              <div className="mt-3"><label className="meta-label block mb-1">Recommended next step</label><input className="input-box" value={nextP} onChange={e=>setNextP(e.target.value)} data-testid="score-next"/></div>
              <button onClick={saveScore} className="btn-primary mt-4" data-testid="score-save">Save & Generate PDF</button>
            </section>
          )}

          <section className="doc-card">
            <h2 className="text-xl font-bold uppercase mb-3">Messages</h2>
            <div className="space-y-2 max-h-64 overflow-auto mb-3">
              {order.messages?.map(m => <div key={m.id} className="border-l-4 border-[color:var(--gulf)] pl-3"><div className="meta-label">{m.from_name || m.from_role} · {m.created_at?.slice(0,16).replace("T"," ")}</div><p className="font-serif">{m.body}</p></div>)}
            </div>
            <div className="flex gap-2"><input className="input-box" value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Reply" data-testid="admin-msg"/><button onClick={sendMsg} className="btn-outline">Send</button></div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="doc-card doc-shadow-sm">
            <div className="meta-label mb-2">STATUS CONTROLS</div>
            <div className="flex flex-col gap-2">
              {["queued","in_progress","needs_client","delivered","revision","closed"].map(s => (
                <button key={s} onClick={()=>setStatus(s)} className="btn-outline text-xs" data-testid={`admin-status-${s}`}>{s.replace(/_/g," ")}</button>
              ))}
            </div>
          </div>
          <div className="doc-card doc-shadow-sm">
            <div className="meta-label mb-2">CHECKLIST · {order.product_code}</div>
            {order.product_code === "audit" && <ol className="text-sm space-y-1 font-serif list-decimal ml-4"><li>Verify payment</li><li>Review site + uploads</li><li>Score 10 categories</li><li>Write fix list</li><li>Save & PDF</li><li>Mark delivered</li></ol>}
            {order.product_code?.startsWith("proof") && <ol className="text-sm space-y-1 font-serif list-decimal ml-4"><li>Verify facts with client (no invented projects)</li><li>Draft capabilities sheet</li><li>Draft 3 project sheets</li><li>Build /p/ page</li><li>Send draft</li><li>Revisions</li><li>Publish / final zip</li></ol>}
            {["triage","map","assembly","assembly_rush"].includes(order.product_code) && <ol className="text-sm space-y-1 font-serif list-decimal ml-4"><li>Source log</li><li>Deadline extract</li><li>Required docs list</li><li>Missing evidence</li><li>Out-of-scope items</li><li>Deliver memo</li><li>Do not price</li></ol>}
          </div>
        </aside>
      </div>
    </div>
  );
}
