import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, PlayCircle } from "lucide-react";
import { DEMO_URL, LINKS } from "@/data/content";
import { NAV } from "@/data/navigation";
import { HeroArt, RouteBadge, SectionGlyph, type Motif } from "@/components/art";
import { SearchTrigger } from "@/components/global-search";
import { DepotSidebar, DepotTopbar } from "@/components/depot-shell";
import { useDepot } from "@/lib/depot-mode";
import { ROUTE_LABELS } from "@/data/depot-rooms";
import { SectionNavigation } from "@/components/section-navigation";
import { SectionLink } from "@/components/section-link";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { attachHashNavigation } from "@/lib/hash-navigation";

const logo = `${import.meta.env.BASE_URL}brand/zendesk-monochrome-padded.png`;

export { NAV } from "@/data/navigation";

export function Ext({ href, children, className = "", testId }: { href: string; children: ReactNode; className?: string; testId?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`group inline-flex items-center gap-1.5 ${className}`} data-testid={testId}>
      {children}
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export function DemoButton({ label = "Launch guided demo", variant = "lime", testId = "button-launch-demo" }: { label?: string; variant?: "lime" | "forest"; testId?: string }) {
  const cls = variant === "lime" ? "bg-[#D1F470] text-[#11110D] hover:bg-[#c3ea55]" : "bg-[#203524] text-[#D1F470] hover:bg-[#2b4630]";
  return (
    <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" data-testid={testId}
      className={`group inline-flex items-center gap-2.5 rounded-full px-5 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 ${cls}`}>
      <PlayCircle className="h-4 w-4" aria-hidden /> {label}
      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
      <span className="sr-only">(guided click-through demo, opens in a new tab)</span>
    </a>
  );
}

export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}

// Legacy num props are accepted but never rendered; section names are unnumbered.
export function SectionHead({ id, permalinkId, eyebrow, title, lede, dark = false }: { id?: string; permalinkId?: string; num?: string; eyebrow: string; title: ReactNode; lede?: ReactNode; dark?: boolean }) {
  return (
    <Reveal className="mb-10 grid gap-6 md:grid-cols-12 md:items-end">
      <div className="md:col-span-7" id={id} data-section-nav>
        <div className={`eyebrow mb-4 flex items-center gap-3 ${dark ? "text-[#D1F470]" : "text-[#203524]"}`}>
          {eyebrow}<SectionGlyph label={eyebrow} dark={dark} />{(id || permalinkId) && <SectionLink id={(id || permalinkId)!} label={eyebrow} dark={dark} />}
        </div>
        <h2 className={`text-[2rem] leading-[1.05] font-semibold tracking-tight md:text-5xl ${dark ? "text-[#F5F5F2]" : "text-[#11110D]"}`}>{title}</h2>
      </div>
      {lede && <p className={`md:col-span-5 text-base leading-relaxed ${dark ? "text-[#F5F5F2]/70" : "text-[#11110D]/65"}`}>{lede}</p>}
    </Reveal>
  );
}

const MOTIFS: Record<string, Motif> = { "/architecture": "map", "/sales": "brief", "/pricing": "gate", "/sell-sheet": "doc", "/demos": "rooms", "/demos/instance-details": "flow", "/demos/brief": "brief", "/resources": "search" };

export function PageHero({ eyebrow, title, lede, children, motif }: { eyebrow: string; title: ReactNode; lede: ReactNode; children?: ReactNode; motif?: Motif }) {
  const reduce = useReducedMotion();
  const [loc] = useLocation();
  const m = motif ?? MOTIFS[loc] ?? "flow";
  return (
    <div className="zhero-wrap">
    <section className="zhero on-dark">
      <div className="grid-lines absolute inset-0" aria-hidden />
      <div className="relative w-full px-6 py-6 md:px-12">
        <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}>
          <div className="grid gap-2 md:grid-cols-12 md:items-end md:gap-6">
            <div className="md:col-span-7 lg:col-span-6">
              <div className="eyebrow mb-1.5 flex items-center gap-2 text-[0.625rem] text-[#D1F470]"><span className="lg:hidden"><RouteBadge motif={m} /></span><span className="hidden h-1.5 w-1.5 rounded-full bg-[#D1F470] lg:inline-block" aria-hidden />{eyebrow}</div>
              <h1 className="max-w-4xl text-2xl font-semibold leading-[1.08] tracking-tight md:text-[2rem]">{title}</h1>
            </div>
            <p className="max-w-3xl text-sm leading-snug text-[#F5F5F2]/75 md:col-span-5 lg:col-span-4">{lede}</p>
            <div className="zart-slot pointer-events-none hidden lg:col-span-2 lg:block" aria-hidden><HeroArt motif={m} className="is-sm" /></div>
          </div>
          {children && <div className="mt-3 flex flex-wrap items-center gap-2 [&_a]:py-1.5 [&_button]:py-1.5">{children}</div>}
        </motion.div>
      </div>
    </section>
    </div>
  );
}

