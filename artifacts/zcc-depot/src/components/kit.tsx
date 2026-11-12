import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Menu, X, PlayCircle } from "lucide-react";
import { DEMO_URL, LINKS } from "@/data/content";
import { NAV } from "@/data/navigation";
import { SearchTrigger } from "@/components/global-search";
import { MobileNavigationLinks, PrimaryNavigation } from "@/components/header-navigation";

const logo = `${import.meta.env.BASE_URL}brand/zendesk-logo.svg`;

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

export function SectionHead({ id, num, eyebrow, title, lede, dark = false }: { id?: string; num: string; eyebrow: string; title: ReactNode; lede?: ReactNode; dark?: boolean }) {
  return (
    <Reveal className="mb-10 grid gap-6 md:grid-cols-12 md:items-end">
      <div className="md:col-span-7" id={id}>
        <div className={`eyebrow mb-4 flex items-center gap-3 ${dark ? "text-[#D1F470]" : "text-[#203524]"}`}>
          <span className={`rounded-full px-2 py-0.5 ${dark ? "bg-[#D1F470] text-[#11110D]" : "bg-[#203524] text-[#D1F470]"}`}>{num}</span>{eyebrow}
        </div>
        <h2 className={`text-[2rem] leading-[1.05] font-semibold tracking-tight md:text-5xl ${dark ? "text-[#F5F5F2]" : "text-[#11110D]"}`}>{title}</h2>
      </div>
      {lede && <p className={`md:col-span-5 text-base leading-relaxed ${dark ? "text-[#F5F5F2]/70" : "text-[#11110D]/65"}`}>{lede}</p>}
    </Reveal>
  );
}

export function PageHero({ eyebrow, title, lede, children }: { eyebrow: string; title: ReactNode; lede: ReactNode; children?: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <section className="on-dark relative overflow-hidden bg-[#203524] text-[#F5F5F2]">
      <div className="grid-lines absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-32 md:px-8 md:pb-24 md:pt-40">
        <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}>
          <div className="eyebrow mb-5 text-[#D1F470]">{eyebrow}</div>
          <h1 className="max-w-4xl text-[2.6rem] font-semibold leading-[1] tracking-tight md:text-7xl">{title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#F5F5F2]/75">{lede}</p>
          {children && <div className="mt-9 flex flex-wrap gap-3">{children}</div>}
        </motion.div>
      </div>
    </section>
  );
}

export function Section({ children, className = "", tone = "paper" }: { children: ReactNode; className?: string; tone?: "paper" | "white" | "forest" | "ink" }) {
  const bg = { paper: "bg-[#F5F5F2]", white: "bg-[#FBFBF8]", forest: "on-dark bg-[#203524] text-[#F5F5F2]", ink: "on-dark bg-[#11110D] text-[#F5F5F2]" }[tone];
  return <section className={`${bg} ${className}`}><div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">{children}</div></section>;
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-8 border-l-2 border-[#203524]/30 pl-4 text-xs leading-relaxed text-[#11110D]/55">{children}</p>;
}

function useHashScroll() {
  const [loc] = useLocation();
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
      return () => clearTimeout(t);
    }
    window.scrollTo({ top: 0 });
    return undefined;
  }, [loc]);
}

export function Shell({ children }: { children: ReactNode }) {
  const [loc] = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useHashScroll();
  useEffect(() => setOpen(false), [loc]);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24);
    f(); window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  return (
    <div className="min-h-[100dvh]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-[#D1F470] focus:px-4 focus:py-2 focus:text-[#11110D]">Skip to content</a>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6">
        <div className={`mx-auto flex max-w-7xl items-center justify-between rounded-full border px-3 py-2 transition-all duration-300 md:px-4 ${scrolled || open ? "border-[#11110D]/10 bg-[#F5F5F2]/90 shadow-[0_10px_30px_-12px_rgba(32,53,36,.35)] backdrop-blur-md" : "border-transparent bg-[#F5F5F2]"}`}>
          <Link href="/" className="flex items-center gap-3 rounded-full pl-2 pr-3" data-testid="link-home-logo">
            <img src={logo} alt="Zendesk" className="h-6 w-auto" />
          </Link>
          <PrimaryNavigation />
          <div className="flex items-center gap-2">
            <SearchTrigger />
            <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" data-testid="button-header-demo"
              className="hidden items-center gap-1.5 rounded-full bg-[#D1F470] px-4 py-2 text-sm font-semibold text-[#11110D] transition-transform hover:-translate-y-0.5 sm:inline-flex">
              Guided demo <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /><span className="sr-only">(opens in a new tab)</span>
            </a>
            <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"}
              data-testid="button-mobile-menu" className="grid h-10 w-10 place-items-center rounded-full bg-[#203524] text-[#D1F470] lg:hidden">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open && (
          <nav id="mobile-nav" aria-label="Mobile" className="mx-auto mt-2 max-h-[calc(100dvh-100px)] max-w-7xl overflow-y-auto rounded-3xl border border-[#11110D]/10 bg-[#F5F5F2] p-3 shadow-xl lg:hidden">
            <MobileNavigationLinks onNavigate={() => setOpen(false)} />
            <div className="p-2 pt-3"><DemoButton testId="button-mobile-demo" /></div>
          </nav>
        )}
      </header>
      <main id="main" tabIndex={-1} className="outline-none">{children}</main>
      <Footer />
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
            <ul className="space-y-2.5">{NAV.map((n) => <li key={n.href}><Link href={n.href} className="text-sm hover:text-[#D1F470]" data-testid={`link-footer-${n.label.toLowerCase()}`}>{n.label}</Link></li>)}</ul>
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
