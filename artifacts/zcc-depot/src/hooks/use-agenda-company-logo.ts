import { useEffect, useRef, useState } from "react";
import { authorizeUploadedObject, requestUploadUrl, resolveResearchCompany } from "@workspace/api-client-react";
import { companyLogoKey, findAgendaCompanyLogo } from "@/lib/agenda-company-logo";

type State = { key: string; kind: "idle" | "waiting" | "looking" | "uploading" | "added" | "missing" | "error"; message: string };
type Options = { company: string; logoPath: string | null; scope: string; enabled: boolean; onApply: (path: string | null) => void };

async function storeLogo(file: File, signal: AbortSignal) {
  const upload = await requestUploadUrl({
    name: file.name, size: file.size, contentType: file.type as "image/png" | "image/jpeg" | "image/webp",
  }, { signal });
  signal.throwIfAborted();
  const response = await fetch(upload.uploadURL, { method: "PUT", headers: { "Content-Type": file.type }, body: file, signal });
  if (!response.ok) throw new Error("The logo upload did not complete. Please try again.");
  signal.throwIfAborted();
  const authorized = await authorizeUploadedObject({ objectPath: upload.objectPath }, { signal });
  signal.throwIfAborted();
  return authorized.objectPath;
}

export function useAgendaCompanyLogo({ company, logoPath, scope, enabled, onApply }: Options) {
  const key = `${scope}:${companyLogoKey(company)}`;
  const current = useRef({ key, enabled, onApply });
  current.current = { key, enabled, onApply };
  const controller = useRef<AbortController | null>(null);
  const blocked = useRef<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<State>({ key, kind: "idle", message: "" });
  const validName = company.trim().length >= 2 && company.trim().length <= 120;
  const isCurrent = (requestKey: string, signal: AbortSignal) =>
    !signal.aborted && current.current.enabled && current.current.key === requestKey;

  useEffect(() => () => controller.current?.abort(), [key, enabled]);

  useEffect(() => {
    if (!enabled || !validName || logoPath || blocked.current === key) return;
    const request = new AbortController();
    controller.current = request;
    setState({ key, kind: "waiting", message: "Finding the company logo…" });
    const timer = setTimeout(async () => {
      setState({ key, kind: "looking", message: "Finding and adding the company logo…" });
      try {
        const path = await findAgendaCompanyLogo(company, request.signal, {
          resolve: (name, signal) => resolveResearchCompany({ companyName: name }, { signal }),
          download: async (url, signal) => {
            const response = await fetch(url, { credentials: "include", signal });
            if (!response.ok) throw new Error("The company logo could not be downloaded.");
            return response.blob();
          },
          store: storeLogo,
        });
        if (!isCurrent(key, request.signal)) return;
        if (path) current.current.onApply(path);
        setState({ key, kind: path ? "added" : "missing", message: path
          ? "Company logo added automatically. Save the agenda to keep it."
          : "No company logo was found. You can upload one or retry the lookup." });
      } catch (error) {
        if (!isCurrent(key, request.signal)) return;
        const limited = (error as { status?: number })?.status === 429;
        setState({ key, kind: "error", message: limited
          ? "The company lookup limit was reached. You can still upload a logo manually."
          : "Automatic company logo lookup could not be completed. Upload a logo manually or retry." });
      }
    }, 1100);
    return () => { clearTimeout(timer); request.abort(); };
  }, [key, enabled, validName, logoPath, retry]);

  function cancel() {
    blocked.current = key;
    controller.current?.abort();
    setState({ key, kind: "idle", message: "" });
  }

  async function upload(file: File) {
    cancel();
    const request = new AbortController();
    controller.current = request;
    setState({ key, kind: "uploading", message: "Uploading the customer logo…" });
    try {
      const path = await storeLogo(file, request.signal);
      if (!isCurrent(key, request.signal)) return;
      current.current.onApply(path);
      setState({ key, kind: "added", message: "Customer logo uploaded. Save the agenda to keep it." });
    } catch (error) {
      if (!isCurrent(key, request.signal)) return;
      setState({ key, kind: "error", message: error instanceof Error ? error.message : "The logo could not be uploaded." });
    }
  }

  const visible = state.key === key && enabled ? state : { key, kind: "idle" as const, message: "" };
  return {
    ...visible,
    busy: ["waiting", "looking", "uploading"].includes(visible.kind),
    manualUploading: visible.kind === "uploading",
    canRetry: enabled && validName,
    cancel,
    upload,
    remove() { cancel(); current.current.onApply(null); },
    retry() { blocked.current = null; setRetry(value => value + 1); },
  };
}
