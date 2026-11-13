import { useCallback, useEffect, useRef, useState } from "react";
import {
  listResearchReports, getSavedResearchReport, saveResearchReport, convertResearchReportToAgenda,
  type ResearchCompany, type ResearchReport, type ResearchReportInput,
  type SavedResearchReport, type SavedResearchSummary,
} from "@workspace/api-client-react";

export type ResearchSnapshot = { fields: ResearchReportInput; company: ResearchCompany | null; report: ResearchReport };
function errorText(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "status" in error && error.status === 401) return "Your session expired. Sign in again to access saved research.";
  if (error && typeof error === "object" && "data" in error) {
    const data = error.data as { error?: unknown } | null;
    if (typeof data?.error === "string") return data.error;
  }
  return fallback;
}
function recordUrl(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("report", id);
  window.history.replaceState(null, "", url);
}

export function useResearchLibrary({ userId, current, onOpen }: {
  userId: string | null; current: ResearchSnapshot | null; onOpen: (record: SavedResearchReport) => void;
}) {
  const [items, setItems] = useState<SavedResearchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [action, setAction] = useState<"idle" | "saving" | "opening" | "converting">("idle");
  const [saved, setSaved] = useState<SavedResearchReport | null>(null);
  const owner = useRef(userId); owner.current = userId;
  const latest = useRef(current); latest.current = current;
  const savedRef = useRef<SavedResearchReport | null>(null);
  const savedReportRef = useRef<ResearchReport | null>(null);
  const keys = useRef(new WeakMap<ResearchReport, string>());
  const working = useRef(false);
  const listSeq = useRef(0);
  const lifetime = useRef(new AbortController());
  const initialId = useRef(new URLSearchParams(window.location.search).get("report"));

  useEffect(() => {
    lifetime.current = new AbortController();
    setItems([]); setSaved(null); savedRef.current = null; savedReportRef.current = null;
    setError(""); setNotice("");
    return () => lifetime.current.abort();
  }, [userId]);

  useEffect(() => {
    if (current?.report !== savedReportRef.current) {
      if (savedReportRef.current) {
        const url = new URL(window.location.href);
        url.searchParams.delete("report");
        window.history.replaceState(null, "", url);
        savedReportRef.current = null;
      }
      savedRef.current = null; setSaved(null); setNotice(""); setError("");
    }
  }, [current?.report]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const seq = ++listSeq.current;
    setLoading(true); setListError("");
    try {
      const data = await listResearchReports({ signal: lifetime.current.signal });
      if (owner.current === userId && seq === listSeq.current) setItems(data);
    } catch (err) {
      if (!lifetime.current.signal.aborted && owner.current === userId && seq === listSeq.current) {
        setListError(errorText(err, "Saved reports could not be loaded. Please retry."));
      }
    } finally { if (seq === listSeq.current) setLoading(false); }
  }, [userId]);
  useEffect(() => { void refresh(); }, [refresh]);

  const remember = useCallback((record: SavedResearchReport, report: ResearchReport) => {
    savedRef.current = record; savedReportRef.current = report; setSaved(record); recordUrl(record.id);
  }, []);

  const open = useCallback(async (id: string) => {
    if (!userId || working.current) return;
    if (latest.current && !savedRef.current &&
        !window.confirm("The current report has not been saved. Open another report and discard this on-screen copy?")) return;
    working.current = true; setAction("opening"); setError(""); setNotice("");
    const signal = lifetime.current.signal;
    try {
      const record = await getSavedResearchReport(id, { signal });
      if (signal.aborted || owner.current !== userId) return;
      remember(record, record.report); onOpen(record);
      setNotice(record.logoNote || `Opened saved research for ${record.fields.companyName}. No research was rerun.`);
    } catch (err) {
      if (!signal.aborted && owner.current === userId) setError(errorText(err, "This saved report could not be opened. Please retry."));
    } finally { working.current = false; setAction("idle"); }
  }, [userId, remember, onOpen]);

  useEffect(() => {
    if (!userId || !initialId.current) return;
    const id = initialId.current;
    if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) { setError("The saved report link is invalid."); return; }
    // Deferring also avoids consuming a direct link during StrictMode's setup/cleanup rehearsal.
    const timer = window.setTimeout(() => { initialId.current = null; void open(id); }, 0);
    return () => window.clearTimeout(timer);
  }, [userId, open]);

  async function ensureSaved(context: ResearchSnapshot, signal: AbortSignal) {
    if (savedRef.current && savedReportRef.current === context.report) return savedRef.current;
    let key = keys.current.get(context.report);
    if (!key) { key = crypto.randomUUID(); keys.current.set(context.report, key); }
    const record = await saveResearchReport({
      saveKey: key, fields: context.fields, report: context.report, logoUrl: context.company?.logoUrl ?? null,
    }, { signal });
    if (!signal.aborted && latest.current?.report === context.report) remember(record, context.report);
    return record;
  }

  async function persist(convert: boolean) {
    const context = latest.current;
    if (!userId || !context || working.current) return;
    working.current = true; setAction(convert ? "converting" : "saving"); setError(""); setNotice("");
    const signal = lifetime.current.signal;
    try {
      const record = await ensureSaved(context, signal);
      if (signal.aborted || owner.current !== userId) return;
      if (convert) {
        const agenda = await convertResearchReportToAgenda(record.id, { signal });
        if (signal.aborted || owner.current !== userId) return;
        if (latest.current?.report === context.report) {
          window.location.assign(`${import.meta.env.BASE_URL}agenda?agenda=${encodeURIComponent(agenda.id)}`);
        } else {
          setNotice(`An editable agenda was created for ${record.fields.companyName}. Open it from the saved research library.`);
        }
      } else {
        setNotice(record.logoNote || `Saved ${record.fields.companyName} to the shared research library.`);
      }
      await refresh();
    } catch (err) {
      if (!signal.aborted && owner.current === userId) setError(errorText(err, convert
        ? "The agenda could not be created. The report is unchanged; please retry."
        : "The report could not be saved. Your on-screen report is unchanged; please retry."));
    } finally { working.current = false; setAction("idle"); }
  }

  return { items, loading, listError, error, notice, action, saved, hasReport: !!current,
    refresh, open, save: () => persist(false), convert: () => persist(true) };
}
export type ResearchLibraryController = ReturnType<typeof useResearchLibrary>;
