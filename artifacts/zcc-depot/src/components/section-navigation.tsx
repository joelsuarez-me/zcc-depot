import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Link2 } from "lucide-react";
import { useLocation } from "wouter";
import { adjacentSection, sectionStops, sectionTargets } from "@/lib/section-navigation";
import "./section-navigation.css";

// Layout coordinates stay stable while existing reveal animations translate headings.
function documentTop(element: HTMLElement): number {
  let top = 0;
  for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) {
    top += node.offsetTop;
  }
  return top;
}

function readStops() {
  const main = document.getElementById("main");
  const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const elements = sectionTargets(main);
  const footer = document.querySelector("footer");
  const offset = window.innerWidth < 1024 ? 128 : 80;
  return sectionStops([
    ...elements.map(element => documentTop(element) - offset),
    ...(footer ? [documentTop(footer) - offset] : []),
  ], max);
}

export function SectionNavigation() {
  const [location] = useLocation();
  const [available, setAvailable] = useState({ up: false, down: false });
  const [currentId, setCurrentId] = useState("main");

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const stops = readStops();
      const up = adjacentSection(stops, window.scrollY, -1) !== undefined;
      const down = adjacentSection(stops, window.scrollY, 1) !== undefined;
      setAvailable(previous => previous.up === up && previous.down === down ? previous : { up, down });
      const targets = sectionTargets(document.getElementById("main"));
      setCurrentId([...targets].reverse().find(element => documentTop(element) <= window.scrollY + 128)?.id ?? "main");
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const main = document.getElementById("main");
    const mutations = new MutationObserver(schedule);
    const resize = new ResizeObserver(schedule);
    if (main) {
      mutations.observe(main, { childList: true, subtree: true });
      resize.observe(main);
    }
    const footer = document.querySelector("footer");
    if (footer) resize.observe(footer);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [location]);

  const navigate = (direction: -1 | 1) => {
    // Read again on click so newly generated reports and agenda changes are included.
    const top = adjacentSection(readStops(), window.scrollY, direction);
    if (top === undefined) return;
    window.scrollTo({
      top,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  return (
    <nav aria-label="Section navigation" data-testid="section-navigation"
      className={`section-navigation fixed left-3 z-40 flex flex-col gap-1 rounded-full border border-[#D1F470]/40 bg-[#203524] p-1 text-[#D1F470] shadow-[0_6px_24px_rgba(17,17,13,.25)] md:left-6 print:hidden ${location === "/architecture/components" ? "section-nav-components" : ""} ${location === "/architecture" ? "section-nav-architecture" : ""} ${location === "/demos" ? "section-nav-blueprint" : ""}`}
      style={{ bottom: "var(--section-nav-bottom, calc(env(safe-area-inset-bottom, 0px) + 1rem))" }}>
      <button type="button" onClick={() => navigate(-1)} disabled={!available.up}
        aria-label="Previous section" title="Previous section" data-testid="button-section-up"
        className="grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-[#D1F470] hover:text-[#203524] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D1F470] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#D1F470]">
        <ArrowUp className="h-5 w-5" aria-hidden />
      </button>
      <button type="button" onClick={() => navigate(1)} disabled={!available.down}
        aria-label="Next section" title="Next section" data-testid="button-section-down"
        className="grid h-11 w-11 place-items-center rounded-full transition-colors hover:bg-[#D1F470] hover:text-[#203524] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D1F470] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#D1F470]">
        <ArrowDown className="h-5 w-5" aria-hidden />
      </button>
      <a href={`#${encodeURIComponent(currentId)}`} aria-label="Direct link to the current section" title="Direct section link · right-click to copy"
        data-testid="link-current-section" className="grid h-11 w-11 place-items-center rounded-full border-t border-[#D1F470]/20 hover:bg-[#D1F470] hover:text-[#203524] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D1F470]">
        <Link2 className="h-4 w-4" aria-hidden />
      </a>
    </nav>
  );
}