export function Section({ id, children, className = "", tone = "paper" }: { id?: string; children: ReactNode; className?: string; tone?: "paper" | "white" | "forest" | "ink" }) {
  const bg = { paper: "bg-[#F5F5F2]", white: "bg-[#FBFBF8]", forest: "on-dark bg-[#203524] text-[#F5F5F2]", ink: "on-dark bg-[#11110D] text-[#F5F5F2]" }[tone];
  return <section id={id} data-section-nav={id ? true : undefined} className={`${bg} ${className}`}><div className="section-body mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">{children}</div></section>;
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-8 border-l-2 border-[#203524]/30 pl-4 text-xs leading-relaxed text-[#11110D]/55">{children}</p>;
}

function useHashScroll() {
  const [loc] = useLocation();
  useEffect(() => attachHashNavigation(), [loc]);
}

export function Shell({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { sidebarCollapsed, pushRecent } = useDepot();
  useHashScroll();
  useEffect(() => setOpen(false), [loc]);
  useEffect(() => { if (ROUTE_LABELS[loc]) pushRecent(loc); }, [loc]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  return (
    <div className={`depot-shell min-h-[100dvh] ${sidebarCollapsed ? "is-collapsed" : ""}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-[#D1F470] focus:px-4 focus:py-2 focus:text-[#11110D]">Skip to content</a>
      <DepotSidebar logo={logo} />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="depot-mobile-drawer z-[90] flex w-[min(20rem,86vw)] flex-col border-0 bg-[#11110D] p-0 [&>button]:text-[#D1F470]"
          onCloseAutoFocus={event => { event.preventDefault(); menuButtonRef.current?.focus(); }}>
          <SheetTitle className="sr-only">Depot navigation</SheetTitle>
          <SheetDescription className="sr-only">Choose a demo room or an existing portal resource.</SheetDescription>
          <DepotSidebar logo={logo} mobile onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="depot-content">
        <DepotTopbar onMenu={() => setOpen(true)} menuButtonRef={menuButtonRef} search={<SearchTrigger />} />
        <main id="main" tabIndex={-1} className="depot-main outline-none">{children}</main>
        <Footer />
      </div>
      <SectionNavigation />
    </div>
  );
}

function Footer() {
  return (
    <footer className="on-dark bg-[#11110D] text-[#F5F5F2]">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="serif text-4xl italic leading-tight text-[#D1F470] md:text-5xl">Every call, connected.</p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#F5F5F2]/60">ZCC Depot is an architect-curated resource depot for Zendesk Contact Center conversations. It is not an official Zendesk product; always confirm availability, pricing, and compliance details with current Zendesk documentation.</p>
          </div>
          <div className="md:col-span-3">
            <div className="eyebrow mb-4 text-[#F5F5F2]/40">Depot</div>
            <ul className="space-y-2.5">
              {NAV.map((n) => <li key={n.href}><Link href={n.href} className="text-sm hover:text-[#D1F470]" data-testid={`link-footer-${n.label.toLowerCase()}`}>{n.label}</Link></li>)}
            </ul>
          </div>
          <div className="md:col-span-4">
            <div className="eyebrow mb-4 text-[#F5F5F2]/40">Official sources</div>
            <ul className="space-y-2.5 text-sm">
              <li><Ext href={LINKS.product} className="hover:text-[#D1F470]">Zendesk Contact Center</Ext></li>
              <li><Ext href={LINKS.usingSection} className="hover:text-[#D1F470]">Contact Center Help Center</Ext></li>
              <li><Ext href={LINKS.resolution} className="hover:text-[#D1F470]">Advancing the Resolution Platform</Ext></li>
              <li><Ext href={DEMO_URL} className="hover:text-[#D1F470]">Guided click-through demo</Ext></li>
            </ul>
          </div>
        </div>
        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-[#F5F5F2]/10 pt-6 text-xs text-[#F5F5F2]/40 md:flex-row">
          <span>Zendesk and the Zendesk logo are trademarks of Zendesk, Inc.</span>
          <span className="mono">ZCC DEPOT · PLATFORM ARCHITECTURE</span>
        </div>
      </div>
    </footer>
  );
}
