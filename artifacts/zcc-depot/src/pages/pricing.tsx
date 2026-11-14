import { useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetPricingGuide, getGetPricingGuideQueryKey } from "@workspace/api-client-react";
import { AlertTriangle, ArrowRight, ArrowUpRight, Cloud, Layers, Lock, RotateCw, ShieldCheck, Sprout } from "lucide-react";
import { PageHero, Reveal } from "@/components/kit";
import { LaneArt, StateArt } from "@/components/art";
import { SectionLink } from "@/components/section-link";
import "./pricing.css";

const title = "Pricing | ZCC Depot";
const description = "Signed-in internal pricing guide for Zendesk Contact Center conversations. Internal use only.";

const visuals = {
  bundle: { num: "01", icon: Layers },
  byoa: { num: "02", icon: Cloud },
  team: { num: "03", icon: Sprout },
} as const;

function useMeta() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const metadata = [
      ['meta[name="description"]', description],
      ['meta[property="og:title"]', title],
      ['meta[property="og:description"]', description],
      ['meta[name="twitter:title"]', title],
      ['meta[name="twitter:description"]', description],
    ].map(([selector, content]) => {
      const element = document.querySelector<HTMLMetaElement>(selector);
      const previous = element?.getAttribute("content") ?? "";
      element?.setAttribute("content", content);
      return { element, previous };
    });
    return () => {
      document.title = previousTitle;
      metadata.forEach(({ element, previous }) => element?.setAttribute("content", previous));
    };
  }, []);
}

function Badges() {
  return (
    <div className="flex flex-wrap gap-2" data-testid="badges-pricing-access">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D1F470] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#11110D]"><Lock className="h-3.5 w-3.5" aria-hidden /> Internal only</span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F5F5F2]/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#F5F5F2]"><ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Signed-in access</span>
    </div>
  );
}

function SignIn({ login, expired }: { login: () => void; expired?: boolean }) {
  return (
    <PageHero eyebrow="Commercial motions · Internal" title="Pricing"
      lede={expired ? "Your session has expired. Sign in again to reload the internal pricing guide." : "This internal pricing guide is available only to signed-in team members."}>
      <Badges />
      <button type="button" onClick={login} data-testid="button-pricing-login"
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D1F470] px-5 py-2.5 text-sm font-semibold text-[#11110D] transition hover:bg-[#c3ea55]">
        Sign in to continue <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </PageHero>
  );
}

function Skeleton() {
  return (
    <div className="hero-content mx-auto max-w-7xl animate-pulse space-y-5 px-5 py-12 md:px-8 motion-reduce:animate-none" aria-busy="true" aria-label="Loading pricing guide" data-testid="status-pricing-loading">
      <div className="h-6 w-72 rounded-lg bg-[#e3e5dc]" />
      <div className="grid gap-4 lg:grid-cols-3"><div className="h-80 rounded-3xl bg-[#ebece5]" /><div className="h-80 rounded-3xl bg-[#ebece5]" /><div className="h-80 rounded-3xl bg-[#ebece5]" /></div>
    </div>
  );
}

