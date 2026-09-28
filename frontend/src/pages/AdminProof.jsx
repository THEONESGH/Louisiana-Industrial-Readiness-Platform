import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, formatErr } from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { Loader2, Plus, ExternalLink, Trash2, Save } from "lucide-react";

const EMPTY = {
  slug: "",
  company_id: "",
  published: false,
  content: {
    company_name: "",
    parish: "",
    intro: "",
    services: [],
    service_area: "",
    projects: [],
    notes: "",
  },
};

export function AdminProofPages() {
  const { user } = useAuth();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    try { const r = await api.get("/admin/proof-pages"); setPages(r.data); }
    catch (e) { toast.error(formatErr(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (user?.role === "admin") load(); }, [user]);
  if (!user || user.role !== "admin") return <div className="section container-doc">Admin only.</div>;
  return (
    <div className="section container-doc">
      <Link to="/admin" className="meta-label" data-testid="back-queue">← Queue</Link>
      <div className="flex items-baseline justify-between mt-2 mb-8">
        <h1 className="text-3xl font-bold uppercase">Proof pages</h1>
        <Link to="/admin/proof-pages/new" className="btn-primary" data-testid="new-proof-btn"><Plus size={16}/> New Page</Link>
      </div>
      {loading ? <Loader2 className="animate-spin"/> : pages.length === 0 ? (
        <div className="doc-card doc-shadow-sm"><p className="font-serif text-lg">No proof pages yet. <Link to="/admin/proof-pages/new">Create the first one</Link>.</p></div>
      ) : (
        <div className="border-2 ink-border bg-[color:var(--card)]" data-testid="proof-pages-list">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--paper-alt)] border-b-2 ink-border">
              <tr><th className="text-left p-3">Slug</th><th className="text-left p-3">Company</th><th className="text-left p-3">Status</th><th className="text-left p-3">Updated</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {pages.map(p => (
                <tr key={p.slug} className="border-t hairline">
                  <td className="p-3 font-mono">/p/{p.slug}</td>
                  <td className="p-3">{p.content?.company_name || "—"}</td>
                  <td className="p-3"><span className={"status-pill " + (p.published ? "status-green" : "status-yellow")}>{p.published ? "Published" : "Draft"}</span></td>
                  <td className="p-3 font-mono text-xs">{p.updated_at?.slice(0,10)}</td>
                  <td className="p-3 text-right space-x-3">
                    {p.published && <a href={`/p/${p.slug}`} target="_blank" rel="noreferrer" className="text-[color:var(--gulf)] font-bold uppercase text-xs inline-flex items-center gap-1" data-testid={`view-${p.slug}`}>View <ExternalLink size={12}/></a>}
                    <Link to={`/admin/proof-pages/${p.slug}`} className="text-[color:var(--gulf)] font-bold uppercase text-xs" data-testid={`edit-${p.slug}`}>Edit →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AdminProofPageEdit() {
  const { slug } = useParams(); // "new" or existing slug
  const isNew = slug === "new";
  const nav = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [servicesText, setServicesText] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew || user?.role !== "admin") return;
    (async () => {
      try {
        // pull from admin list since public GET requires published=true
        const r = await api.get("/admin/proof-pages");
        const found = r.data.find(p => p.slug === slug);
        if (found) {
          setForm({
            slug: found.slug,
            company_id: found.company_id || "",
            published: !!found.published,
            content: { services: [], projects: [], ...(found.content || {}) },
          });
          setServicesText((found.content?.services || []).join("\n"));
        } else {
          toast.error("Page not found");
        }
      } catch (e) { toast.error(formatErr(e)); }
      finally { setLoading(false); }
    })();
  }, [slug, user, isNew]);

  if (!user || user.role !== "admin") return <div className="section container-doc">Admin only.</div>;
  if (loading) return <div className="section container-doc"><Loader2 className="animate-spin"/></div>;

  const setContent = (k, v) => setForm(f => ({ ...f, content: { ...f.content, [k]: v } }));
  const setProject = (i, k, v) => setForm(f => {
    const projects = [...(f.content.projects || [])];
    projects[i] = { ...(projects[i] || {}), [k]: v };
    return { ...f, content: { ...f.content, projects } };
  });
  const addProject = () => setContent("projects", [...(form.content.projects || []), { name: "", year: "", scope: "" }]);
  const removeProject = (i) => setContent("projects", (form.content.projects || []).filter((_, idx) => idx !== i));

  const save = async (opts = {}) => {
    const slugClean = (form.slug || "").toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
    if (!slugClean) { toast.error("Slug is required"); return; }
    const services = servicesText.split("\n").map(s => s.trim()).filter(Boolean);
    const payload = {
      slug: slugClean,
      company_id: form.company_id || crypto.randomUUID(),
      published: opts.publish !== undefined ? opts.publish : form.published,
      content: { ...form.content, services },
    };
    setBusy(true);
    try {
      await api.post("/admin/proof-pages", payload);
      toast.success(opts.publish === true ? "Published." : opts.publish === false ? "Unpublished." : "Saved.");
      if (isNew) nav(`/admin/proof-pages/${slugClean}`);
      else setForm(f => ({ ...f, slug: slugClean, published: payload.published, company_id: payload.company_id }));
    } catch (e) { toast.error(formatErr(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="section container-doc">
      <Link to="/admin/proof-pages" className="meta-label" data-testid="back-proof-list">← Proof pages</Link>
      <div className="flex items-baseline justify-between mt-2 mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-bold uppercase">{isNew ? "New Proof Page" : `Edit /p/${form.slug}`}</h1>
        <div className="flex gap-3 items-center">
          <span className={"status-pill " + (form.published ? "status-green" : "status-yellow")} data-testid="publish-badge">{form.published ? "Published" : "Draft"}</span>
          {form.published ? (
            <button onClick={() => save({ publish: false })} disabled={busy} className="btn-outline" data-testid="unpublish-btn">Unpublish</button>
          ) : (
            <button onClick={() => save({ publish: true })} disabled={busy || isNew} className="btn-primary" data-testid="publish-btn">Publish</button>
          )}
          <button onClick={() => save()} disabled={busy} className="btn-outline" data-testid="save-btn"><Save size={14}/> Save Draft</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="doc-card">
            <h2 className="text-xl font-bold uppercase mb-4">Identifiers</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Slug *" v={form.slug} on={v=>setForm({...form, slug: v})} testId="field-slug" mono
                help="Lowercase, dashes only. Public URL will be /p/your-slug."/>
              <Field label="Company (display name) *" v={form.content.company_name} on={v=>setContent("company_name", v)} testId="field-company"/>
              <Field label="Parish / location" v={form.content.parish} on={v=>setContent("parish", v)} testId="field-parish"
                placeholder="Vermilion Parish, LA"/>
              <Field label="Service area" v={form.content.service_area} on={v=>setContent("service_area", v)} testId="field-service-area"
                placeholder="75-mile radius of Abbeville, LA"/>
            </div>
          </section>

          <section className="doc-card">
            <h2 className="text-xl font-bold uppercase mb-4">Narrative</h2>
            <Textarea label="Intro paragraph" v={form.content.intro} on={v=>setContent("intro", v)} rows={4} testId="field-intro"/>
            <div className="mt-4">
              <Textarea label="Services (one per line)" v={servicesText} on={setServicesText} rows={6} testId="field-services"
                placeholder={"Site clearing & grubbing\nGrading & compaction\nCulvert & drainage"}/>
            </div>
            <div className="mt-4">
              <Textarea label="Footer note" v={form.content.notes} on={v=>setContent("notes", v)} rows={2} testId="field-notes"
                placeholder="Full COI, W-9, safety program available on request."/>
            </div>
          </section>

          <section className="doc-card">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xl font-bold uppercase">Selected projects</h2>
              <button onClick={addProject} className="btn-outline text-xs" data-testid="add-project"><Plus size={12}/> Add</button>
            </div>
            {(form.content.projects || []).length === 0 ? (
              <p className="text-sm text-[color:var(--ink-muted)]">No projects yet. Only add projects the client can verify.</p>
            ) : (
              <div className="space-y-4">
                {form.content.projects.map((p, i) => (
                  <div key={i} className="border ink-border p-3 grid md:grid-cols-12 gap-3" data-testid={`project-row-${i}`}>
                    <div className="md:col-span-5"><Field label="Project" v={p.name || ""} on={v=>setProject(i,"name",v)} testId={`project-name-${i}`}/></div>
                    <div className="md:col-span-2"><Field label="Year" v={p.year || ""} on={v=>setProject(i,"year",v)} testId={`project-year-${i}`} mono/></div>
                    <div className="md:col-span-4"><Field label="Scope" v={p.scope || ""} on={v=>setProject(i,"scope",v)} testId={`project-scope-${i}`}/></div>
                    <div className="md:col-span-1 flex items-end">
                      <button onClick={()=>removeProject(i)} className="btn-outline text-xs" data-testid={`project-remove-${i}`} title="Remove"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="doc-card doc-shadow-sm">
            <div className="meta-label mb-2">PREVIEW</div>
            <div className="bg-white border ink-border p-3 text-xs font-mono">
              /p/{form.slug || "your-slug"}
            </div>
            {!isNew && form.published && (
              <a href={`/p/${form.slug}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[color:var(--gulf)] font-bold uppercase text-xs" data-testid="open-public">Open live page <ExternalLink size={12}/></a>
            )}
          </div>
          <div className="doc-card doc-shadow-sm">
            <div className="meta-label mb-2">PUBLISH RULES</div>
            <ul className="text-sm font-serif space-y-2 list-disc ml-4">
              <li>Save the draft first. New pages can only be published after their first save.</li>
              <li>Only publish after the client has verified every project and service line.</li>
              <li>Do not publish invoiceable documents (W-9, COI). The public page names them as "available on request".</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, v, on, testId, mono, placeholder, help }) {
  return (
    <div>
      <label className="meta-label block mb-1">{label}</label>
      <input className={"input-box " + (mono ? "font-mono" : "")} value={v || ""} onChange={e=>on(e.target.value)} placeholder={placeholder} data-testid={testId}/>
      {help && <p className="text-xs text-[color:var(--ink-muted)] mt-1">{help}</p>}
    </div>
  );
}
function Textarea({ label, v, on, rows=3, testId, placeholder }) {
  return (
    <div>
      <label className="meta-label block mb-1">{label}</label>
      <textarea className="input-box" rows={rows} value={v || ""} onChange={e=>on(e.target.value)} placeholder={placeholder} data-testid={testId}/>
    </div>
  );
}
