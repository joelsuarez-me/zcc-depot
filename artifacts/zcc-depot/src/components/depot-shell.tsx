import { useEffect, useState, type ReactNode, type Ref } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, Clock3, Expand, LogOut, Menu, Minimize, PanelLeftClose, PanelLeftOpen, Presentation, Star, Users } from "lucide-react";
import { NAV, isNavItemActive } from "@/data/navigation";
import { ROOMS, ROUTE_LABELS } from "@/data/depot-rooms";
import { useDepot } from "@/lib/depot-mode";

function labelFor(href: string) {
  const [path, hash] = href.split("#");
  const base = ROUTE_LABELS[path]?.label ?? path;
  if (!hash) return base;
  const room = ROOMS.find((r) => r.href === path);
  const sec = room?.sections.find((s) => s.id === hash);
  return `${base} · ${sec?.label ?? hash.replace(/-/g, " ")}`;
}

export function DepotSidebar({ logo, mobile = false, onNavigate }: { logo: string; mobile?: boolean; onNavigate?: () => void }) {
  const [loc] = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed, favorites, recents, toggleFavorite, isPresenter } = useDepot();
  const collapsed = !mobile && sidebarCollapsed;
  const recentList = recents.filter((r) => r !== loc).slice(0, 4);

  return (
    <nav aria-label="Depot" className={`depot-sidebar on-dark ${mobile ? "is-mobile" : ""} ${collapsed ? "is-collapsed" : ""}`} data-testid={mobile ? "nav-mobile" : "nav-sidebar"}>
      <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-4">
        <Link href="/" onClick={onNavigate} className="flex min-w-0 items-center gap-2.5 rounded-xl" data-testid="link-home-logo">
          <img src={logo} alt="Zendesk" className="h-9 w-11 shrink-0 rounded-lg object-contain" />
          {!collapsed && <span className="min-w-0 leading-tight"><span className="block text-sm font-semibold text-[#F5F5F2]">Architect Depot</span><span className="mono block text-[10px] tracking-[0.12em] text-[#F5F5F2]/45">CONTACT CENTER</span></span>}
        </Link>
        {!mobile && (
          <button type="button" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="depot-icon-btn hidden lg:grid" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} data-testid="button-sidebar-collapse">
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        )}
      </div>

      <div className="depot-sidebar-scroll">
        <div className="depot-side-label">{collapsed ? "Rooms" : "Demo rooms"}</div>
        <ul className="space-y-0.5">
          {ROOMS.map((r) => {
            const active = loc === r.href;
            return (
              <li key={r.id}>
                <Link href={r.href} onClick={onNavigate} className={`depot-side-link ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined} title={collapsed ? r.title : undefined} data-testid={`link-room-${r.id}`}>
                  <span className="depot-room-num">{r.n}</span>
                  {!collapsed && <span className="truncate">{r.title}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {!collapsed && (
          <>
            <div className="depot-side-label mt-5">Library</div>
            <ul className="space-y-0.5">
              {NAV.map((n) => {
                const href = n.href.split("#")[0];
                const active = isNavItemActive(n, loc);
                return (
                  <li key={n.href}>
                    <Link href={href} onClick={onNavigate} className={`depot-side-link is-quiet ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined} data-testid={`link-nav-${n.label.toLowerCase()}`}>
                      <span className="truncate">{n.label}</span>
                    </Link>
                    {active && n.children && (
                      <ul className="mb-1 ml-4 border-l border-[#F5F5F2]/10 pl-2">
                        {n.children.filter((c) => isPresenter || !["/resources#roadmap", "/resources#collaboration", "/resources#pitch-deck"].includes(c.href)).map((c) => (
                          <li key={c.href}><Link href={c.href} onClick={onNavigate} className={`depot-side-sublink ${loc === c.href ? "is-active" : ""}`} data-testid={`link-subnav-${c.label.toLowerCase().replace(/\W+/g, "-")}`}>{c.label}</Link></li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>

            {favorites.length > 0 && (
              <>
                <div className="depot-side-label mt-5 flex items-center gap-1.5"><Star className="h-3 w-3" aria-hidden />Favorites</div>
                <ul className="space-y-0.5">
                  {favorites.slice(0, 8).map((f) => (
                    <li key={f} className="group flex items-center">
                      {/^https:\/\//.test(f)
                        ? <a href={f} target="_blank" rel="noopener noreferrer" onClick={onNavigate} className="depot-side-sublink flex-1 truncate" data-testid={`link-favorite-${f}`}>{labelFor(f)}<span className="sr-only"> (opens in a new tab)</span></a>
                        : <Link href={f} onClick={onNavigate} className="depot-side-sublink flex-1 truncate" data-testid={`link-favorite-${f}`}>{labelFor(f)}</Link>}
                      <button type="button" onClick={() => toggleFavorite(f)} className="px-1.5 text-[#F5F5F2]/30 opacity-0 transition-opacity hover:text-[#D1F470] group-hover:opacity-100 focus:opacity-100" aria-label={`Remove ${labelFor(f)} from favorites`}>×</button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {recentList.length > 0 && (
              <>
                <div className="depot-side-label mt-5 flex items-center gap-1.5"><Clock3 className="h-3 w-3" aria-hidden />Recent</div>
                <ul className="space-y-0.5">
                  {recentList.map((r) => <li key={r}><Link href={r} onClick={onNavigate} className="depot-side-sublink truncate" data-testid={`link-recent-${r}`}>{labelFor(r)}</Link></li>)}
                </ul>
              </>
            )}
          </>
        )}
      </div>
      {!collapsed && <ModeCard />}
    </nav>
  );
}

function ModeCard() {
  const { isPresenter, auth, signOut } = useDepot();
  return (
    <div className="m-3 rounded-2xl border border-[#F5F5F2]/10 p-3 text-xs text-[#F5F5F2]/60">
      <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${isPresenter ? "bg-[#D1F470]" : "bg-[#F5F5F2]/40"}`} aria-hidden /><span className="font-semibold text-[#F5F5F2]">{isPresenter ? "Presenter Mode" : "Customer Mode"}</span></div>
      <p className="mt-1 leading-snug">{isPresenter ? "Internal material is served only to signed-in team members." : "Presentation-safe. No internal notes load."}</p>
      {auth.isAuthenticated && (
        <button type="button" onClick={signOut} className="mt-2 inline-flex items-center gap-1.5 text-[#F5F5F2]/70 hover:text-[#D1F470]" data-testid="button-sign-out"><LogOut className="h-3 w-3" aria-hidden />Sign out</button>
      )}
    </div>
  );
}

export function ModeSwitch() {
  const { mode, setMode } = useDepot();
  return (
    <div className="depot-mode" role="radiogroup" aria-label="Presentation mode" data-testid="switch-mode">
      {(["customer", "presenter"] as const).map((m) => (
        <button key={m} type="button" role="radio" aria-label={`${m === "customer" ? "Customer" : "Presenter"} mode`} aria-checked={mode === m} tabIndex={mode === m ? 0 : -1} onClick={() => setMode(m)}
          onKeyDown={e => {
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
              e.preventDefault();
              const next = m === "customer" ? "presenter" : "customer";
              setMode(next);
              document.querySelector<HTMLButtonElement>(`[data-testid="button-mode-${next}"]`)?.focus();
            }
          }} className={mode === m ? "is-on" : ""} data-testid={`button-mode-${m}`}>
          {m === "customer" ? <Users className="h-3.5 w-3.5" aria-hidden /> : <Presentation className="h-3.5 w-3.5" aria-hidden />}
          <span className="hidden sm:inline">{m === "customer" ? "Customer" : "Presenter"}</span>
        </button>
      ))}
    </div>
  );
}

function Breadcrumbs() {
  const [loc] = useLocation();
  const trail: { href: string; label: string }[] = [];
  let cur: string | undefined = loc;
  while (cur && ROUTE_LABELS[cur]) {
    trail.unshift({ href: cur, label: ROUTE_LABELS[cur].label });
    cur = ROUTE_LABELS[cur].parent;
  }
  if (loc !== "/") trail.unshift({ href: "/", label: "Home" });
  if (!trail.length) trail.push({ href: loc, label: "Not found" });
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-sm">
        {trail.map((t, i) => {
          const last = i === trail.length - 1;
          const linkable = !last && t.href !== "/rooms";
          return (
            <li key={t.href} className={`flex min-w-0 items-center gap-1 ${!last ? "hidden md:flex" : ""}`}>
              {linkable ? <Link href={t.href} className="truncate text-[#11110D]/55 hover:text-[#11110D]" data-testid={`link-crumb-${i}`}>{t.label}</Link>
                : <span className={`truncate ${last ? "font-semibold text-[#11110D]" : "text-[#11110D]/55"}`} aria-current={last ? "page" : undefined}>{t.label}</span>}
              {!last && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#11110D]/30" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function useFullscreen() {
  const [full, setFull] = useState(false);
  useEffect(() => {
    const f = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);
  const toggle = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen?.(); };
  return { full, toggle };
}

export function DepotTopbar({ onMenu, search, menuButtonRef }: { onMenu: () => void; search: ReactNode; menuButtonRef?: Ref<HTMLButtonElement> }) {
  const { full, toggle } = useFullscreen();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f(); window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <header className={`depot-topbar ${scrolled ? "is-scrolled" : ""}`}>
      <button ref={menuButtonRef} type="button" onClick={onMenu} className="depot-icon-btn is-light lg:hidden" aria-label="Open navigation" data-testid="button-mobile-menu"><Menu className="h-5 w-5" /></button>
      <Breadcrumbs />
      <div className="ml-auto flex items-center gap-2">
        {search}
        <ModeSwitch />
        <button type="button" onClick={toggle} className="depot-icon-btn is-light hidden sm:grid" aria-label={full ? "Exit full screen" : "Full-screen presentation"} title="Full screen (F in presenter rooms)" data-testid="button-fullscreen">
          {full ? <Minimize className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
