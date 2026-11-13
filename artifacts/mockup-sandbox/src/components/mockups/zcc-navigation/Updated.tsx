import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { PrimaryNavigation, MobileNavigationLinks } from "./_updated-navigation";
import "./_group.css";

/** Exact extracted header; navigation is stubbed only inside this isolated baseline. */
export function Updated() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#FDFDFB]" onClickCapture={event => {
      if ((event.target as HTMLElement).closest("a")) event.preventDefault();
    }}>
      <header className="px-3 pt-3 md:px-6">
        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between rounded-full border border-transparent bg-[#FDFDFB] px-3 py-2 md:px-4">
          <a href="/" className="flex shrink-0 items-center rounded-xl pl-1 pr-2">
            <img src="/__mockup/images/zcc-navigation-logo.png" alt="Zendesk" className="h-11 w-14 rounded-lg bg-[#11110D] object-contain" />
          </a>
          <PrimaryNavigation />
          <div className="flex items-center gap-2">
            <button aria-label="Search" className="flex h-10 items-center gap-2 rounded-full border border-[#11110D]/10 px-3 text-xs"><Search className="h-4 w-4" />Ctrl K</button>
            <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-11 w-11 place-items-center rounded-full bg-[#203524] text-[#D1F470] xl:hidden">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open && <nav aria-label="Mobile" className="mt-2 rounded-3xl border border-[#11110D]/10 bg-[#F5F5F2] p-3 shadow-xl"><MobileNavigationLinks onNavigate={() => setOpen(false)} /></nav>}
      </header>
    </div>
  );
}