export default function Pricing() {
  useMeta();
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const q = useGetPricingGuide({
    query: {
      queryKey: getGetPricingGuideQueryKey(),
      enabled: isAuthenticated,
      gcTime: 0,
      staleTime: 0,
      refetchOnWindowFocus: true,
      retry: (count, err) => (err as { status?: number })?.status !== 401 && count < 1,
    },
  });

  if (authLoading) return <div className="min-h-[60dvh] bg-[#F5F5F2] pt-20"><Skeleton /></div>;
  if (!isAuthenticated) return <SignIn login={login} />;
  if ((q.error as { status?: number } | null)?.status === 401) return <SignIn login={login} expired />;

  const data = q.isError ? undefined : q.data;

  return (
    <div className="bg-[#F5F5F2]">
      <PageHero eyebrow="Commercial motions · Internal" title="Pricing"
        lede="Internal U.S. pricing guidance for Zendesk Contact Center. The final quote and agreement govern.">
        <Badges />
        {data && (
          <nav aria-label="Pricing methods" className="flex flex-wrap gap-2">
            {data.methods.map((m) => (
              <a key={m.id} href={`#${m.id}`} data-testid={`link-pricing-${m.id}`}
                className="mono rounded-full border border-[#D1F470]/35 px-3.5 py-1.5 text-xs text-[#F5F5F2] transition-colors hover:bg-[#D1F470] hover:text-[#11110D]">
                {visuals[m.id]?.num ?? "--"} · {m.name}
              </a>
            ))}
          </nav>
        )}
      </PageHero>

      {q.isLoading || (q.isFetching && !data && !q.isError) ? <Skeleton /> : q.isError || !data ? (
        <div className="hero-content mx-auto max-w-3xl px-5 py-16 md:px-8" role="alert">
          <div className="rounded-3xl border border-[#11110D]/10 bg-[#FBFBF8] p-8">
            <div className="flex items-center gap-3"><AlertTriangle className="h-6 w-6 text-[#9a4b2a]" aria-hidden /><StateArt kind="error" /></div>
            <h2 className="mt-3 text-xl font-semibold text-[#11110D]">The pricing guide could not be loaded.</h2>
            <p className="mt-2 text-sm text-[#11110D]/65">Check your connection and try again.</p>
            <button type="button" onClick={() => q.refetch()} data-testid="button-pricing-retry"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#203524] px-5 py-2.5 text-sm font-semibold text-[#D1F470]">
              <RotateCw className="h-4 w-4" aria-hidden /> Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="hero-content mx-auto max-w-7xl space-y-12 px-5 py-10 md:px-8 md:py-14" data-testid="content-pricing">
          <div className="grid gap-4 md:grid-cols-12">
            <p className="text-base leading-relaxed text-[#11110D]/80 md:col-span-7" data-testid="text-pricing-intro">{data.intro}</p>
            <p className="rounded-2xl bg-[#e9f1cf] p-4 text-sm leading-relaxed text-[#203524] md:col-span-5" data-testid="text-pricing-billing">
              <span className="eyebrow mb-1 block">Internal U.S. guidance · final quote governs</span>{data.billing}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:items-stretch">
            {data.methods.map((m, i) => {
              const v = visuals[m.id] ?? { num: String(i + 1).padStart(2, "0"), icon: Layers };
              const Icon = v.icon;
              return (
                <Reveal key={m.id} delay={i * 0.06} className="h-full">
                  <section id={m.id} aria-labelledby={`${m.id}-title`} data-testid={`section-pricing-${m.id}`}
                    className="zart-host pz-card group relative flex h-full scroll-mt-24 flex-col rounded-[1.25rem] border border-[#11110D]/10 bg-[#FFFFFF] p-3 text-[#11110D]">
                    <div className="pz-art relative grid h-40 place-items-center overflow-hidden rounded-[0.9rem] border border-[#11110D]/[0.06] bg-[#F5F5F2]" aria-hidden>
                      <div className="pz-glow absolute inset-x-8 bottom-0 h-24 rounded-full bg-[#D1F470]/50 blur-2xl" />
                      <span className="mono absolute left-3 top-3 text-[0.68rem] font-semibold text-[#203524]/55">{v.num}</span>
                      <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-[#203524] text-[#D1F470]"><Icon className="h-4 w-4" /></span>
                      <div className="pointer-events-none relative"><LaneArt id={m.id} /></div>
                    </div>
                    <div className="flex flex-1 flex-col px-3 pb-3 pt-5">
                      <div className="eyebrow text-[#203524]/75">{m.tag}</div>
                      <div className="mt-2 flex items-start justify-between gap-3">
                        <h2 id={`${m.id}-title`} className="min-w-0 min-h-[2.4em] text-[1.35rem] font-semibold leading-[1.15] tracking-tight" data-testid={`text-pricing-name-${m.id}`}>{m.name}</h2>
                        <SectionLink id={m.id} label={m.name} />
                      </div>
                      <span className="mono mt-2 inline-flex w-fit rounded-full bg-[#F5F5F2] px-3 py-1 text-[0.68rem] uppercase tracking-wider text-[#203524]" data-testid={`text-pricing-fit-${m.id}`}>{m.fit}</span>
                      <div className="mt-5 border-t border-[#11110D]/10 pt-5">
                        <p className="min-h-[2.1em] break-words text-3xl font-semibold leading-[1.05] tracking-tight" data-testid={`text-pricing-price-${m.id}`}>{m.price}</p>
                        <p className="mono mt-2 min-h-[2.7em] text-xs text-[#11110D]/65" data-testid={`text-pricing-unit-${m.id}`}>{m.unit}</p>
                      </div>
                      <p className="mt-4 text-[0.95rem] leading-relaxed text-[#11110D]/72" data-testid={`text-pricing-summary-${m.id}`}>{m.summary}</p>
                      <ul className="mt-5 space-y-2 border-t border-[#11110D]/10 pt-5">
                        {m.details.map((d, j) => (
                          <li key={j} className="flex gap-2.5 text-sm leading-snug text-[#11110D]/85" data-testid={`text-pricing-detail-${m.id}-${j}`}>
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#203524]" aria-hidden /><span>{d}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto pt-6">
                        <a href="https://www.zendesk.com/pricing/contact-center/" target="_blank" rel="noopener noreferrer" data-testid={`link-pricing-cta-${m.id}`}
                          className="pz-cta inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D1F470] px-5 py-2.5 text-sm font-semibold text-[#11110D]">
                          View Zendesk pricing<ArrowUpRight className="pz-cta-icon h-4 w-4" aria-hidden /><span className="sr-only">(opens in a new tab)</span>
                        </a>
                      </div>
                    </div>
                  </section>
                </Reveal>
              );
            })}
          </div>

          <section aria-labelledby="costs-title">
            <div className="eyebrow mb-2 text-[#203524]">Cost components</div>
            <h2 id="costs-title" className="mb-5 text-2xl font-semibold tracking-tight text-[#11110D]">What the quote is made of</h2>
            <div className="overflow-x-auto rounded-2xl border border-[#11110D]/10 bg-[#FBFBF8]">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="eyebrow text-[#11110D]/55"><tr><th scope="col" className="px-5 py-3">Item</th><th scope="col" className="px-5 py-3">Price</th><th scope="col" className="px-5 py-3">Covers</th></tr></thead>
                <tbody>
                  {data.costs.map((c, i) => (
                    <tr key={i} className="border-t border-[#11110D]/10 align-top" data-testid={`row-pricing-cost-${i}`}>
                      <th scope="row" className="px-5 py-3.5 font-semibold text-[#11110D]">{c.item}</th>
                      <td className="mono whitespace-nowrap px-5 py-3.5 text-[#203524]">{c.price}</td>
                      <td className="px-5 py-3.5 leading-relaxed text-[#11110D]/70">{c.covers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="notes-title">
            <div className="eyebrow mb-2 text-[#203524]">Billing notes</div>
            <h2 id="notes-title" className="mb-5 text-2xl font-semibold tracking-tight text-[#11110D]">Terms to confirm</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {data.notes.map((n, i) => (
                <div key={i} className="rounded-2xl border border-[#11110D]/10 bg-[#FBFBF8] p-5" data-testid={`card-pricing-note-${i}`}>
                  <h3 className="font-semibold text-[#11110D]">{n.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#11110D]/70">{n.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section aria-labelledby="sources-title">
            <div className="eyebrow mb-2 text-[#203524]">Sources</div>
            <h2 id="sources-title" className="mb-5 text-2xl font-semibold tracking-tight text-[#11110D]">Where this comes from</h2>
            <ol className="space-y-3">
              {data.sources.map((s, i) => (
                <li key={i} className="flex gap-3 rounded-2xl border border-[#11110D]/10 bg-[#FBFBF8] p-4" data-testid={`item-pricing-source-${i}`}>
                  <span className="mono mt-0.5 text-xs font-semibold text-[#203524]">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={s.url} target="_blank" rel="noopener noreferrer" data-testid={`link-pricing-source-${i}`}
                        className="group inline-flex items-center gap-1.5 break-words font-semibold text-[#11110D] underline decoration-[#203524]/30 underline-offset-4 hover:decoration-[#203524]">
                        {s.title}<ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden /><span className="sr-only">(opens in a new tab)</span>
                      </a>
                      {s.internal && <span className="mono inline-flex items-center gap-1 rounded-full bg-[#203524] px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-[#D1F470]"><Lock className="h-3 w-3" aria-hidden />Internal · permissions apply</span>}
                    </div>
                    <p className="mt-1 text-sm text-[#11110D]/65">{s.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <p className="border-l-2 border-[#203524]/30 pl-4 text-xs leading-relaxed text-[#11110D]/60" data-testid="text-pricing-disclaimer">
            Internal only. This is internal U.S. pricing guidance; the final quote and signed agreement govern. Confirm current packaging, availability, and commercial terms with Zendesk before sharing anything with customers.
          </p>
        </div>
      )}
    </div>
  );
}
