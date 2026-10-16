"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, ArrowRight, BarChart3, Check, CheckCircle2, ChevronRight, Clipboard, Download, FileText, Layers3, LayoutDashboard, LoaderCircle, Megaphone, Package, Pencil, Plus, Settings2, ShieldCheck, Sparkles, Trash2, X as Close } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Campaign, Draft, Metric, Product, Settings } from "@/lib/types";
import { channels, copyText } from "@/lib/schemas";
import type { ProductInput, Variant } from "@/lib/schemas";
import { csv, rates, utmUrl } from "@/lib/analytics";

const navigation: [string, string, LucideIcon][] = [["overview", "Overview", LayoutDashboard], ["products", "Products", Package], ["studio", "Campaign Studio", Sparkles], ["drafts", "Drafts", FileText], ["analytics", "Analytics", BarChart3], ["settings", "Settings", Settings2]];
const path = (section: string) => section === "overview" ? "/" : `/${section}`;
const emptyProduct: ProductInput = { name: "", description: "", targetAudience: "", keyBenefits: "", category: "", price: "", landingUrl: "", brandVoice: "" };
const initialSettings: Settings = { anthropic: { configured: false, model: "" }, coreweave: { configured: false, model: "" } };
async function api<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed. Please try again.");
  return data as T;
}
function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: string }) { return <span className={`badge ${color}`}>{children}</span>; }
function Empty({ title, text }: { title: string; text: string }) { return <div className="empty"><Layers3 size={30} /><h3>{title}</h3><p>{text}</p></div>; }
function Stat({ title, value, caption, icon: Icon }: { title: string; value: string | number; caption: string; icon: LucideIcon }) {
  return <div className="stat"><div className="row between"><span>{title}</span><Icon size={18} /></div><strong>{value}</strong><small>{caption}</small></div>;
}
function download(campaigns: Campaign[]) {
  const rows = [["Product", "Channel", "Headline", "Body", "CTA", "Hashtags", "Positioning", "Status", "Source"]];
  campaigns.forEach(c => c.drafts.forEach(d => rows.push([c.product.name, c.channel, d.headline, d.body, d.cta, JSON.parse(d.hashtags).join(" "), d.positioning, d.status, c.isDemo ? "Demo template" : c.provider])));
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv(rows)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = "finsight-drafts.csv"; link.click(); URL.revokeObjectURL(url);
}
export default function Workspace({ section }: { section: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const refresh = useCallback(async () => {
    const results = await Promise.all([api<Product[]>("/api/products"), api<Campaign[]>("/api/campaigns"), api<Metric[]>("/api/analytics"), api<Settings>("/api/settings")]);
    setProducts(results[0]); setCampaigns(results[1]); setMetrics(results[2]); setSettings(results[3]);
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all([api<Product[]>("/api/products"), api<Campaign[]>("/api/campaigns"), api<Metric[]>("/api/analytics"), api<Settings>("/api/settings")])
      .then(([p, c, m, s]) => { if (active) { setProducts(p); setCampaigns(c); setMetrics(m); setSettings(s); } })
      .catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (notice) { const timer = setTimeout(() => setNotice(""), 5000); return () => clearTimeout(timer); } }, [notice]);
  const title = navigation.find(n => n[0] === section)?.[1] || "Overview";
  const action = async (job: () => Promise<unknown>, message: string) => {
    setError("");
    try { await job(); await refresh(); setNotice(message); return true; } catch (e) { setError((e as Error).message); return false; }
  };
  return <div className="app-shell">
    <a href="#main" className="skip">Skip to content</a>
    <aside className="sidebar">
      <Link className="brand" href="/"><span className="brand-icon"><Layers3 size={22} /></span>finsight<span className="brand-dot">.</span></Link>
      <div className="workspace-label"><span className="workspace-avatar">F</span><div><strong>Marketing workspace</strong><small>Personal workspace</small></div></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav aria-label="Main navigation">{navigation.map(([id, label, Icon]) => <Link href={path(id)} key={id} aria-current={section === id ? "page" : undefined} className={`nav-item ${section === id ? "active" : ""}`}><Icon size={19} />{label}{id === "drafts" && <span className="nav-count">{campaigns.flatMap(c => c.drafts).filter(d => d.status === "draft").length}</span>}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="safe-note"><ShieldCheck size={22} /><strong>Your voice. Your approval.</strong><p>Every idea starts as a draft. You decide what goes live.</p></div><div className="profile"><span className="avatar">ME</span><div><strong>My workspace</strong><small>Marketing Agent · MVP</small></div></div></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb">Workspace <ChevronRight size={14} /><span>{title}</span></div><div className="row"><span className="provider-dot" /><span className="topbar-provider">{!loading && settings.anthropic.configured ? "Claude connected" : "Demo workspace"}</span><span className="avatar small">ME</span></div></header>
      <main id="main">
        {error && <div className="alert error" role="alert"><div>{error}</div><button aria-label="Dismiss error" onClick={() => setError("")}><Close size={17} /></button></div>}
        {notice && <div className="toast" role="status"><CheckCircle2 size={18} />{notice}</div>}
        {loading ? <div className="loading" role="status"><LoaderCircle className="spin" />Loading your workspace…</div> : <>
          {!settings.anthropic.configured && <div className="demo-banner"><span><span className="tiny-spark">✦</span><strong>You’re in demo mode.</strong> Explore with fictional products and clearly labeled template copy.</span><Link href="/settings">Connect Claude <ArrowRight size={14} /></Link></div>}
          {section === "overview" && <Overview products={products} campaigns={campaigns} metrics={metrics} />}
          {section === "products" && <Products products={products} action={action} />}
          {section === "studio" && <Studio products={products} settings={settings} action={action} />}
          {section === "drafts" && <Drafts campaigns={campaigns} action={action} />}
          {section === "analytics" && <Analytics campaigns={campaigns} metrics={metrics} action={action} notify={setNotice} />}
          {section === "settings" && <SettingsPage settings={settings} />}
        </>}
        <footer>Built for thoughtful marketing.<span><ShieldCheck size={13} /> Human approval, always.</span></footer>
      </main>
    </div>
  </div>;
}
type Action = (job: () => Promise<unknown>, message: string) => Promise<boolean>;
function PageHeading({ eyebrow, title, text, children }: { eyebrow: string; title: string; text: string; children?: React.ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{text}</p></div>{children}</div>;
}
function Overview({ products, campaigns, metrics }: { products: Product[]; campaigns: Campaign[]; metrics: Metric[] }) {
  const drafts = campaigns.flatMap(c => c.drafts);
  const actual = metrics.filter(m => !m.isSynthetic);
  const conversions = actual.reduce((sum, m) => sum + m.conversions, 0);
  return <>
    <PageHeading eyebrow="YOUR MARKETING, IN FOCUS" title="Good ideas deserve great campaigns." text="A little product knowledge. A lot of possibilities."><Link className="button primary" href="/studio"><Plus size={18} />Create campaign</Link></PageHeading>
    <div className="stats-grid"><Stat title="Your products" value={products.length} caption="Ready to tell their story" icon={Package} /><Stat title="Campaigns created" value={campaigns.length} caption={`${campaigns.filter(c => c.isDemo).length} generated with demo templates`} icon={Megaphone} /><Stat title="Approved drafts" value={drafts.filter(d => d.status === "approved").length} caption={`${drafts.filter(d => d.status === "draft").length} drafts waiting for your review`} icon={CheckCircle2} /><Stat title="Tracked conversions" value={conversions} caption="Manually entered · excludes samples" icon={BarChart3} /></div>
    <div className="overview-middle"><section className="hero-card"><div className="hero-copy"><Badge color="purple"><Sparkles size={12} /> CAMPAIGN STUDIO</Badge><h2>From “what if”<br />to your next launch.</h2><p>Turn your product’s best features into three distinct angles. Find the one that sounds like you.</p><Link className="button dark" href="/studio">Let’s make something <ArrowUpRight size={17} /></Link></div><div className="hero-art" aria-hidden="true"><div className="orbit one" /><div className="orbit two" /><div className="art-card back"><span className="art-line" /><span className="art-line short" /></div><div className="art-card front"><span className="art-star">✦</span><span className="art-title">Your next big idea.</span><span className="art-line" /><span className="art-line short" /><div className="art-pill"><Check size={11} /> Ready for your review</div></div><span className="floating-star">✧</span></div></section>
      <section className="panel workflow"><div className="section-title"><h2>A simple path to launch</h2><span className="muted">01 — 03</span></div>{[["01", "Add your product", "Start with the facts that make it yours.", "/products"], ["02", "Explore three angles", "Pick a channel. Shape your message.", "/studio"], ["03", "Make it your own", "Review, refine, approve, and export.", "/drafts"]].map(([n, title, text, url]) => <Link key={n} href={url} className="workflow-step"><span className="step-number">{n}</span><div><strong>{title}</strong><p>{text}</p></div><ChevronRight size={16} /></Link>)}</section></div>
    <section className="panel"><div className="section-title"><div><h2>Recent campaigns</h2><p>Your latest ideas, all in one place.</p></div><Link className="text-link" href="/drafts">View all drafts <ArrowRight size={15} /></Link></div><CampaignTable campaigns={campaigns.slice(0, 5)} /></section>
    <div className="section-title product-preview-heading"><div><h2>Made for your products</h2><p>Start with a product. Build a story around it.</p></div><Link className="text-link" href="/products">Manage products <ArrowRight size={15} /></Link></div>
    <div className="product-grid">{products.slice(0, 3).map((p, index) => <div className="product-card compact" key={p.id}><div className="row between"><span className={`product-icon tint-${index % 3}`}><Package size={21} /></span>{p.isDemo && <Badge>Fictional product</Badge>}</div><h3>{p.name}</h3><p>{p.description}</p><Link className="text-link" href="/studio">Create a campaign <ArrowUpRight size={15} /></Link></div>)}</div>
  </>;
}
function CampaignTable({ campaigns }: { campaigns: Campaign[] }) {
  return campaigns.length ? <div className="table-scroll"><table><thead><tr><th>Campaign / product</th><th>Channel</th><th>Review status</th><th>Source</th><th>Created</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{campaigns.map(c => <tr key={c.id}><td><strong>{c.goal}</strong><small>{c.product.name}</small></td><td><Badge>{c.channel}</Badge></td><td><span className="status-dot" />{c.drafts.filter(d => d.status === "approved").length}/{c.drafts.length} approved</td><td><Badge color={c.isDemo ? "amber" : "green"}>{c.isDemo ? "Demo template" : c.provider === "anthropic" ? "Claude" : "CoreWeave"}</Badge></td><td className="muted">{new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td><td><Link className="icon-button" href="/drafts" aria-label={`Review ${c.goal}`}><ArrowUpRight size={17} /></Link></td></tr>)}</tbody></table></div> : <Empty title="Your first campaign starts here" text="Open Campaign Studio to turn a product into three drafts." />;
}
function Products({ products, action }: { products: Product[]; action: Action }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ProductInput>(emptyProduct);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");
  const open = (product?: Product) => {
    setEditing(product?.id || "new");
    setForm(product ? { name: product.name, description: product.description, targetAudience: product.targetAudience, keyBenefits: product.keyBenefits, category: product.category, price: product.price || "", landingUrl: product.landingUrl, brandVoice: product.brandVoice } : emptyProduct);
  };
  return <><PageHeading eyebrow="THE FOUNDATION" title="Products with a story to tell." text="Give your agent the facts. Keep every campaign grounded."><button className="button primary" onClick={() => open()}><Plus size={18} />Add product</button></PageHeading>
    {editing && <section className="panel form-panel"><div className="section-title"><h2>{editing === "new" ? "Add a product" : "Edit product"}</h2><button className="icon-button" aria-label="Close product form" onClick={() => setEditing(null)}><Close size={18} /></button></div><form onSubmit={async e => { e.preventDefault(); setBusy(true); const ok = await action(() => api(editing === "new" ? "/api/products" : `/api/products/${editing}`, editing === "new" ? "POST" : "PATCH", form), "Product saved"); setBusy(false); if (ok) setEditing(null); }}><div className="form-grid">{([ ["name", "Product name", 100], ["category", "Category", 80], ["targetAudience", "Target audience", 300], ["brandVoice", "Brand voice", 200], ["price", "Price (optional)", 80], ["landingUrl", "Landing URL", 2048] ] as const).map(([key, label, max]) => <label key={key}>{label}<input required={key !== "price"} type={key === "landingUrl" ? "url" : "text"} maxLength={max} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={key === "landingUrl" ? "https://…" : undefined} /></label>)}<label className="full">Description<textarea required minLength={10} maxLength={1500} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></label><label className="full">Key benefits <span className="hint">Separate benefits with semicolons. Include only verifiable facts.</span><textarea required maxLength={800} value={form.keyBenefits} onChange={e => setForm({ ...form, keyBenefits: e.target.value })} rows={2} /></label></div><div className="form-actions"><button type="button" className="button secondary" onClick={() => setEditing(null)}>Cancel</button><button className="button primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}Save product</button></div></form></section>}
    <div className="product-grid">{products.map((p, index) => <section className="product-card" key={p.id}><div className="row between"><span className={`product-icon tint-${index % 3}`}><Package size={23} /></span><Badge>{p.category}</Badge></div><h2>{p.name}</h2>{p.isDemo && <Badge color="amber">Fictional demo product</Badge>}<p>{p.description}</p><div className="product-facts"><span>MADE FOR</span><p>{p.targetAudience}</p><span>KEY BENEFITS</span><p>{p.keyBenefits}</p><span>BRAND VOICE</span><p>{p.brandVoice}</p></div><div className="row between"><strong>{p.price || "Price not set"}</strong><a href={p.landingUrl} target="_blank" rel="noreferrer" className="text-link">Landing page <ArrowUpRight size={14} /></a></div><div className="card-actions"><button className="button secondary" onClick={() => open(p)}><Pencil size={14} />Edit</button><button className="icon-button danger" aria-label={`Delete ${p.name}`} onClick={() => setConfirmDelete(p.id)}><Trash2 size={16} /></button></div>{confirmDelete === p.id && <div className="delete-confirm"><p>Delete this product, its campaigns, drafts, and metrics?</p><div className="row"><button className="button danger-solid" disabled={deleting === p.id} onClick={async () => { setDeleting(p.id); await action(() => api(`/api/products/${p.id}`, "DELETE", {}), "Product and associated campaigns deleted"); setDeleting(""); setConfirmDelete(""); }}>Delete product</button><button className="button secondary" onClick={() => setConfirmDelete("")}>Cancel</button></div></div>}</section>)}</div>{!products.length && <Empty title="A blank canvas" text="Add your first product to get started." />}
  </>;
}
function Studio({ products, settings, action }: { products: Product[]; settings: Settings; action: Action }) {
  const [productId, setProductId] = useState(products[0]?.id || "");
  const product = products.find(p => p.id === productId);
  const [channel, setChannel] = useState<typeof channels[number]>("LinkedIn");
  const [goal, setGoal] = useState("Introduce the product");
  const [audience, setAudience] = useState(products[0]?.targetAudience || "");
  const [tone, setTone] = useState("Clear and helpful");
  const [provider, setProvider] = useState(settings.anthropic.configured ? "anthropic" : "demo");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Campaign | null>(null);
  return <><PageHeading eyebrow="CAMPAIGN STUDIO" title="One product. Three fresh angles." text="Set the direction. Your marketing agent will find the words." />
    <div className="studio-layout"><section className="panel form-panel"><div className="section-title"><h2>Your campaign brief</h2><span className="step-tag">01 / BRIEF</span></div><form onSubmit={async e => { e.preventDefault(); setBusy(true); await action(async () => { const c = await api<Campaign>("/api/campaigns/generate", "POST", { productId, channel, goal, targetAudience: audience, tone, provider }); setResult(c); }, "Three variants saved as drafts"); setBusy(false); }}>
      <label>Product<select aria-label="Product" required value={productId} onChange={e => { setProductId(e.target.value); setAudience(products.find(p => p.id === e.target.value)?.targetAudience || ""); }}><option value="" disabled>Select a product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <fieldset><legend>Channel</legend><div className="channel-options">{channels.map(c => <button type="button" key={c} aria-label={c} aria-pressed={c === channel} className={c === channel ? "selected" : ""} onClick={() => setChannel(c)}>{c === "LinkedIn" ? <strong>in</strong> : c === "X" ? <strong>𝕏</strong> : c === "Email" ? <Megaphone size={17} /> : <LayoutDashboard size={17} />}{c}</button>)}</div></fieldset>
      <label>Campaign goal<input required maxLength={300} value={goal} onChange={e => setGoal(e.target.value)} /></label><label>Target audience<textarea required maxLength={300} rows={2} value={audience} onChange={e => setAudience(e.target.value)} /></label><label>Tone<input required maxLength={100} value={tone} onChange={e => setTone(e.target.value)} /></label>
      <label>Generation provider<select aria-label="Generation provider" value={provider} onChange={e => setProvider(e.target.value)}><option value="demo">Demo templates · no API calls</option><option value="anthropic" disabled={!settings.anthropic.configured}>Claude{!settings.anthropic.configured ? " · API key required" : " · live generation"}</option><option value="coreweave" disabled={!settings.coreweave.configured}>CoreWeave{!settings.coreweave.configured ? " · not configured" : " · live generation"}</option></select></label>
      <p className="hint">{provider === "demo" ? "Templates use your product facts. They do not adapt to goal, audience, or tone; connect Claude for tailored copy." : "One billable request, up to 2,400 output tokens. No automatic retries or provider fallback."}</p>
      <button className="button primary wide" disabled={busy || !productId}>{busy ? <LoaderCircle className="spin" size={18} /> : <Sparkles size={18} />}{busy ? "Creating your drafts…" : "Generate 3 variants"}</button>
      {!products.length && <p className="hint"><Link href="/products">Add a product</Link> before generating.</p>}
    </form></section><div className="studio-side"><section className="panel product-context"><div className="eyebrow">YOUR SOURCE OF TRUTH</div><span className="product-icon tint-0"><Package size={23} /></span><h2>{product?.name || "Choose your product"}</h2><p>{product?.description || "Product facts keep generated copy grounded."}</p><hr /><span className="eyebrow">WHAT MAKES IT USEFUL</span><p>{product?.keyBenefits || "Your key benefits appear here."}</p><span className="eyebrow">BRAND VOICE</span><p>{product?.brandVoice || "Your tone, consistently."}</p></section><div className="review-note"><ShieldCheck size={20} /><div><strong>A creative partner. You’re the editor.</strong><p>Copy is saved as drafts. Review every claim before approving and exporting.</p></div></div></div></div>
    {result && <section className="generated-results"><div className="section-title"><div><h2>Your three starting points</h2><p>Saved to Drafts · {result.channel}</p></div><Link href="/drafts" className="button secondary">Review & edit <ArrowRight size={16} /></Link></div><div className="variants-grid">{result.drafts.map((d, i) => <article className="panel variant-preview" key={d.id}><div className="row between"><span className="eyebrow">ANGLE 0{i + 1}</span><Badge color={result.isDemo ? "amber" : "purple"}>{result.isDemo ? "Demo template" : "AI draft"}</Badge></div><h3>{d.headline}</h3><p className="copy-body">{d.body}</p><strong>{d.cta}</strong><p className="hashtags">{JSON.parse(d.hashtags).join(" ")}</p><div className="positioning">{d.positioning}</div></article>)}</div></section>}
  </>;
}
function Drafts({ campaigns, action }: { campaigns: Campaign[]; action: Action }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const visible = campaigns.map(c => ({ ...c, drafts: c.drafts.filter(d => (filter === "all" || d.status === filter) && `${d.headline} ${c.product.name} ${c.channel}`.toLowerCase().includes(search.toLowerCase())) })).filter(c => c.drafts.length);
  return <><PageHeading eyebrow="THE EDITOR’S DESK" title="Make every word yours." text="Review your angles, refine the details, and approve with confidence."><button className="button secondary" disabled={!visible.length} onClick={() => download(visible)}><Download size={17} />Export visible CSV</button></PageHeading>
    <div className="filter-bar"><div className="tabs">{["all", "draft", "approved", "rejected"].map(f => <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>{f === "all" ? "All drafts" : f[0].toUpperCase() + f.slice(1)} <span>{campaigns.flatMap(c => c.drafts).filter(d => f === "all" || d.status === f).length}</span></button>)}</div><input aria-label="Search drafts" placeholder="Search product or headline…" value={search} onChange={e => setSearch(e.target.value)} /></div>
    {visible.map(c => <section className="draft-group" key={c.id}><div className="section-title"><div><h2>{c.product.name} <span className="muted">/ {c.goal}</span></h2><p>{c.channel} · {c.tone} · {c.targetAudience}</p></div><Badge color={c.isDemo ? "amber" : "purple"}>{c.isDemo ? "Demo template" : c.provider === "anthropic" ? "Claude" : "CoreWeave"}</Badge></div><div className="variants-grid">{c.drafts.map((d, i) => <DraftCard key={d.id} draft={d} index={i} campaign={c} action={action} />)}</div></section>)}
    {!visible.length && <Empty title="Nothing here yet" text="Try another filter or create a campaign in the studio." />}
  </>;
}
function DraftCard({ draft, campaign, index, action }: { draft: Draft; campaign: Campaign; index: number; action: Action }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ headline: draft.headline, body: draft.body, cta: draft.cta, hashtags: JSON.parse(draft.hashtags).join(" "), positioning: draft.positioning });
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  async function update(payload: object, message: string) { setBusy(true); const ok = await action(() => api(`/api/campaigns/${campaign.id}`, "PATCH", { draftId: draft.id, ...payload }), message); setBusy(false); if (ok) setEditing(false); }
  const variant: Variant = { ...draft, hashtags: JSON.parse(draft.hashtags) };
  return <article className={`panel draft-card ${draft.status === "approved" ? "approved-card" : ""}`}><div className="row between"><span className="eyebrow">ANGLE 0{index + 1}</span><Badge color={draft.status === "approved" ? "green" : draft.status === "rejected" ? "red" : "gray"}>{draft.status === "approved" && <Check size={12} />}{draft.status}</Badge></div>
    {editing ? <form onSubmit={e => { e.preventDefault(); void update({ ...form, hashtags: form.hashtags.split(/\s+/).filter(Boolean) }, "Edits saved. Draft requires approval."); }}>{(["headline", "body", "cta", "hashtags", "positioning"] as const).map(key => <label key={key}>{key === "cta" ? "CTA" : key[0].toUpperCase() + key.slice(1)}{["body", "positioning"].includes(key) ? <textarea aria-label={key === "cta" ? "CTA" : key[0].toUpperCase() + key.slice(1)} rows={key === "body" ? 5 : 2} value={form[key]} required onChange={e => setForm({ ...form, [key]: e.target.value })} /> : <input aria-label={key === "cta" ? "CTA" : key[0].toUpperCase() + key.slice(1)} value={form[key]} required={key !== "hashtags"} onChange={e => setForm({ ...form, [key]: e.target.value })} />}</label>)}<p className="hint">Saving edits returns the copy to draft status.</p><div className="row"><button className="button primary" disabled={busy}>Save edits</button><button type="button" className="button secondary" onClick={() => setEditing(false)}>Cancel</button></div></form> : <><h3>{draft.headline}</h3><p className="copy-body">{draft.body}</p><strong className="draft-cta">{draft.cta}</strong><p className="hashtags">{variant.hashtags.join(" ")}</p><div className="positioning"><span>THE ANGLE</span>{draft.positioning}</div><div className="character-count">{Array.from(copyText(variant)).length} characters{campaign.channel === "X" ? " / 280" : ""}</div><div className="draft-actions"><button className="button secondary" disabled={busy} onClick={() => { setForm({ headline: draft.headline, body: draft.body, cta: draft.cta, hashtags: variant.hashtags.join(" "), positioning: draft.positioning }); setEditing(true); }}><Pencil size={14} />Edit</button><button className="icon-button" aria-label={`Copy ${draft.headline}`} onClick={async () => { try { await navigator.clipboard.writeText(`${draft.status.toUpperCase()}${campaign.isDemo ? " · DEMO TEMPLATE" : ""}\n\n${copyText(variant)}`); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { await action(async () => { throw new Error("Clipboard is unavailable. Use CSV export instead."); }, ""); } }}>{copied ? <Check size={16} /> : <Clipboard size={16} />}</button><button className="icon-button" aria-label={`Export ${draft.headline}`} onClick={() => download([{ ...campaign, drafts: [draft] }])}><Download size={16} /></button></div><div className="approval-actions">{draft.status !== "approved" && <button className="button approve" disabled={busy} onClick={() => update({ status: "approved" }, "Draft approved")}><Check size={15} />Approve</button>}{draft.status !== "rejected" && <button className="text-button danger" disabled={busy} onClick={() => update({ status: "rejected" }, "Draft rejected")}>Reject</button>}{draft.status !== "draft" && <button className="text-button" disabled={busy} onClick={() => update({ status: "draft" }, "Returned to draft")}>Return to draft</button>}</div></>}
  </article>;
}
function Analytics({ campaigns, metrics, action, notify }: { campaigns: Campaign[]; metrics: Metric[]; action: Action; notify: (text: string) => void }) {
  const [includeSamples, setIncludeSamples] = useState(false);
  const [form, setForm] = useState({ campaignId: campaigns[0]?.id || "", impressions: 0, clicks: 0, leads: 0, conversions: 0, isSynthetic: false });
  const [busy, setBusy] = useState(false);
  const [utm, setUtm] = useState({ base: campaigns[0]?.product.landingUrl || "https://example.com", source: "linkedin", medium: "social", campaign: "product-launch" });
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const selected = metrics.filter(m => includeSamples || !m.isSynthetic);
  const totals = selected.reduce((v, m) => ({ impressions: v.impressions + m.impressions, clicks: v.clicks + m.clicks, conversions: v.conversions + m.conversions }), { impressions: 0, clicks: 0, conversions: 0 });
  const calculated = rates(totals);
  return <><PageHeading eyebrow="THE FEEDBACK LOOP" title="Give your next campaign an edge." text="Track results you enter. Learn what resonates." /><div className="analytics-caption"><Badge color="green">Manual tracking</Badge><span>No live platform connections</span><label className="checkbox"><input type="checkbox" checked={includeSamples} onChange={e => setIncludeSamples(e.target.checked)} />Include synthetic sample metrics</label></div>
    <div className="stats-grid"><Stat title="Impressions" value={totals.impressions.toLocaleString()} caption={includeSamples ? "Includes synthetic samples" : "Your manual entries"} icon={Megaphone} /><Stat title="Clicks" value={totals.clicks.toLocaleString()} caption="Sum of recorded entries" icon={ArrowUpRight} /><Stat title="Click-through rate" value={`${calculated.ctr.toFixed(2)}%`} caption="Clicks ÷ impressions" icon={BarChart3} /><Stat title="Conversion rate" value={`${calculated.conversionRate.toFixed(2)}%`} caption="Conversions ÷ clicks" icon={CheckCircle2} /></div>
    <div className="two-columns"><section className="panel form-panel"><div className="section-title"><div><h2>Log your results</h2><p>Each entry is an additional reporting period.</p></div></div><form onSubmit={async e => { e.preventDefault(); setBusy(true); const ok = await action(() => api("/api/analytics", "POST", form), "Results recorded"); setBusy(false); if (ok) setForm({ ...form, impressions: 0, clicks: 0, leads: 0, conversions: 0 }); }}><label>Campaign<select aria-label="Campaign" required value={form.campaignId} onChange={e => setForm({ ...form, campaignId: e.target.value })}><option value="" disabled>Select a campaign</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.product.name} · {c.channel} · {c.goal} · {c.id.slice(-6)}</option>)}</select></label><div className="form-grid">{(["impressions", "clicks", "leads", "conversions"] as const).map(key => <label key={key}>{key[0].toUpperCase() + key.slice(1)}<input type="number" min={0} max={1e9} step={1} required value={form[key]} onChange={e => setForm({ ...form, [key]: Number(e.target.value) })} /></label>)}</div><label className="checkbox"><input type="checkbox" checked={form.isSynthetic} onChange={e => setForm({ ...form, isSynthetic: e.target.checked })} />These are synthetic / demo metrics</label><button className="button primary" disabled={busy || !form.campaignId}>{busy ? <LoaderCircle className="spin" size={16} /> : <Plus size={16} />}Save results</button></form></section>
      <section className="panel form-panel"><div className="section-title"><div><h2>Build a trackable link</h2><p>A small link, a clearer picture.</p></div><span className="product-icon tint-1"><ArrowUpRight size={20} /></span></div><form onSubmit={e => { e.preventDefault(); try { setUrl(utmUrl(utm.base, utm.source, utm.medium, utm.campaign)); setUrlError(""); } catch (err) { setUrl(""); setUrlError((err as Error).message); } }}>{([["base", "Landing URL"], ["source", "UTM source"], ["medium", "UTM medium"], ["campaign", "UTM campaign"]] as const).map(([key, label]) => <label key={key}>{label}<input required type={key === "base" ? "url" : "text"} value={utm[key]} onChange={e => { setUtm({ ...utm, [key]: e.target.value }); setUrl(""); }} /></label>)}<button className="button secondary">Generate UTM link <ArrowRight size={15} /></button></form>{urlError && <p role="alert" className="danger">{urlError}</p>}{url && <div className="utm-result"><output>{url}</output><button className="icon-button" aria-label="Copy UTM link" onClick={async () => { try { await navigator.clipboard.writeText(url); notify("UTM link copied"); } catch { setUrlError("Clipboard unavailable. Select and copy the link above."); } }}><Clipboard size={16} /></button></div>}</section></div>
    <section className="panel"><div className="section-title"><div><h2>Results ledger</h2><p>{includeSamples ? "Synthetic samples are included and labeled." : "Synthetic samples are hidden."} Entries are additive; avoid overlapping periods.</p></div></div>{selected.length ? <div className="table-scroll"><table><thead><tr><th>Campaign</th><th>Source</th><th>Impressions</th><th>Clicks</th><th>Leads</th><th>Conversions</th><th>CTR</th></tr></thead><tbody>{selected.map(m => <tr key={m.id}><td><strong>{m.campaign.product.name}</strong><small>{m.campaign.channel} · {new Date(m.createdAt).toLocaleDateString("en-GB")}</small></td><td><Badge color={m.isSynthetic ? "amber" : "green"}>{m.isSynthetic ? "Synthetic sample" : "Manual entry"}</Badge></td><td>{m.impressions}</td><td>{m.clicks}</td><td>{m.leads}</td><td>{m.conversions}</td><td>{rates(m).ctr.toFixed(2)}%</td></tr>)}</tbody></table></div> : <Empty title="Your results will grow here" text="Record a reporting period or include synthetic samples to explore the ledger." />}</section>
    <p className="privacy-note"><ShieldCheck size={16} />Store aggregate metrics only. Keep personal data out of campaign briefs and UTM parameters.</p>
  </>;
}
function SettingsPage({ settings }: { settings: Settings }) {
  return <><PageHeading eyebrow="WORKSPACE SETTINGS" title="Set up your creative partner." text="A secure connection to Claude. A clear boundary around your data." /><section className="panel settings-panel"><div className="section-title"><div className="row"><span className="claude-symbol">✳</span><div><h2>Anthropic Claude</h2><p>Primary generation provider · Messages API</p></div></div><Badge color={settings.anthropic.configured ? "green" : "amber"}>{settings.anthropic.configured ? "Configured" : "Demo mode"}</Badge></div><p>Set your API key in the server’s environment, then restart the app. Keys are never sent to this screen or saved in your browser.</p><div className="config-list"><div><span>API key</span><code>ANTHROPIC_API_KEY</code><Badge>{settings.anthropic.configured ? "Present" : "Missing"}</Badge></div><div><span>Model</span><code>{settings.anthropic.model}</code><span>ANTHROPIC_MODEL</span></div><div><span>Limits</span><span>2,400 output tokens · 45 second timeout</span><span>No automatic retries</span></div></div><a className="button secondary" href="https://platform.claude.com/" target="_blank" rel="noreferrer">Open Claude Console <ArrowUpRight size={15} /></a></section>
    <section className="panel settings-panel"><div className="section-title"><div><h2>CoreWeave</h2><p>Optional Serverless Inference adapter</p></div><Badge color={settings.coreweave.configured ? "green" : "gray"}>{settings.coreweave.configured ? "Configured" : "Disabled"}</Badge></div><p>Configure <code>COREWEAVE_BASE_URL</code>, <code>COREWEAVE_API_KEY</code>, and <code>COREWEAVE_MODEL</code> on the server to enable this provider. The model is verified against your account catalog before generation. No provider is selected as a fallback.</p><div className="config-list"><div><span>Model</span><code>{settings.coreweave.model}</code></div></div></section>
    <div className="two-columns"><section className="panel settings-panel"><ShieldCheck className="purple-text" size={24} /><h2>Draft first. Human approved.</h2><p>All generated content starts as a draft. Editing approved copy clears its approval. Exporting a draft includes its review status. You are responsible for checking product claims before publishing.</p></section><section className="panel settings-panel"><h2>Privacy & responsible marketing</h2><p>Only product facts and the campaign brief go to your selected provider. Do not enter sensitive or personal data. Email campaigns require appropriate consent, sender identification, and unsubscribe handling. Follow applicable privacy rules for analytics.</p><p>This app creates copy and tracks manual counts. It does not send email, post content, scrape contacts, or collect visitor analytics.</p></section></div>
  </>;
}


