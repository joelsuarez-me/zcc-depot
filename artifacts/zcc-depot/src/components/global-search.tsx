import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Command as CommandPrimitive } from "cmdk";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ArrowUpRight, CornerDownLeft, FileText, Hash, Search, SearchX, X } from "lucide-react";
import { SEARCH_GROUPS, SEARCH_INDEX, type SearchEntry } from "@/data/search";

function go(entry: SearchEntry, navigate: (to: string) => void) {
  if (entry.external) { window.open(entry.href, "_blank", "noopener,noreferrer"); return; }
  const [path, hash] = entry.href.split("#");
  if (hash) {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    if (window.location.pathname.replace(base, "") === path || (path === "/" && window.location.pathname === `${base}/`)) {
      history.replaceState(null, "", `${base}${path}#${hash}`);
      setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
      return;
    }
    window.location.assign(`${base}${path}#${hash}`);
    return;
  }
  navigate(path);
}

export function SearchTrigger() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const [, navigate] = useLocation();
  const isMac = useMemo(() => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform), []);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const onOpenChange = (o: boolean) => { setOpen(o); if (!o) setQuery(""); };
  useEffect(() => { if (!open) setQuery(""); }, [open]);
  const pick = (e: SearchEntry) => { onOpenChange(false); setTimeout(() => go(e, navigate), 0); };

  return (
    <>
      <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-label="Search ZCC Depot" aria-keyshortcuts="Meta+K Control+K" data-testid="button-open-search"
        className="group inline-flex h-10 items-center gap-2 rounded-full border border-[#11110D]/15 bg-[#FBFBF8] px-3 text-sm text-[#11110D]/70 transition-colors hover:border-[#203524]/40 hover:text-[#11110D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#203524]">
        <Search className="h-4 w-4" aria-hidden />
        <kbd className="mono hidden rounded border border-[#11110D]/15 px-1.5 py-0.5 text-[10px] tracking-wider xl:inline" aria-hidden>{isMac ? "⌘K" : "Ctrl K"}</kbd>
      </button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent onCloseAutoFocus={(event) => { event.preventDefault(); trigger.current?.focus(); }} className="top-[12vh] max-w-[calc(100vw-1.5rem)] translate-y-0 gap-0 overflow-hidden rounded-3xl border border-[#11110D]/10 bg-[#F5F5F2] p-0 shadow-[0_30px_80px_-20px_rgba(32,53,36,.55)] sm:max-w-2xl [&>button]:hidden">
          <DialogTitle className="sr-only">Search ZCC Depot</DialogTitle>
          <DialogDescription className="sr-only">Search pages, sections, features, FAQs, video highlights, and resources. Use arrow keys to move and Enter to open.</DialogDescription>
          <CommandPrimitive label="Search ZCC Depot" loop className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-[#11110D]/10 px-5">
              <Search className="h-5 w-5 shrink-0 text-[#203524]" aria-hidden />
              <CommandPrimitive.Input value={query} onValueChange={setQuery} placeholder="Search pages, features, resources..." data-testid="input-global-search"
                className="h-14 w-full bg-transparent text-base text-[#11110D] outline-none placeholder:text-[#11110D]/40" />
              <kbd className="mono hidden rounded border border-[#11110D]/15 px-1.5 py-0.5 text-[10px] text-[#11110D]/50 sm:inline">ESC</kbd>
              <button type="button" onClick={() => onOpenChange(false)} aria-label="Close search" className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-[#203524]/10"><X className="h-4 w-4" aria-hidden /></button>
            </div>
            <CommandPrimitive.List className="max-h-[min(60vh,460px)] overflow-y-auto overscroll-contain p-2">
              <CommandPrimitive.Empty className="flex flex-col items-center gap-3 px-6 py-12 text-center" data-testid="status-search-empty">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#203524] text-[#D1F470]"><SearchX className="h-5 w-5" aria-hidden /></span>
                <p className="text-sm font-semibold text-[#11110D]">Nothing matches “{query}”</p>
                <p className="max-w-xs text-xs text-[#11110D]/55">Try a product term like “routing”, “Lambda”, “translation”, or “dashboards”.</p>
              </CommandPrimitive.Empty>
              {SEARCH_GROUPS.map((g) => {
                const items = SEARCH_INDEX.filter((e) => e.group === g);
                const shown = query ? items : items.slice(0, g === "Pages" ? 7 : g === "Sections" ? 6 : 0);
                if (!shown.length) return null;
                return (
                  <CommandPrimitive.Group key={g} heading={query ? g : g === "Pages" ? "Jump to" : "Popular sections"}
                    className="[&_[cmdk-group-heading]]:eyebrow mb-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:text-[#203524]/70">
                    {shown.map((e) => (
                      <CommandPrimitive.Item key={e.id} value={`${e.id} ${e.title}`} keywords={[e.description, e.keywords ?? "", e.group]} onSelect={() => pick(e)} data-testid={`result-search-${e.id}`}
                        className="group flex cursor-pointer items-start gap-3 rounded-2xl px-3 py-2.5 text-[#11110D] outline-none data-[selected=true]:bg-[#203524] data-[selected=true]:text-[#F5F5F2]">
                        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#11110D]/[.06] text-[#203524] group-data-[selected=true]:bg-[#D1F470] group-data-[selected=true]:text-[#11110D]">
                          {e.external ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /> : e.href.includes("#") ? <Hash className="h-3.5 w-3.5" aria-hidden /> : <FileText className="h-3.5 w-3.5" aria-hidden />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{e.title}</span>
                          <span className="line-clamp-1 text-xs opacity-60">{e.description}</span>
                        </span>
                        {e.external ? <span className="sr-only">(opens in a new tab)</span> : null}
                        <CornerDownLeft className="mt-1.5 h-3.5 w-3.5 shrink-0 opacity-0 group-data-[selected=true]:opacity-70" aria-hidden />
                      </CommandPrimitive.Item>
                    ))}
                  </CommandPrimitive.Group>
                );
              })}
            </CommandPrimitive.List>
            <div className="mono flex items-center justify-between border-t border-[#11110D]/10 px-5 py-2.5 text-[10px] tracking-wider text-[#11110D]/45">
              <span>↑↓ NAVIGATE · ENTER OPEN · ESC CLOSE</span>
              <span className="hidden sm:inline">{SEARCH_INDEX.length} ENTRIES</span>
            </div>
          </CommandPrimitive>
        </DialogContent>
      </Dialog>
    </>
  );
}
