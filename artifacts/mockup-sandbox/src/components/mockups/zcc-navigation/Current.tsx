import { useState } from "react";
import { ArrowUpRight, Menu, Search, X } from "lucide-react";
import { PrimaryNavigation, MobileNavigationLinks } from "./_header-navigation";
import "./_group.css";

/** Exact extracted header; navigation is stubbed only inside this isolated baseline. */
export function Current() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#FDFDFB]" onClickCapture={event => {
      if ((event.target as HTMLElement).closest("a")) event.preventDefault();
    }}>
      <header className="px-3 pt-3 md:px-6">
        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between rounded-full border border-transparent bg-[#FDFDFB] px-3 py-2 md:px-4">
          <a href="/" className="flex items-center gap-3 rounded-full pl-2 pr-3">
            <img src="/__mockup/images/zcc-navigation-logo.png" alt="Zendesk" className="h-10 w-14 rounded-lg bg-[#11110D] object-contain" />
          </a>
          <PrimaryNavigation />
          <div className="flex items-center gap-2">
            <button aria-label="Search" className="flex h-10 items-center gap-2 rounded-full border border-[#11110D]/10 px-3 text-xs"><Search className="h-4 w-4" />Ctrl K</button>
            <a href="#" className="hidden items-center gap-1.5 rounded-full bg-[#D1F470] px-4 py-2 text-sm font-semibold text-[#11110D] sm:inline-flex">Guided demo <ArrowUpRight className="h-3.5 w-3.5" /></a>
            <button type="button" aria-label="Open menu" onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-full bg-[#203524] text-[#D1F470] xl:hidden">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open && <nav aria-label="Mobile" className="mt-2 rounded-3xl border border-[#11110D]/10 bg-[#F5F5F2] p-3 shadow-xl"><MobileNavigationLinks onNavigate={() => setOpen(false)} /></nav>}
      </header>
    </div>
  );
}
