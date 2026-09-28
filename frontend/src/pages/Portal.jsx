import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, API, formatErr } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { Upload, FileText, MessageSquare, CheckCircle, Loader2 } from "lucide-react";

export function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({email:"",password:""});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user && user.role) nav(user.role === "admin" ? "/admin" : "/app"); }, [user]);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const u = await login(form.email, form.password); nav(u.role === "admin" ? "/admin" : "/app"); }
    catch (err) { toast.error(formatErr(err)); }
    finally { setBusy(false); }
  };
  return (
    <div className="section container-doc max-w-md">
      <div className="doc-card doc-shadow">
        <div className="meta-label mb-2">CLIENT / OPERATOR</div>
        <h1 className="text-3xl font-bold uppercase mb-6">Sign In</h1>
        <form onSubmit={submit} className="space-y-4" data-testid="login-form">
          <div><label className="meta-label block mb-1">Email</label><input className="input-box" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required data-testid="login-email"/></div>
          <div><label className="meta-label block mb-1">Password</label><input className="input-box" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required data-testid="login-password"/></div>
          <button disabled={busy} className="btn-primary w-full justify-center" data-testid="login-submit">{busy ? <Loader2 className="animate-spin" size={16}/> : "Sign In"}</button>
        </form>
        <p className="text-sm mt-6 text-[color:var(--ink-muted)]">No account? <Link to="/signup" data-testid="signup-link">Create one</Link>.</p>
      </div>
    </div>
  );
}

export function Signup() {
  const { register, user } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const nextCode = sp.get("next");
  const [form, setForm] = useState({email:"",password:"",name:"",company_name:"",phone:""});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user && user.role) nav(user.role === "admin" ? "/admin" : "/app"); }, [user]);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const u = await register(form);
      if (nextCode) {
        const r = await api.post("/payments/checkout", { product_code: nextCode, origin_url: window.location.origin });
        window.location.href = r.data.checkout_url;
      } else {
        nav(u.role === "admin" ? "/admin" : "/app");
      }
    } catch (err) { toast.error(formatErr(err)); }
    finally { setBusy(false); }
  };
  return (
    <div className="section container-doc max-w-md">
      <div className="doc-card doc-shadow">
        <div className="meta-label mb-2">NEW · CLIENT ACCOUNT</div>
        <h1 className="text-3xl font-bold uppercase mb-6">Create Account</h1>
        <form onSubmit={submit} className="space-y-4" data-testid="signup-form">
          <Fld label="Company name" v={form.company_name} on={v=>setForm({...form,company_name:v})} req testId="signup-company"/>
          <Fld label="Your name" v={form.name} on={v=>setForm({...form,name:v})} req testId="signup-name"/>
          <Fld label="Business email" type="email" v={form.email} on={v=>setForm({...form,email:v})} req testId="signup-email"/>
          <Fld label="Phone" v={form.phone} on={v=>setForm({...form,phone:v})} testId="signup-phone"/>
          <Fld label="Password" type="password" v={form.password} on={v=>setForm({...form,password:v})} req testId="signup-password"/>
          <button disabled={busy} className="btn-primary w-full justify-center" data-testid="signup-submit">{busy ? <Loader2 className="animate-spin" size={16}/> : "Create Account"}</button>
        </form>
        <p className="text-sm mt-6 text-[color:var(--ink-muted)]">Already have one? <Link to="/login">Sign in</Link>.</p>
      </div>
    </div>
  );
}

function Fld({ label, v, on, type="text", req, testId }) {
  return <div><label className="meta-label block mb-1">{label}{req && " *"}</label><input className="input-box" type={type} value={v} onChange={e=>on(e.target.value)} required={req} data-testid={testId}/></div>;
}

