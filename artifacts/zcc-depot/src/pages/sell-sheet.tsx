import { useEffect } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { useGetSellSheet, getGetSellSheetQueryKey } from "@workspace/api-client-react";
import { ArrowRight, Download, Lock, RotateCw, ShieldCheck, AlertTriangle } from "lucide-react";
import { PageHero } from "@/components/kit";

const TITLE = "Sell Sheet | ZCC Depot";
const DESC = "Signed-in internal sales guide for Zendesk Contact Center conversations. Internal use only.";

function useMeta() {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = TITLE;
    const meta = [
      ['meta[name="description"]', DESC],
      ['meta[property="og:title"]', TITLE],
      ['meta[property="og:description"]', DESC],
      ['meta[name="twitter:title"]', TITLE],
      ['meta[name="twitter:description"]', DESC],
    ].map(([sel, content]) => {
      const el = document.querySelector<HTMLMetaElement>(sel);
      const previous = el?.getAttribute("content") ?? "";
      el?.setAttribute("content", content);
      return { el, previous };
    });
    return () => {
      document.title = prevTitle;
      meta.forEach(({ el, previous }) => el?.setAttribute("content", previous));
    };
  }, []);
}

function Badges() {
  return (
    <div className="flex flex-wrap gap-2" data-testid="badges-access">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D1F470] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#11110D]">
        <Lock className="h-3.5 w-3.5" aria-hidden /> Internal only
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F5F5F2]/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#F5F5F2]">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Signed-in access
      </span>
    </div>
  );
}

function SignInPrompt({ login, expired }: { login: () => void; expired?: boolean }) {
  return (
    <PageHero eyebrow="ZCC Depot · Internal sales guide" title="Sell Sheet"
      lede={expired ? "Your session has expired. Sign in again to reload the internal guide." : "This internal guide is available only to signed-in team members."}>
      <Badges />
      <button type="button" onClick={login} data-testid="button-sellsheet-login"
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D1F470] px-5 py-2.5 text-sm font-semibold text-[#11110D] transition hover:bg-[#c3ea55]">
        Sign in to continue <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </PageHero>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-5 px-5 py-12 md:px-8 motion-reduce:animate-none" aria-busy="true" aria-label="Loading sell sheet">
      <div className="h-8 w-64 rounded-lg bg-[#e3e5dc]" />
      <div className="h-32 rounded-3xl bg-[#ebece5]" />
      <div className="grid gap-4 md:grid-cols-2"><div className="h-48 rounded-2xl bg-[#ebece5]" /><div className="h-48 rounded-2xl bg-[#ebece5]" /></div>
    </div>
  );
}

function Num({ n, label, title, id }: { n: number; label: string; title: string; id: string }) {
  return (
    <div className="mb-6" id={id}>
      <div className="eyebrow mb-2 flex items-center gap-3 text-[#203524]">
        <span className="rounded-full bg-[#203524] px-2 py-0.5 text-[#D1F470]">{String(n).padStart(2, "0")}</span>{label}
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-[#11110D] md:text-3xl">{title}</h2>
    </div>
  );
}

function List({ items, testId, marker = "dot" }: { items: string[]; testId: string; marker?: "dot" | "num" }) {
  if (!items.length) return <p className="text-sm text-[#11110D]/50">None supplied.</p>;
  const Tag = marker === "num" ? "ol" : "ul";
  return (
    <Tag className="space-y-2.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3 text-[0.95rem] leading-relaxed text-[#11110D]/80" data-testid={`${testId}-${i}`}>
          {marker === "num"
            ? <span className="mono mt-0.5 shrink-0 text-xs font-semibold text-[#203524]">{String(i + 1).padStart(2, "0")}</span>
            : <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#203524]" aria-hidden />}
          <span>{t}</span>
        </li>
      ))}
    </Tag>
  );
}

