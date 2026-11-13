import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ExternalLink, Search, Star, X } from "lucide-react";
import { RoomFrame, RoomSection, SourceNote } from "@/components/room-kit";
import { COMPONENT_DOCUMENTATION, DEMO_URL, FAQ, RESOURCES, RESOURCE_CATEGORIES } from "@/data/content";
import { useDepot } from "@/lib/depot-mode";
import { PresenterOnly } from "@/components/presenter";
import { usePresenterContent } from "@/hooks/use-presenter-content";

const KINDS = ["All", "Article", "Section", "Product page"] as const;

function Positioning() {
  const { data, isLoading } = usePresenterContent();
  if (isLoading) return <div className="h-24 animate-pulse rounded-2xl bg-[#11110D]/6" />;
  const g = data?.legacy.gtm.find((x) => /competitive|positioning/i.test(x.t));
  if (!g) return <p className="text-sm text-[#11110D]/60">Positioning guidance is not available.</p>;
  return <div className="depot-card"><h3 className="font-semibold">{g.t}</h3><p className="mt-2 text-sm text-[#11110D]/72">{g.body}</p><ul className="mt-3 space-y-1.5 text-sm">{g.list.map((x) => <li key={x}>{x}</li>)}</ul></div>;
}

export default function TechnicalResources() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("All");
  const [onlyFav, setOnlyFav] = useState(false);
  const { isFavorite, toggleFavorite } = useDepot();
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return RESOURCES.filter((r) => (cat === "All" || r.category === cat) && (kind === "All" || r.kind === kind) && (!onlyFav || isFavorite(r.url)) && (!t || `${r.title} ${r.category}`.toLowerCase().includes(t)));
  }, [q, cat, kind, onlyFav, isFavorite]);

  return (
    <RoomFrame id="technical-resources" lede="Every documentation link in the Depot, searchable and filterable, plus references, demo assets, and FAQs.">
      <RoomSection id="resource-search" eyebrow="Resource search" title="Find the right document fast">
        <div className="tr-bar">
          <label className="tr-search"><Search className="h-4 w-4 text-[#11110D]/45" aria-hidden /><span className="sr-only">Search resources</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles and categories" data-testid="input-resource-search" />
            {q && <button type="button" onClick={() => setQ("")} aria-label="Clear search"><X className="h-4 w-4" /></button>}
          </label>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="tr-select" aria-label="Category" data-testid="select-resource-category">
            <option>All</option>{RESOURCE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={kind} onChange={(e) => setKind(e.target.value as (typeof KINDS)[number])} className="tr-select" aria-label="Type" data-testid="select-resource-kind">
            {KINDS.map((k) => <option key={k}>{k}</option>)}
          </select>
          <button type="button" aria-pressed={onlyFav} onClick={() => setOnlyFav((v) => !v)} className={`room-pill ${onlyFav ? "is-on" : ""}`} data-testid="button-resource-favorites"><Star className="h-3.5 w-3.5" aria-hidden />Favorites</button>
        </div>
        <p className="mt-3 text-xs text-[#11110D]/55" aria-live="polite" data-testid="text-resource-count">{list.length} of {RESOURCES.length} resources</p>
        {list.length === 0 ? (
          <div className="mt-4 rounded-2xl border-2 border-dashed border-[#11110D]/15 p-8 text-center"><p className="font-semibold">Nothing matches those filters.</p><button type="button" className="depot-btn depot-btn-ghost mx-auto mt-3" onClick={() => { setQ(""); setCat("All"); setKind("All"); setOnlyFav(false); }} data-testid="button-resource-reset">Reset filters</button></div>
        ) : (
          <ul className="tr-list mt-3">
            {list.map((r) => (
              <li key={r.id} className="tr-row">
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1" data-testid={`link-resource-${r.id}`}>
                  <span className="block truncate font-medium">{r.title}</span>
                  <span className="mono block text-[10px] uppercase tracking-[0.12em] text-[#11110D]/45">{r.category} · {r.kind}</span>
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
                <button type="button" onClick={() => toggleFavorite(r.url)} aria-pressed={isFavorite(r.url)} aria-label={`Favorite ${r.title}`} className="depot-icon-btn is-light" data-testid={`button-fav-resource-${r.id}`}><Star className={`h-4 w-4 ${isFavorite(r.url) ? "fill-[#11110D]" : ""}`} /></button>
                <ExternalLink className="h-4 w-4 shrink-0 text-[#11110D]/35" aria-hidden />
              </li>
            ))}
          </ul>
        )}
        <SourceNote>Favorites are stored only in this browser.</SourceNote>
      </RoomSection>

      <RoomSection id="architecture-references" eyebrow="Architecture references" title="Component documentation" tone="panel">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(COMPONENT_DOCUMENTATION).map(([k, v]) => <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="room-tag is-link" data-testid={`link-compdoc-${k.replace(/\W+/g, "-").toLowerCase()}`}>{k}<ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only">(opens in a new tab)</span></a>)}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {[["/architecture", "System and data flow", "Animated flows and Lambda inventory."], ["/architecture/components", "Component map", "Data boundary and SAML sign-in sequence."], ["/rooms/architecture-integrations", "Architecture room", "Explorer with layers and guided tour."]].map(([h, t, d]) => (
            <Link key={h} href={h} className="room-next" data-testid={`link-ref-${h.replace(/\W+/g, "-")}`}><span className="flex-1"><span className="block font-semibold">{t}</span><span className="block text-sm text-[#11110D]/60">{d}</span></span><ArrowRight className="h-4 w-4" aria-hidden /></Link>
          ))}
        </div>
      </RoomSection>

      <RoomSection id="demo-assets-library" eyebrow="Demo assets" title="Everything you need to show it">
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          {[["/demos", "Demo Blueprint", "Storyline stages for 30 to 60 minute demos."], ["/demos/nuggets", "Demo Nuggets", "Narrated feature simulations."], ["/demos/brief", "Demo Researcher", "Cited company research, signed in."], ["/agenda", "Demo Agenda", "Prepare and present agendas, signed in."]].map(([h, t, d]) => (
            <Link key={h} href={h} className="room-next" data-testid={`link-asset-${h.replace(/\W+/g, "-")}`}><span className="flex-1"><span className="block font-semibold">{t}</span><span className="block text-sm text-[#11110D]/60">{d}</span></span><ArrowRight className="h-4 w-4" aria-hidden /></Link>
          ))}
        </div>
        <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="room-tag is-link mt-3" data-testid="link-storylane">Guided click-through (Storylane)<ExternalLink className="h-3 w-3" aria-hidden /><span className="sr-only">(opens in a new tab)</span></a>
      </RoomSection>

      <RoomSection id="technical-faq" eyebrow="Technical FAQ" title="Questions customers ask" tone="panel">
        <div className="divide-y divide-[#11110D]/10 rounded-2xl border border-[#11110D]/10 bg-[#FBFBF8]">
          {FAQ.map(([qq, a], i) => (
            <details key={qq} className="group px-5 py-4" data-testid={`faq-${i}`}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">{qq}<span className="text-xl leading-none transition-transform group-open:rotate-45" aria-hidden>+</span></summary>
              <p className="mt-2 text-sm leading-relaxed text-[#11110D]/70">{a}</p>
            </details>
          ))}
        </div>
      </RoomSection>

      <RoomSection id="enablement" eyebrow="Enablement" title="Seller and partner enablement">
        <div className="grid gap-2 md:grid-cols-3">
          {[["/sales", "Sales", "Use cases and customer outcomes."], ["/sell-sheet", "Sell Sheet", "Presenter Mode and sign-in required."], ["/pricing", "Pricing", "Presenter Mode and sign-in required."]].map(([h, t, d]) => (
            <Link key={h} href={h} className="room-next" data-testid={`link-enable-${h.replace(/\W+/g, "-")}`}><span className="flex-1"><span className="block font-semibold">{t}</span><span className="block text-sm text-[#11110D]/60">{d}</span></span><ArrowRight className="h-4 w-4" aria-hidden /></Link>
          ))}
        </div>
        <div className="mt-4"><PresenterOnly title="Competitive positioning"><Positioning /></PresenterOnly></div>
      </RoomSection>
    </RoomFrame>
  );
}