export function PaymentSuccess() {
  const [sp] = useSearchParams();
  const sessionId = sp.get("session_id");
  const [order, setOrder] = useState(null);
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (!sessionId) return;
    const check = async () => {
      try {
        const r = await api.get(`/payments/status/${sessionId}`);
        setOrder(r.data);
        if (r.data.status === "pending_payment" && tries < 6) {
          setTimeout(() => setTries(t=>t+1), 2000);
        }
      } catch (e) {}
    };
    check();
  }, [sessionId, tries]);
  return (
    <div className="section container-doc max-w-2xl">
      <div className="doc-card doc-shadow p-10 text-center" data-testid="payment-success">
        <CheckCircle size={48} className="mx-auto text-[color:var(--pass)] mb-4"/>
        <div className="stamp mb-4">PAYMENT · RECEIVED</div>
        <h1 className="text-3xl font-bold uppercase mb-4">Thank you.</h1>
        <p className="font-serif text-lg mb-6">Your receipt has been emailed. The next step is your intake — the 48-hour clock (or your Proof Pack schedule) starts when the intake is complete.</p>
        {order && <p className="meta-label mb-6">ORDER · {order.order_id?.slice(0,8)} · {order.status}</p>}
        <Link to="/app" className="btn-primary" data-testid="go-portal">Open Client Portal</Link>
      </div>
    </div>
  );
}

export function PaymentCancel() {
  return (
    <div className="section container-doc max-w-2xl">
      <div className="doc-card doc-shadow p-10 text-center">
        <h1 className="text-3xl font-bold uppercase mb-4">Checkout cancelled</h1>
        <p className="font-serif text-lg mb-6">No charge was made. You can restart from any product page.</p>
        <Link to="/" className="btn-outline">Return Home</Link>
      </div>
    </div>
  );
}