export default function SellSheetPage() {
  useMeta();
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const q = useGetSellSheet({
    query: {
      queryKey: getGetSellSheetQueryKey(),
      enabled: isAuthenticated,
      gcTime: 0,
      staleTime: 0,
      refetchOnWindowFocus: true,
      retry: (count, err) => (err as { status?: number })?.status !== 401 && count < 1,
    },
  });

  if (authLoading) return <div className="min-h-[70dvh] bg-[#F5F5F2] pt-24"><Skeleton /></div>;
  if (!isAuthenticated) return <SignInPrompt login={login} />;

  const status = (q.error as { status?: number } | null)?.status;
  if (status === 401) return <SignInPrompt login={login} expired />;

  const data = q.isError ? undefined : q.data;

  return (
    <div className="bg-[#F5F5F2]">
      <PageHero eyebrow="ZCC Depot · Internal sales guide" title="Sell Sheet"
        lede="Signed-in internal guide for preparing customer conversations. Do not share externally.">
        <Badges />
        {data && (
          <a href={data.pdfUrl} download data-testid="link-sellsheet-pdf"
            className="inline-flex items-center gap-2 rounded-full bg-[#F5F5F2] px-4 py-1.5 text-xs font-semibold text-[#203524] transition hover:bg-white/90">
            <Download className="h-3.5 w-3.5" aria-hidden /> Download source PDF
          </a>
        )}
      </PageHero>

      {q.isLoading || (q.isFetching && !data && !q.isError) ? <Skeleton /> : q.isError || !data ? (
        <div className="mx-auto max-w-3xl px-5 py-16 md:px-8" role="alert">
          <div className="rounded-3xl border border-[#11110D]/10 bg-[#FBFBF8] p-8">
            <AlertTriangle className="h-6 w-6 text-[#9a4b2a]" aria-hidden />
            <h2 className="mt-3 text-xl font-semibold text-[#11110D]">The sell sheet could not be loaded.</h2>
            <p className="mt-2 text-sm text-[#11110D]/65">Check your connection and try again.</p>
            <button type="button" onClick={() => q.refetch()} data-testid="button-sellsheet-retry"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#203524] px-5 py-2.5 text-sm font-semibold text-[#D1F470]">
              <RotateCw className="h-4 w-4" aria-hidden /> Retry
            </button>
          </div>
        </div>
      ) : (
        <article className="mx-auto max-w-5xl space-y-16 px-5 py-12 md:px-8 md:py-16" data-testid="content-sellsheet">
          <p className="mono text-xs uppercase tracking-wider text-[#11110D]/50" data-testid="text-sellsheet-title">{data.title}</p>

          <section aria-labelledby="sec-pitch">
            <Num n={1} label="Master pitch" title="Business challenge and pitch" id="sec-pitch" />
            <div className="rounded-3xl bg-[#203524] p-6 text-[#F5F5F2] md:p-8">
              <div className="eyebrow text-[#D1F470]">Business challenge</div>
              <p className="mt-3 text-lg leading-relaxed md:text-xl" data-testid="text-business-challenge">{data.businessChallenge}</p>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-[#11110D]/10 bg-[#FBFBF8] p-6">
                <h3 className="eyebrow mb-4 text-[#203524]">Customer pains</h3>
                <List items={data.pains} testId="text-pain" />
              </div>
              <div className="rounded-2xl border border-[#11110D]/10 bg-[#FBFBF8] p-6">
                <h3 className="eyebrow mb-4 text-[#203524]">The pitch</h3>
                <List items={data.pitch} testId="text-pitch" marker="num" />
              </div>
            </div>
          </section>

          {data.plays.map((p, i) => (
            <section key={i} aria-labelledby={`sec-play-${i}`}>
              <Num n={2 + i} label="Match challenge · capability · proof" title={p.title} id={`sec-play-${i}`} />
              <p className="mb-6 max-w-3xl text-base leading-relaxed text-[#11110D]/70" data-testid={`text-play-help-${i}`}>{p.help}</p>
              <div className="grid gap-5 lg:grid-cols-3">
                <div className="rounded-2xl border border-[#11110D]/10 bg-[#FBFBF8] p-6">
                  <h3 className="eyebrow mb-4 text-[#203524]">Capabilities</h3>
                  <List items={p.capabilities} testId={`text-play-${i}-capability`} />
                </div>
                <div className="rounded-2xl bg-[#e9f1cf] p-6">
                  <h3 className="eyebrow mb-1 text-[#203524]">ROI metrics</h3>
                  <p className="mb-4 text-xs text-[#11110D]/60">Source: supplied internal cheat sheet. Illustrative, not a guarantee.</p>
                  <List items={p.metrics} testId={`text-play-${i}-metric`} />
                </div>
                <div className="rounded-2xl border border-[#11110D]/10 bg-[#FBFBF8] p-6">
                  <h3 className="eyebrow mb-4 text-[#203524]">Proof stories</h3>
                  <List items={p.stories} testId={`text-play-${i}-story`} />
                </div>
              </div>
            </section>
          ))}

          {data.preparation.map((s, i) => (
            <section key={i} aria-labelledby={`sec-prep-${i}`}>
              <Num n={2 + data.plays.length + i} label="Research account · discovery" title={s.title} id={`sec-prep-${i}`} />
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-[#11110D]/10 bg-[#FBFBF8] p-6">
                  <h3 className="eyebrow mb-4 text-[#203524]">Steps</h3>
                  <List items={s.steps} testId={`text-prep-${i}-step`} marker="num" />
                </div>
                <div className="rounded-2xl border border-[#11110D]/10 bg-[#FBFBF8] p-6">
                  <h3 className="eyebrow mb-4 text-[#203524]">Discovery questions</h3>
                  <List items={s.questions} testId={`text-prep-${i}-question`} />
                </div>
              </div>
            </section>
          ))}

          <p className="border-l-2 border-[#203524]/30 pl-4 text-xs leading-relaxed text-[#11110D]/60" data-testid="text-validation-disclaimer">
            Internal only. ROI figures are attributed to the supplied internal cheat sheet and reflect specific customer contexts; they are not universal guarantees. Validate every figure, capability, and availability detail against current Zendesk documentation and the customer's own data before sharing.
          </p>
        </article>
      )}
    </div>
  );
}
