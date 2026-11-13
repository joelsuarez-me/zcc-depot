import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ApiError, PublicScenarioId, createUseCaseShortlist, deleteUseCaseShortlist,
  getUseCaseShortlist, getListUseCaseShortlistsQueryKey, updateUseCaseShortlist,
  useListUseCaseShortlists, type UseCaseShortlist, type UseCaseShortlistInput,
} from "@workspace/api-client-react";
import { PresenterGate } from "@/components/presenter";
import { useDepot } from "@/lib/depot-mode";
import { useUnsavedShortlist } from "@/lib/unsaved-shortlist";
import { USE_CASES } from "@/data/verticals";

type Props = { selectedId?: string; onOpen: (id: string) => void };
const EMPTY: UseCaseShortlistInput = { name: "", customer: "", notes: "", scenarioIds: [] };
function fields(row: UseCaseShortlist): UseCaseShortlistInput {
  return { name: row.name, customer: row.customer, notes: row.notes, scenarioIds: [...row.scenarioIds] };
}
const same = (a: UseCaseShortlistInput, b: UseCaseShortlistInput) => JSON.stringify(a) === JSON.stringify(b);
const isScenarioId = (id: string): id is PublicScenarioId => Object.hasOwn(PublicScenarioId, id);

export function UseCaseShortlists(props: Props) {
  const { auth, isPresenter } = useDepot();
  const editor = <PresenterGate title="Shared customer shortlists"><ShortlistEditor key={auth.user?.id} {...props} /></PresenterGate>;
  return (
    <section id="shortlists" data-section-nav className="mb-6 rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5" aria-labelledby="shortlists-title">
      <h2 id="shortlists-title" className="mb-2 text-lg font-semibold">Customer shortlists <a href="#shortlists" aria-label="Link to customer shortlists" className="text-sm underline">#</a></h2>
      {isPresenter && auth.isAuthenticated ? editor : <details><summary className="cursor-pointer text-sm">Sign-in and Presenter mode required to save and reopen customer discussions</summary>{editor}</details>}
    </section>
  );
}

