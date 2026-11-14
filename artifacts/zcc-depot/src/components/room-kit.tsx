import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Link2, Star } from "lucide-react";
import { ROOMS, roomById, type RoomId } from "@/data/depot-rooms";
import { useDepot } from "@/lib/depot-mode";
import { PresenterDock } from "@/components/presenter";
import { Reveal } from "@/components/kit";

export type Status = "Documented" | "Config-dependent" | "Plan-dependent" | "Early access" | "Optional" | "Conceptual";
export function StatusTag({ s }: { s: Status }) {
  return <span className={`depot-status s-${s.toLowerCase().replace(/\s+/g, "-")}`} data-testid={`status-${s.toLowerCase().replace(/\s+/g, "-")}`}>{s}</span>;
}

export function RoomFrame({ id, lede, children, actions }: { id: RoomId; lede: ReactNode; children: ReactNode; actions?: ReactNode }) {
  const room = roomById(id);
  const idx = ROOMS.findIndex((r) => r.id === id);
  const prev = ROOMS[idx - 1], next = ROOMS[idx + 1];
  const [, navigate] = useLocation();
  const { isFavorite, toggleFavorite } = useDepot();
  const reduce = useReducedMotion();
  const fav = isFavorite(room.href);
  return (
    <div className="room" data-room={id}>
      <motion.header className="room-hero on-dark" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}>
        <div className="room-hero-num" aria-hidden>{room.n}</div>
        <div className="relative grid gap-4 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <div className="eyebrow flex items-center gap-2 text-[#D1F470]"><span>Room {room.n}</span><span className="text-[#F5F5F2]/35">·</span><span className="text-[#F5F5F2]/55">{room.audience}</span></div>
            <h1 className="mt-2 text-[1.75rem] font-semibold leading-[1.05] tracking-[-0.025em] md:text-[2.4rem]">{room.title}</h1>
          </div>
          <div className="md:col-span-5">
            <p className="text-sm leading-relaxed text-[#F5F5F2]/75">{lede}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => toggleFavorite(room.href)} aria-pressed={fav} className="room-chip" data-testid="button-favorite-room">
                <Star className={`h-3.5 w-3.5 ${fav ? "fill-[#D1F470] text-[#D1F470]" : ""}`} aria-hidden />{fav ? "Favorited" : "Favorite"}
              </button>
              {actions}
            </div>
          </div>
        </div>
        <nav aria-label={`${room.title} sections`} className="relative mt-5 flex gap-1.5 overflow-x-auto pb-1">
          {room.sections.map((s) => <a key={s.id} href={`#${s.id}`} className="room-sec" data-testid={`link-section-${s.id}`}>{s.label}</a>)}
        </nav>
      </motion.header>

      <div className="room-body">{children}</div>

      <nav aria-label="Room navigation" className="room-pager">
        {prev ? <Link href={prev.href} className="room-pager-link" data-testid="link-room-prev"><ArrowLeft className="h-4 w-4" aria-hidden /><span><span className="block text-xs text-[#11110D]/50">Room {prev.n}</span>{prev.title}</span></Link> : <Link href="/" className="room-pager-link" data-testid="link-room-prev"><ArrowLeft className="h-4 w-4" aria-hidden /><span><span className="block text-xs text-[#11110D]/50">Back to</span>Home</span></Link>}
        {next ? <Link href={next.href} className="room-pager-link is-next" data-testid="link-room-next"><span><span className="block text-xs text-[#11110D]/50">Room {next.n}</span>{next.title}</span><ArrowRight className="h-4 w-4" aria-hidden /></Link> : <span />}
      </nav>
      <PresenterDock roomId={id} onPrevRoom={prev ? () => navigate(prev.href) : undefined} onNextRoom={next ? () => navigate(next.href) : undefined} />
    </div>
  );
}

export function RoomSection({ id, eyebrow, title, lede, children, tone }: { id: string; eyebrow: string; title: ReactNode; lede?: ReactNode; children: ReactNode; tone?: "plain" | "panel" }) {
  const { isFavorite, toggleFavorite } = useDepot();
  const [loc] = useLocation();
  const href = `${loc}#${id}`;
  const fav = isFavorite(href);
  return (
    <section id={id} data-section-nav className={`room-section ${tone === "panel" ? "is-panel" : ""}`} aria-labelledby={`${id}-title`}>
      <Reveal className="mb-4 grid gap-3 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <div className="eyebrow flex items-center gap-2 text-[#11110D]/55">
            {eyebrow}
            <a href={`#${id}`} className="room-perma" aria-label={`Permalink to ${eyebrow}`} data-testid={`link-permalink-${id}`}><Link2 className="h-3.5 w-3.5" aria-hidden /></a>
            <button type="button" onClick={() => toggleFavorite(href)} aria-pressed={fav} className="room-perma" aria-label={fav ? `Remove ${eyebrow} from favorites` : `Add ${eyebrow} to favorites`} data-testid={`button-favorite-${id}`}>
              <Star className={`h-3.5 w-3.5 ${fav ? "fill-[#11110D]" : ""}`} aria-hidden />
            </button>
          </div>
          <h2 id={`${id}-title`} className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.02em] md:text-[2rem]">{title}</h2>
        </div>
        {lede && <p className="text-[15px] leading-relaxed text-[#11110D]/65 md:col-span-5">{lede}</p>}
      </Reveal>
      {children}
    </section>
  );
}

export function SourceNote({ children }: { children: ReactNode }) {
  return <p className="mt-5 border-l-2 border-[#11110D]/20 pl-3 text-xs leading-relaxed text-[#11110D]/55">{children}</p>;
}
