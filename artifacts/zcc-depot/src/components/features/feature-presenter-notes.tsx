import { useDepot } from "@/lib/depot-mode";
import { usePresenterContent } from "@/hooks/use-presenter-content";
import { PresenterGate } from "@/components/presenter";

const GROUPS = [["technical", "Technical points"], ["discovery", "Discovery questions"], ["demonstration", "Demonstration tips"], ["objections", "Objections"], ["implementation", "Implementation"]] as const;

/** Renders nothing in Customer Mode. The fetching child only mounts for authenticated presenters. */
export function FeaturePresenterNotes({ featureId }: { featureId: string }) {
  const { isPresenter } = useDepot();
  if (!isPresenter) return null;
  return <PresenterGate title="Presenter guidance" detail="Feature guidance is served only to signed-in presenters."><Notes featureId={featureId} /></PresenterGate>;
}

function Notes({ featureId }: { featureId: string }) {
  const q = usePresenterContent();
  if (!q.enabled) return null;
  if (q.isLoading) return <div className="h-24 animate-pulse rounded-2xl bg-[#11110D]/8" aria-label="Loading presenter guidance" />;
  if (q.isError) return <div className="fx-panel text-sm" role="alert">Presenter guidance could not be loaded. <button type="button" className="underline" onClick={() => void q.refetch()} data-testid="button-retry-presenter-notes">Retry</button></div>;
  const g = q.data?.features?.find((x) => x.featureId === featureId);
  if (!q.data) return null;
  if (!g) return <div className="fx-panel text-sm text-[#11110D]/60">No presenter guidance has been written for this feature yet.</div>;
  return (
    <section className="rounded-2xl bg-[#11110D] p-4 text-[#F5F5F2]" data-testid="panel-presenter-notes">
      <div className="eyebrow mb-3 text-[#D1F470]">Presenter guidance - internal</div>
      <div className="grid gap-4 md:grid-cols-2">
        {GROUPS.map(([k, label]) => g[k].length > 0 && (
          <div key={k}><div className="mb-1 text-xs font-semibold text-[#D1F470]/80">{label}</div><ul className="list-disc space-y-1 pl-4 text-sm text-[#F5F5F2]/80">{g[k].map((x) => <li key={x}>{x}</li>)}</ul></div>
        ))}
      </div>
    </section>
  );
}
