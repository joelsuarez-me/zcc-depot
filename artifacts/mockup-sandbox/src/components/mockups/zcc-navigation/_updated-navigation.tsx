import { useRef, useState, type AnchorHTMLAttributes } from "react";
import { Link, useLocation } from "./_router";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { NAV, isNavItemActive, sectionHref, type NavItem, type SubNavItem } from "./_navigation";
import "./_updated-navigation.css";

function MainNavLink({ item, ...props }: { item: NavItem } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  // Native anchors also scroll correctly when the pathname has not changed.
  return item.href.includes("#")
    ? <a {...props} href={sectionHref(item)} />
    : <Link {...props} href={item.href} />;
}

function SubNavLink({ item, onNavigate }: { item: SubNavItem; index: number; onNavigate: () => void }) {
  return (
    <a href={sectionHref(item)} target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined} onClick={onNavigate} data-subnav-link className="znav-sub">
      <span className="znav-sub-label">{item.label}</span>
      {item.external
        ? <><ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden /><span className="sr-only">(opens in a new tab)</span></>
        : <ArrowRight className="znav-sub-arrow h-4 w-4 shrink-0" aria-hidden />}
    </a>
  );
}

function DesktopNavItem({ item, active }: { item: NavItem; active: boolean }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const id = `submenu-${item.label.toLowerCase()}`;
  const label = (
    <><span className="znav-dot" aria-hidden />{item.label}</>
  );

  if (!item.children) {
    return (
      <div className="znav-item"><div className="znav-pill" data-active={active}>
        <MainNavLink item={item} aria-current={active ? "page" : undefined} data-testid={`link-nav-${item.label.toLowerCase()}`}
          className="znav-link" style={{ paddingRight: 16 }}>{label}</MainNavLink>
      </div></div>
    );
  }

  return (
    <div ref={root} className="znav-item" data-open={open} onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => { if (!root.current?.contains(document.activeElement)) setOpen(false); }}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          toggle.current?.focus();
        } else if (event.key === "ArrowDown" && !(event.target as HTMLElement).closest("[data-subnav-link]")) {
          event.preventDefault();
          setOpen(true);
          requestAnimationFrame(() => root.current?.querySelector<HTMLAnchorElement>("[data-subnav-link]")?.focus());
        }
      }}>
      <div className="znav-pill" data-active={active}>
        <MainNavLink item={item} onFocus={() => setOpen(true)} onClick={() => setOpen(false)}
          aria-current={active ? "page" : undefined} data-testid={`link-nav-${item.label.toLowerCase()}`}
          className="znav-link">{label}</MainNavLink>
        <button ref={toggle} type="button" aria-label={`${item.label} sections`} aria-expanded={open} aria-controls={id}
          onClick={() => setOpen(value => !value)} data-testid={`button-submenu-${item.label.toLowerCase()}`} className="znav-toggle">
          <ChevronDown aria-hidden className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
      <div id={id} hidden={!open} className="znav-panel">
        <ul aria-label={`${item.label} sections`}>
          <li className="znav-head" aria-hidden><span>{item.label}</span><span>{String(item.children.length).padStart(2, "0")}</span></li>
          {item.children.map((child, i) => <li key={child.href}><SubNavLink item={child} index={i} onNavigate={() => setOpen(false)} /></li>)}
        </ul>
      </div>
    </div>
  );
}

export function PrimaryNavigation() {
  const [loc] = useLocation();
  return (
    <nav aria-label="Primary" className="znav hidden xl:block">
      <div className="znav-rail">
        {NAV.map(item => <DesktopNavItem key={`${loc}:${item.href}`} item={item} active={isNavItemActive(item, loc)} />)}
      </div>
    </nav>
  );
}

export function MobileNavigationLinks({ onNavigate }: { onNavigate: () => void }) {
  const [loc] = useLocation();
  return (
    <ul className="znav space-y-1">
      {NAV.map((item) => {
        const active = isNavItemActive(item, loc);
        return (
          <li key={item.href}>
            <MainNavLink item={item} onClick={onNavigate} data-testid={`link-mobile-${item.label.toLowerCase()}`}
              aria-current={active ? "page" : undefined} className="znav-m-main">
              {item.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </MainNavLink>
            {item.children && (
              <ul className="znav-m-list" aria-label={`${item.label} sections`}>
                {item.children.map((child, i) => <li key={child.href}><SubNavLink item={child} index={i} onNavigate={onNavigate} /></li>)}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