export function ClientPortal() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    api.get("/orders").then(r => { setOrders(r.data); setLoading(false); });
  }, [user]);
  if (!user) return <div className="section container-doc"><p>Please <Link to="/login">sign in</Link>.</p></div>;
  const STATUS_LABEL = {pending_payment:"Awaiting Payment", paid_incomplete_intake:"Intake Required", queued:"Queued", in_progress:"In Progress", needs_client:"Waiting On You", delivered:"Delivered", revision:"In Revision", closed:"Closed", refunded:"Refunded"};
  return (
    <div className="section container-doc">
      <div className="flex flex-wrap items-baseline justify-between mb-8 gap-4">
        <div>
          <div className="meta-label">CLIENT PORTAL</div>
          <h1 className="text-3xl font-bold uppercase mt-1">Welcome, {user.name}</h1>
        </div>
        <Link to="/audit" className="btn-outline" data-testid="portal-new-order">New Order</Link>
      </div>
      {loading ? <Loader2 className="animate-spin"/> : orders.length === 0 ? (
        <div className="doc-card doc-shadow-sm" data-testid="portal-empty">
          <p className="font-serif text-lg">No orders yet. Start with the <Link to="/audit">$249 Audit</Link> or forward a bid invite to the <Link to="/bid-desk">Bid Desk</Link>.</p>
        </div>
      ) : (
        <div className="border-2 ink-border bg-[color:var(--card)]" data-testid="portal-orders">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--paper-alt)] border-b-2 ink-border">
              <tr><th className="text-left p-3">Order</th><th className="text-left p-3">Product</th><th className="text-left p-3">Status</th><th className="text-left p-3">Placed</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-t hairline">
                  <td className="p-3 font-mono text-xs">{o.id.slice(0,8)}</td>
                  <td className="p-3">{o.product_name}</td>
                  <td className="p-3"><span className="status-pill">{STATUS_LABEL[o.status] || o.status}</span></td>
                  <td className="p-3 font-mono text-xs">{o.created_at?.slice(0,10)}</td>
                  <td className="p-3 text-right"><Link to={`/app/order/${o.id}`} className="text-[color:var(--gulf)] font-bold uppercase text-xs" data-testid={`portal-order-${o.id}`}>Open →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ClientOrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [intake, setIntake] = useState({});
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const load = async () => { const r = await api.get(`/orders/${id}`); setOrder(r.data); setIntake(r.data.intake?.answers || {}); };
  useEffect(() => { if (user) load(); }, [id, user]);
  if (!user) return <div className="section container-doc">Please sign in.</div>;
  if (!order) return <div className="section container-doc"><Loader2 className="animate-spin"/></div>;
  const saveIntake = async () => {
    try { await api.post("/intakes", { order_id: id, answers: intake }); toast.success("Intake saved."); load(); }
    catch (e) { toast.error(formatErr(e)); }
  };
  const upload = async () => {
    if (!file) return;
    const fd = new FormData(); fd.append("order_id", id); fd.append("category","other"); fd.append("file", file);
    try { await api.post("/files/upload", fd, { headers: {"Content-Type":"multipart/form-data"} }); toast.success("Uploaded."); setFile(null); load(); }
    catch (e) { toast.error(formatErr(e)); }
  };
  const sendMsg = async () => {
    if (!msg.trim()) return;
    try { await api.post("/messages", { order_id: id, body: msg }); setMsg(""); load(); } catch (e) { toast.error(formatErr(e)); }
  };
  return (
    <div className="section container-doc">
      <Link to="/app" className="meta-label" data-testid="back-portal">← Back to Portal</Link>
      <h1 className="text-3xl font-bold uppercase mt-2 mb-2">{order.product_name}</h1>
      <div className="meta-label mb-8">ORDER · {order.id.slice(0,8)} · STATUS: {order.status}</div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="doc-card">
            <h2 className="text-xl font-bold uppercase mb-4 flex items-center gap-2"><FileText size={18}/> Intake</h2>
            <div className="space-y-3">
              <Ta label="Legal company name *" v={intake.legal_name||""} on={v=>setIntake({...intake, legal_name:v})} testId="intake-legal-name"/>
              <Ta label="Primary contact & phone *" v={intake.contact||""} on={v=>setIntake({...intake, contact:v})} testId="intake-contact"/>
              <Ta label="City / parish *" v={intake.city||""} on={v=>setIntake({...intake, city:v})} testId="intake-city"/>
              <Ta label="Trades / services *" v={intake.trades||""} on={v=>setIntake({...intake, trades:v})} testId="intake-trades"/>
              <Ta label="Years in business" v={intake.years||""} on={v=>setIntake({...intake, years:v})}/>
              <Ta label="Crew size" v={intake.crew||""} on={v=>setIntake({...intake, crew:v})}/>
              <Ta label="Insurance (GL / auto / WC)" v={intake.insurance||""} on={v=>setIntake({...intake, insurance:v})}/>
              <Ta label="3 example projects (name / year / owner / scope)" v={intake.projects||""} on={v=>setIntake({...intake, projects:v})} rows={5} testId="intake-projects"/>
              {order.product_code === "audit" && <Ta label="Current website URL" v={intake.website||""} on={v=>setIntake({...intake, website:v})}/>}
              {order.product_code?.startsWith("proof") && <>
                <Ta label="Words you want on the capabilities sheet" v={intake.proof_wants||""} on={v=>setIntake({...intake, proof_wants:v})} rows={3}/>
                <Ta label="Words you refuse to claim" v={intake.proof_refuse||""} on={v=>setIntake({...intake, proof_refuse:v})} rows={3}/>
              </>}
              {["triage","map","assembly","assembly_rush"].includes(order.product_code) && <>
                <Ta label="Invite URL (or upload PDF below) *" v={intake.invite_url||""} on={v=>setIntake({...intake, invite_url:v})} testId="intake-invite-url"/>
                <Ta label="Stated due date *" v={intake.due_date||""} on={v=>setIntake({...intake, due_date:v})}/>
                <Ta label="GC / sender name" v={intake.gc_name||""} on={v=>setIntake({...intake, gc_name:v})}/>
                <label className="flex items-start gap-2 text-sm mt-3"><input type="checkbox" checked={!!intake.estimating_ack} onChange={e=>setIntake({...intake, estimating_ack: e.target.checked})} data-testid="intake-estimating-ack"/> I acknowledge that LIR does not price work — estimating is on our side. *</label>
              </>}
            </div>
            <button onClick={saveIntake} className="btn-primary mt-4" data-testid="intake-save">Save Intake</button>
          </section>

          <section className="doc-card">
            <h2 className="text-xl font-bold uppercase mb-4 flex items-center gap-2"><Upload size={18}/> Files</h2>
            <div className="flex gap-3 mb-4">
              <input type="file" onChange={e=>setFile(e.target.files[0])} data-testid="file-input"/>
              <button onClick={upload} className="btn-outline" disabled={!file} data-testid="file-upload-btn">Upload</button>
            </div>
            {order.files.length > 0 && (
              <ul className="border ink-border divide-y hairline" data-testid="file-list">
                {order.files.map(f => (
                  <li key={f.id} className="flex justify-between p-2 text-sm">
                    <span className="truncate">{f.original_filename} <span className="meta-label ml-2">{f.category}</span></span>
                    <a href={`${API}/files/${f.id}`} className="text-[color:var(--gulf)] font-bold" data-testid={`file-dl-${f.id}`}>Download</a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="doc-card">
            <h2 className="text-xl font-bold uppercase mb-4 flex items-center gap-2"><MessageSquare size={18}/> Messages</h2>
            <div className="space-y-3 mb-4 max-h-64 overflow-auto">
              {order.messages.length === 0 ? <p className="text-sm text-[color:var(--ink-muted)]">No messages yet.</p> :
                order.messages.map(m => <div key={m.id} className="border-l-4 border-[color:var(--gulf)] pl-3 py-1"><div className="meta-label">{m.from_name || m.from_role} · {m.created_at?.slice(0,16).replace("T"," ")}</div><p className="font-serif">{m.body}</p></div>)}
            </div>
            <div className="flex gap-2">
              <input className="input-box" value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Type a message" data-testid="msg-input"/>
              <button onClick={sendMsg} className="btn-outline" data-testid="msg-send">Send</button>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="doc-card doc-shadow-sm">
            <div className="meta-label mb-2">DELIVERABLES</div>
            {order.deliverables?.length ? order.deliverables.map(d => (
              <div key={d.id} className="text-sm">{d.type}</div>
            )) : null}
            {order.files?.filter(f=>f.category==="deliverable").map(f => (
              <a key={f.id} href={`${API}/files/${f.id}`} className="block text-sm text-[color:var(--gulf)] font-bold mt-2" data-testid={`dl-deliverable-${f.id}`}>Download {f.original_filename}</a>
            ))}
            {(!order.deliverables?.length && !order.files?.filter(f=>f.category==="deliverable").length) && <p className="text-sm text-[color:var(--ink-muted)]">Available after delivery.</p>}
          </div>
          <div className="doc-card doc-shadow-sm">
            <div className="meta-label mb-2">SUMMARY</div>
            <div className="text-sm space-y-1">
              <div>Amount: <span className="font-mono">${(order.amount_cents/100).toFixed(2)}</span></div>
              {order.credit_applied_cents ? <div>Credit: <span className="font-mono">${(order.credit_applied_cents/100).toFixed(2)}</span></div> : null}
              <div>Placed: {order.created_at?.slice(0,10)}</div>
              {order.paid_at && <div>Paid: {order.paid_at?.slice(0,10)}</div>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Ta({ label, v, on, rows=2, testId }) {
  return <div><label className="meta-label block mb-1">{label}</label><textarea className="input-box" rows={rows} value={v} onChange={e=>on(e.target.value)} data-testid={testId}/></div>;
}
