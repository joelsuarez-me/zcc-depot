import { Link } from "wouter";
import { useId } from "react";
import { ArrowUpRight, ChevronRight, Lock } from "lucide-react";
import type { SiteDestination, SiteMapPage } from "@/data/site-map";

export function LockBadge() {
  return <span className="sm-lock" title="Presenter Mode and sign-in required"><Lock className="h-3 w-3" aria-hidden />Presenter</span>;
}

const slug = (href: string) => href.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home";

function Dest({ d, className, children, testId }: { d: SiteDestination; className: string; children: React.ReactNode; testId: string }) {
  if (d.external) return (
    <a href={d.href} target="_blank" rel="noopener noreferrer" className={className} data-testid={testId}>
      {children}<span className="sm-ext"><ArrowUpRight className="h-3 w-3" aria-hidden />External</span><span className="sr-only">(opens in a new tab)</span>
    </a>
  );
  return <Link href={d.href} className={className} data-testid={testId}>{children}</Link>;
}

export function PageCard({ page, open, onToggle, searching }: { page: SiteMapPage; open: boolean; onToggle: () => void; searching: boolean }) {
  const instance = useId();
  const id = `sm-secs-${slug(page.href)}-${instance}`;
  const n = page.sections.length;
  return (
    <li className="sm-card" data-testid={`card-page-${slug(page.href)}`}>
      <Dest d={page} className="sm-ptitle" testId={`link-page-${slug(page.href)}`}>
        <span className="min-w-0 flex-1">{page.title}</span>
        {page.access === "presenter" && <LockBadge />}
      </Dest>
      {!page.external && <span className="sm-url">{page.href}</span>}
      <p className="sm-pdesc">{page.description}</p>
      {n > 0 && (
        <>
          <button type="button" className="sm-toggle" aria-expanded={open} aria-controls={id} onClick={onToggle} data-testid={`button-toggle-${slug(page.href)}`}>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            {open ? "Hide" : "Show"} {n} {searching ? "matching " : ""}section{n === 1 ? "" : "s"}
          </button>
          {open && (
            <ul id={id} className="sm-secs">
              {page.sections.map(s => (
                <li key={s.href}>
                  <Dest d={s} className="sm-sec" testId={`link-section-${slug(s.href)}`}>
                    <span>{s.title}</span>
                    {s.access === "presenter" && <LockBadge />}
                    {s.description && s.access !== "presenter" && <small>{s.description}</small>}
                  </Dest>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  );
}
