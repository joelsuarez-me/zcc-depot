import { useEffect, useMemo, useRef, useState } from "react";
import { Network, Search, X } from "lucide-react";
import { PageHero } from "@/components/kit";
import { PageCard } from "@/components/site-map/page-card";
import { SITE_MAP, filterSiteMap, normalizeSiteQuery, siteMapCounts } from "@/data/site-map";
import "@/components/site-map/site-map.css";

const title = "Site map | ZCC Depot";
const description = "A searchable visual map of every ZCC Depot room, simulation, guide and sales resource, with direct links to page sections.";

function useMeta() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const meta = [
      ['meta[name="description"]', description], ['meta[property="og:title"]', title], ['meta[property="og:description"]', description],
      ['meta[name="twitter:title"]', title], ['meta[name="twitter:description"]', description],
    ].map(([sel, content]) => {
      const el = document.querySelector<HTMLMetaElement>(sel);
      const previous = el?.getAttribute("content") ?? "";
      el?.setAttribute("content", content);
      return { el, previous };
    });
    return () => { document.title = previousTitle; meta.forEach(({ el, previous }) => el?.setAttribute("content", previous)); };
  }, []);
}

const PALETTE: [string, string][] = [
  ["#D1F470", "#11110D"], ["#203524", "#D1F470"], ["#C9DCEB", "#11110D"], ["#EFD9B4", "#11110D"],
  ["#11110D", "#F5F5F2"], ["#D9CFEA", "#11110D"], ["#BFE3D0", "#11110D"], ["#F0C8B8", "#11110D"],
];
const SUGGESTIONS = ["routing", "callback", "architecture", "pricing", "voice copilot"];
const TOTAL = siteMapCounts(SITE_MAP);

export default function SiteMap() {
  useMeta();
  const [query, setQuery] = useState("");
  const [openSet, setOpenSet] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const searching = normalizeSiteQuery(query).length > 0;
  const groups = useMemo(() => filterSiteMap(query, SITE_MAP), [query]);
  const counts = useMemo(() => siteMapCounts(groups), [groups]);
  const key = (gid: string, href: string) => `${gid}|${href}`;
  const allKeys = useMemo(() => SITE_MAP.flatMap(g => g.pages.filter(p => p.sections.length).map(p => key(g.id, p.href))), []);
  const isOpen = (k: string) => searching ? !openSet.has(`x:${k}`) : openSet.has(k);
  const toggle = (k: string) => setOpenSet(prev => {
    const next = new Set(prev); const id = searching ? `x:${k}` : k;
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const clear = () => { setQuery(""); setOpenSet(new Set()); inputRef.current?.focus(); };
  const allOpen = !searching && allKeys.every(k => openSet.has(k));

  return (
    <div className="sm">
      <PageHero motif="map" eyebrow="Wayfinding" title="Site map"
        lede={`Every room, simulation, guide and sales resource in one view: ${TOTAL.pages} pages and ${TOTAL.sections} sections across ${TOTAL.groups} areas.`} />
      <div className="sm-inner">
        <div className="sm-bar mt-4" role="search">
          <div className="sm-field">
            <Search className="h-4 w-4 shrink-0 text-[#D1F470]" aria-hidden />
            <label htmlFor="sm-q" className="sr-only">Filter the site map</label>
            <input id="sm-q" ref={inputRef} type="search" value={query} autoComplete="off" placeholder="Filter pages and sections, e.g. callback"
              onChange={e => { setQuery(e.target.value); setOpenSet(new Set()); }}
              onKeyDown={e => { if (e.key === "Escape" && query) { e.preventDefault(); clear(); } }}
              aria-describedby="sm-count" data-testid="input-site-map-search" />
            {query && <button type="button" className="sm-clear" onClick={clear} data-testid="button-clear-search"><X className="h-3.5 w-3.5" aria-hidden />Clear</button>}
          </div>
          <div className="sm-tools">
            <p id="sm-count" className="sm-count" aria-live="polite" aria-atomic="true" data-testid="text-match-count">
              {searching
                ? <><b>{counts.pages}</b> page{counts.pages === 1 ? "" : "s"}, <b>{counts.sections}</b> section{counts.sections === 1 ? "" : "s"} match</>
                : <><b>{TOTAL.pages}</b> pages, <b>{TOTAL.sections}</b> sections</>}
            </p>
            {!searching && (
              <button type="button" className="sm-tbtn" onClick={() => setOpenSet(allOpen ? new Set() : new Set(allKeys))} data-testid="button-expand-all">
                {allOpen ? "Collapse all" : "Expand all"}
              </button>
            )}
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="sm-empty" data-testid="status-no-results">
            <h2 className="text-lg font-semibold">Nothing matches "{query.trim()}"</h2>
            <p className="mt-1 text-sm text-[#11110D]/65">Try a shorter or different word. Search covers titles, descriptions, keywords and URLs, and every word must match.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => <button key={s} type="button" className="sm-sugg" onClick={() => setQuery(s)} data-testid={`button-suggest-${s.replace(/\s/g, "-")}`}>{s}</button>)}
              <button type="button" className="sm-sugg" onClick={clear} data-testid="button-reset-map">Show full map</button>
            </div>
          </div>
        ) : (
          <>
            <div className="sm-root" aria-hidden>
              <span className="sm-root-node"><Network className="h-5 w-5" /></span>
              <span className="eyebrow text-[#203524]">ZCC Depot</span>
            </div>
            <div className="sm-tree">
              {groups.map((g, gi) => {
                const [c, fg] = PALETTE[SITE_MAP.findIndex(x => x.id === g.id) % PALETTE.length] ?? PALETTE[gi % PALETTE.length];
                return (
                  <section key={g.id} className="sm-group" aria-labelledby={`sm-g-${g.id}`} style={{ "--sm-c": c, "--sm-fg": fg, animationDelay: `${Math.min(gi, 8) * 40}ms` } as React.CSSProperties} data-testid={`group-${g.id}`}>
                    <div className="sm-ghead">
                      <h2 id={`sm-g-${g.id}`} className="sm-gtag"><i aria-hidden />{g.title}</h2>
                      {g.description && <span className="sm-gdesc">{g.description}</span>}
                      <span className="sm-gmeta">{g.pages.length} {g.pages.length === 1 ? "page" : "pages"}</span>
                    </div>
                    <ul className="sm-pages">
                      {g.pages.map(p => {
                        const k = key(g.id, p.href);
                        return <PageCard key={k} page={p} searching={searching} open={isOpen(k)} onToggle={() => toggle(k)} />;
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