function ShortlistEditor({ selectedId, onOpen }: Props) {
  const qc = useQueryClient();
  const list = useListUseCaseShortlists({
    query: { queryKey: getListUseCaseShortlistsQueryKey(), staleTime: 0, retry: false },
  });
  const [saved, setSaved] = useState<UseCaseShortlist | null>(null);
  const [draft, setDraft] = useState<UseCaseShortlistInput>({ ...EMPTY, scenarioIds: [] });
  const [picker, setPicker] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const dirty = !same(draft, saved ? fields(saved) : EMPTY);
  useUnsavedShortlist(dirty, busy);

  const mayDiscard = () => !dirty || window.confirm("This shortlist has unsaved changes. Discard them and continue?");
  const install = (row: UseCaseShortlist | null) => {
    setSaved(row); setDraft(row ? fields(row) : { ...EMPTY, scenarioIds: [] });
    setPicker(row?.id ?? ""); setError(""); setMessage("");
  };
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError(""); setMessage("");
    try { await action(); }
    catch (err) { setError(err instanceof Error ? err.message : "The request failed. Your edits are unchanged; please retry."); }
    finally { setBusy(false); }
  };
  const refresh = () => { void qc.invalidateQueries({ queryKey: getListUseCaseShortlistsQueryKey() }); };
  const open = () => {
    if (!picker || !mayDiscard()) return;
    void run(async () => { install(await getUseCaseShortlist(picker)); setMessage("Shortlist opened."); });
  };
  const save = (asNew = false) => {
    void run(async () => {
      const row = saved && !asNew
        ? await updateUseCaseShortlist(saved.id, { ...draft, revision: saved.revision })
        : await createUseCaseShortlist(draft);
      install(row); refresh(); setMessage("Shortlist saved.");
    });
  };
  const remove = () => {
    if (!saved || !window.confirm(`Delete “${saved.name}” for all signed-in Presenters?${dirty ? " Your unsaved edits will also be discarded." : ""} This cannot be undone.`)) return;
    void run(async () => {
      await deleteUseCaseShortlist(saved.id, { revision: saved.revision });
      install(null); refresh(); setMessage("Shortlist deleted.");
    });
  };
  // An expired/revoked session must not leave the library visible.
  if (list.error instanceof ApiError && [401, 403].includes(list.error.status)) {
    return <p role="alert">Your Presenter session is no longer available. Sign in again or switch back to Presenter mode to reopen your saved shortlists.</p>;
  }
  const canSave = draft.name.trim() && draft.customer.trim() && draft.scenarioIds.length > 0;
  const selected = selectedId && isScenarioId(selectedId) ? selectedId : undefined;
  const alreadyAdded = selected ? draft.scenarioIds.includes(selected) : false;
  const inputClass = "w-full rounded-lg border border-[var(--line)] bg-white p-2 text-sm";

  return (
    <div data-testid="shortlist-editor">
      <p className="mb-3 text-sm text-[#11110D]/65">Shared with all signed-in Presenter users, not private to your account. Customer names and notes never appear in the public scenario library or full-screen scenario presentation.</p>
      <fieldset disabled={busy} className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-0 flex-1 text-sm">Saved shortlists
            <select value={picker} onChange={e => setPicker(e.target.value)} className={inputClass} data-testid="select-shortlist">
              <option value="">{list.isLoading ? "Loading shortlists…" : "Choose a saved shortlist"}</option>
              {list.data?.map(row => <option key={row.id} value={row.id}>{row.customer} · {row.name}</option>)}
            </select>
          </label>
          <button type="button" className="depot-btn depot-btn-ink" disabled={!picker} onClick={open}>Open shortlist</button>
          <button type="button" className="depot-btn depot-btn-ghost" onClick={() => { if (mayDiscard()) install(null); }}>New shortlist</button>
        </div>
        {list.isError && <p role="alert" className="text-sm">Could not load the shared library. <button type="button" className="underline" onClick={() => void list.refetch()}>Retry library</button></p>}
        {!list.isLoading && !list.isError && list.data?.length === 0 && <p className="text-sm">No saved shortlists yet. Name one and add scenarios below.</p>}
        <form onSubmit={e => { e.preventDefault(); if (canSave) save(); }} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Shortlist name<input required maxLength={160} className={inputClass} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} data-testid="input-shortlist-name" /></label>
            <label className="text-sm">Customer<input required maxLength={200} className={inputClass} value={draft.customer} onChange={e => setDraft({ ...draft, customer: e.target.value })} data-testid="input-shortlist-customer" /></label>
          </div>
          <label className="block text-sm">Discussion notes<textarea maxLength={10000} rows={2} className={inputClass} value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} data-testid="input-shortlist-notes" /></label>
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm">{draft.scenarioIds.length} scenarios selected</strong>
            <button type="button" className="depot-btn depot-btn-ghost" disabled={!selected || alreadyAdded} onClick={() => {
              if (selected && !alreadyAdded) setDraft({ ...draft, scenarioIds: [...draft.scenarioIds, selected] });
            }} data-testid="button-shortlist-add">{alreadyAdded ? "Current scenario added" : "Add current scenario"}</button>
            <span className="text-xs text-[#11110D]/60">Browse and filter below without changing your selection.</span>
          </div>
          {selected && <p className="text-xs text-[#11110D]/65">Current scenario: {USE_CASES.find(item => item.id === selected)?.title}</p>}
          <ol className="space-y-1" aria-label="Shortlisted scenarios">
            {draft.scenarioIds.map(id => (
              <li key={id} className="flex items-center justify-between gap-2 rounded-lg bg-[#F5F5F2] p-2 text-sm">
                <button type="button" className="text-left underline" onClick={() => onOpen(id)}>{USE_CASES.find(item => item.id === id)?.title ?? `Unavailable scenario: ${id}`}</button>
                <button type="button" className="shrink-0 underline" aria-label={`Remove ${USE_CASES.find(item => item.id === id)?.title ?? id}`} onClick={() => setDraft({ ...draft, scenarioIds: draft.scenarioIds.filter(item => item !== id) })}>Remove</button>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className="depot-btn depot-btn-ink" disabled={!canSave || !dirty}>{saved ? "Save changes" : "Save shortlist"}</button>
            {saved && <button type="button" className="depot-btn depot-btn-ghost" disabled={!canSave} onClick={() => save(true)}>Save as new shortlist</button>}
            <button type="button" className="depot-btn depot-btn-ghost" disabled={!dirty} onClick={() => { if (mayDiscard()) install(saved); }}>Discard changes</button>
            {saved && <button type="button" className="depot-btn depot-btn-ghost" onClick={remove}>Delete shortlist</button>}
            <span className="text-xs" role="status">{busy ? "Working…" : dirty ? "Unsaved changes" : saved ? "All changes saved" : "New shortlist"}</span>
          </div>
        </form>
      </fieldset>
      {message && <p role="status" className="mt-3 text-sm">{message}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
    </div>
  );
}
