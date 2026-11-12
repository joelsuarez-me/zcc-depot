import { useEffect, useMemo, useState } from "react";
import { Search, Bookmark, BookmarkCheck, ArrowUpRight, X } from "lucide-react";
import { Ext, Note, PageHero, Section, SectionHead } from "@/components/kit";
import { LINKS, RESOURCES, RESOURCE_CATEGORIES } from "@/data/content";

const KEY = "zcc-depot:bookmarks";
function useBookmarks() {
  const [ids, setIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* storage unavailable */ } }, [ids]);
  const toggle = (id: string) => setIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return { ids, toggle };
}

export default function Resources() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const { ids, toggle } = useBookmarks();
  const cats = ["All", "Saved", ...RESOURCE_CATEGORIES];
  const list = useMemo(() => RESOURCES.filter((r) => {
    if (cat === "Saved" && !ids.includes(r.id)) return false;
    if (cat !== "All" && cat !== "Saved" && r.category !== cat) return false;
    return (r.title + " " + r.category).toLowerCase().includes(q.trim().toLowerCase());
  }), [q, cat, ids]);
  const count = (c: string) => c === "All" ? RESOURCES.length : c === "Saved" ? ids.length : RESOURCES.filter((r) => r.category === c).length;

  return (
    <>
      <PageHero eyebrow="Resources · Official documentation" title={<>The source, <span className="serif italic text-[#D1F470]">one search away.</span></>}
        lede="Every link here points to official Zendesk documentation or product pages. Bookmark the ones you use most; they are saved in this browser only.">
        <a href={LINKS.gettingStarted} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#D1F470] px-5 py-3 text-sm font-semibold text-[#11110D]" data-testid="link-getting-started">Open setup guide<span className="sr-only"> (opens in a new tab)</span></a>
        <a href={LINKS.usingSection} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#F5F5F2]/25 px-5 py-3 text-sm font-semibold hover:border-[#D1F470] hover:text-[#D1F470]" data-testid="link-using-guides">Browse Contact Center guides<span className="sr-only"> (opens in a new tab)</span></a>
      </PageHero>

      <Section>
        <SectionHead id="library" num="01" eyebrow="Resource library" title="Find the guidance you need" />
        <div className="grid gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-28">
              <label className="relative block">
                <span className="sr-only">Search documentation</span>
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#11110D]/40" aria-hidden />
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search docs" data-testid="input-search-resources"
                  className="w-full rounded-full border border-[#11110D]/15 bg-[#FBFBF8] py-3 pl-11 pr-10 text-sm focus:border-[#203524]" />
                {q && <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-[#11110D]/8" data-testid="button-clear-search"><X className="h-4 w-4" /></button>}
              </label>
              <div role="group" aria-label="Categories" className="mt-5 flex gap-1 overflow-x-auto lg:flex-col">
                {cats.map((c) => (
                  <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c} data-testid={`filter-${c.toLowerCase().replace(/\W+/g, "-")}`}
                    className={`flex shrink-0 items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left text-sm transition ${cat === c ? "bg-[#203524] text-[#D1F470]" : "hover:bg-[#203524]/6"}`}>
                    {c}<span className="mono text-xs opacity-60">{count(c)}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
          <div className="lg:col-span-9">
            <p className="mono mb-4 text-xs text-[#11110D]/50" aria-live="polite" data-testid="text-result-count">{list.length} of {RESOURCES.length} resources</p>
            {list.length === 0 ? (
              <div className="rounded-[2rem] border-2 border-dashed border-[#11110D]/15 p-12 text-center">
                <Bookmark className="mx-auto h-8 w-8 text-[#203524]/40" aria-hidden />
                <h3 className="mt-4 text-xl font-semibold">{cat === "Saved" && !q ? "Nothing saved yet" : "No matching resources"}</h3>
                <p className="mt-2 text-[#11110D]/60">{cat === "Saved" && !q ? "Use the bookmark icon on any resource to keep it close at hand." : "Try a broader term or a different category."}</p>
                <button onClick={() => { setQ(""); setCat("All"); }} className="mt-6 rounded-full bg-[#203524] px-5 py-2.5 text-sm font-semibold text-[#D1F470]" data-testid="button-reset-filters">Show all resources</button>
              </div>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2">
                {list.map((r) => {
                  const saved = ids.includes(r.id);
                  return (
                    <li key={r.id} className="group relative flex rounded-2xl border border-[#11110D]/10 bg-[#FBFBF8] transition hover:-translate-y-0.5 hover:border-[#203524]/40 hover:shadow-[0_14px_30px_-18px_rgba(32,53,36,.5)]">
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex-1 p-5 pr-2" data-testid={`link-resource-${r.id}`}>
                        <div className="flex items-center gap-2"><span className="eyebrow text-[#203524]/60">{r.category}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.kind === "Internal" ? "bg-[#11110D] text-[#D1F470]" : "bg-[#D1F470]/60"}`}>{r.kind}</span></div>
                        <div className="mt-2 font-medium leading-snug">{r.title}<ArrowUpRight className="ml-1 inline h-3.5 w-3.5 opacity-40 transition group-hover:opacity-100" aria-hidden /></div>
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                      <button onClick={() => toggle(r.id)} aria-pressed={saved} aria-label={saved ? `Remove bookmark: ${r.title}` : `Bookmark: ${r.title}`} data-testid={`button-bookmark-${r.id}`}
                        className={`m-3 grid h-9 w-9 shrink-0 place-items-center self-start rounded-full transition ${saved ? "bg-[#D1F470] text-[#203524]" : "text-[#11110D]/40 hover:bg-[#11110D]/6 hover:text-[#203524]"}`}>
                        {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </Section>

      <Section tone="forest">
        <SectionHead id="dashboards" num="02" eyebrow="Dashboards" dark title="Metrics for agents, teams, queues, and contacts" lede="The dashboards app provides real-time and historical Contact Center metrics from within Zendesk. The guide says the app is included with Contact Center and installed from the Zendesk Marketplace." />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-[#D1F470] p-7 text-[#11110D]"><div className="eyebrow">Realtime snapshot</div><h3 className="mt-3 text-2xl font-semibold">See current queue and agent activity</h3><p className="mt-2 text-[#11110D]/75">Near-real-time queue metrics, agent capacity, and agent status. Filter by channel and queue, and customize the queue summary table by adding or removing metrics.</p></div>
          <div className="rounded-3xl border border-[#F5F5F2]/15 p-7"><div className="eyebrow text-[#D1F470]">Recent performance</div><h3 className="mt-3 text-2xl font-semibold">Review the previous 24 hours</h3><p className="mt-2 text-[#F5F5F2]/70">Filter by time range, channel, or queue. Metrics include queued and handled contacts, average handle time, occupancy, abandonment, transfers, callbacks, and service level.</p></div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="eyebrow mr-2 self-center text-[#F5F5F2]/50">Four dashboard tabs</span>
          {["Realtime snapshot", "Recent performance", "Resolution codes", "Contact performance"].map((t) => <span key={t} className="rounded-full border border-[#F5F5F2]/20 px-4 py-1.5 text-sm">{t}</span>)}
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {[["Install", "Install from the Marketplace", "Select your Zendesk subdomain and install the app."], ["Configure", "Set workspace and region", "Use the same Contact Center workspace name and region. Optionally restrict access by role or group."], ["Access", "Open a dashboard", "In Contact Center, select the dashboards icon, sign in if prompted, and choose a dashboard tab."]].map(([e, t, d], k) => (
            <li key={e} className="rounded-3xl border border-[#F5F5F2]/12 p-6"><div className="mono text-xs text-[#D1F470]">0{k + 1} · {e}</div><div className="mt-3 font-semibold">{t}</div><p className="mt-1 text-sm text-[#F5F5F2]/65">{d}</p></li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
          <Ext href={LINKS.marketplace} className="rounded-full bg-[#D1F470] px-5 py-3 text-[#11110D]" testId="link-marketplace">View the Marketplace app</Ext>
          <Ext href={LINKS.install} className="rounded-full border border-[#F5F5F2]/25 px-5 py-3 hover:border-[#D1F470]" testId="link-install-guide">Open installation guide</Ext>
          <Ext href={LINKS.dashboardsGuide} className="rounded-full border border-[#F5F5F2]/25 px-5 py-3 hover:border-[#D1F470]" testId="link-dashboard-guide">Open dashboard guide</Ext>
        </div>
      </Section>

      <Section tone="white">
        <div className="grid gap-4 md:grid-cols-2">
          <a href={LINKS.gettingStarted} target="_blank" rel="noopener noreferrer" className="group rounded-[2rem] bg-[#203524] p-8 text-[#F5F5F2] transition hover:-translate-y-1" data-testid="card-getting-started">
            <div className="eyebrow text-[#D1F470]">03 · Getting started</div><h3 className="mt-6 text-3xl font-semibold">Zendesk Contact Center setup guide</h3><p className="mt-2 text-[#F5F5F2]/65">Prerequisites, configuration, and first steps.</p>
            <ArrowUpRight className="mt-8 h-6 w-6 text-[#D1F470] transition group-hover:rotate-45" aria-hidden /><span className="sr-only">(opens in a new tab)</span>
          </a>
          <a href={LINKS.usingSection} target="_blank" rel="noopener noreferrer" className="group rounded-[2rem] bg-[#D1F470] p-8 transition hover:-translate-y-1" data-testid="card-using-zcc">
            <div className="eyebrow text-[#203524]">04 · Product guides</div><h3 className="mt-6 text-3xl font-semibold">Using Zendesk Contact Center</h3><p className="mt-2 text-[#11110D]/65">Product guides and how-to articles.</p>
            <ArrowUpRight className="mt-8 h-6 w-6 transition group-hover:rotate-45" aria-hidden /><span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
        <Note>Bookmarks are stored in this browser's localStorage only and are not synced.</Note>
      </Section>
    </>
  );
}
