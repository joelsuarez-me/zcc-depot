import { useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { NAV, sectionHref, type NavItem, type SubNavItem } from "@/data/navigation";

function SubNavLink({ item, onNavigate }: { item: SubNavItem; onNavigate: () => void }) {
  return (
    <a href={sectionHref(item)} target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined} onClick={onNavigate} data-subnav-link
      className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 text-sm font-medium text-[#203524] transition-colors hover:bg-[#D1F470]/50 focus-visible:bg-[#D1F470]/50">
      {item.label}
      {item.external && <><ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden /><span className="sr-only">(opens in a new tab)</span></>}
    </a>
  );
}

function DesktopNavItem({ item, active }: { item: NavItem; active: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const id = `submenu-${item.label.toLowerCase()}`;
  const tone = active ? "bg-[#203524] text-[#D1F470]" : "text-[#11110D]/75 hover:bg-[#203524]/8 hover:text-[#11110D]";

  if (!item.children) {
    return <Link href={item.href} aria-current={active ? "page" : undefined} data-testid={`link-nav-${item.label.toLowerCase()}`}
      className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${tone}`}>{item.label}</Link>;
  }

  return (
    <div ref={root} className="relative" onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => { if (!root.current?.contains(document.activeElement)) setOpen(false); }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          toggle.current?.focus();
        } else if (event.key === "ArrowDown" && event.target !== root.current?.querySelector("[data-subnav-link]") && !(event.target as HTMLElement).closest("[data-subnav-link]")) {
          event.preventDefault();
          setOpen(true);
          requestAnimationFrame(() => root.current?.querySelector<HTMLAnchorElement>("[data-subnav-link]")?.focus());
        }
      }}>
      <div className={`flex items-center rounded-full transition-colors ${tone}`}>
        <Link href={item.href} onFocus={() => setOpen(true)} onClick={() => setOpen(false)}
          aria-current={active ? "page" : undefined} data-testid={`link-nav-${item.label.toLowerCase()}`}
          className="rounded-full py-2 pl-3 pr-1 text-sm font-medium">{item.label}</Link>
        <button ref={toggle} type="button" aria-label={`${item.label} sections`} aria-expanded={open} aria-controls={id}
          onClick={() => setOpen(value => !value)} data-testid={`button-submenu-${item.label.toLowerCase()}`}
          className="grid h-8 w-8 place-items-center rounded-full">
          <ChevronDown aria-hidden className={`h-3.5 w-3.5 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      <div id={id} hidden={!open} className="absolute left-0 top-full z-10 w-64 pt-2">
        <ul className="rounded-2xl border border-[#203524]/15 bg-[#F5F5F2] p-2 shadow-[0_16px_40px_-12px_rgba(32,53,36,.3)]" aria-label={`${item.label} sections`}>
          {item.children.map(child => <li key={child.href}><SubNavLink item={child} onNavigate={() => setOpen(false)} /></li>)}
        </ul>
      </div>
    </div>
  );
}

export function PrimaryNavigation() {
  const [loc] = useLocation();
  return (
    <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
      {NAV.map(item => <DesktopNavItem key={`${loc}:${item.href}`} item={item} active={item.href === "/" ? loc === "/" : loc.startsWith(item.href)} />)}
    </nav>
  );
}

export function MobileNavigationLinks({ onNavigate }: { onNavigate: () => void }) {
  return (
    <ul>
      {NAV.map((item, index) => (
        <li key={item.href}>
          <Link href={item.href} onClick={onNavigate} data-testid={`link-mobile-${item.label.toLowerCase()}`}
            className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-lg font-medium hover:bg-[#203524]/8">
            {item.label}<span className="mono text-xs text-[#11110D]/40">0{index + 1}</span>
          </Link>
          {item.children && (
            <ul className="mb-2 ml-5 border-l border-[#203524]/15 pl-2" aria-label={`${item.label} sections`}>
              {item.children.map(child => <li key={child.href}><SubNavLink item={child} onNavigate={onNavigate} /></li>)}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
