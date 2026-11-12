import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import {
  getGetAgendaQueryKey,
  getListAgendasQueryKey,
  useAuthorizeUploadedObject,
  useCreateAgenda,
  useDeleteAgenda,
  useGetAgenda,
  useListAgendas,
  useRequestUploadUrl,
  useUpdateAgenda,
  type Agenda,
  type AgendaInput,
} from "@workspace/api-client-react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  ImagePlus,
  LoaderCircle,
  LogOut,
  Plus,
  Presentation,
  Save,
  ShieldAlert,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { AGENDA_SECTIONS as sections, EMPTY_AGENDA as EMPTY, MORNINGSTAR_AGENDA, type AgendaFields } from "@/data/agenda-template";
import { AgendaDocument } from "@/components/agenda-document";
import { AgendaCardLogo } from "@/components/agenda-card-logo";

const TEXT_KEY = "zcc-depot:agenda:v1";
const LOGO_KEY = "zcc-depot:agenda-logo:v1";
const MAX_LOGO_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
function readInitialView() {
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("agenda");
  const id = requestedId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestedId) ? requestedId : null;
  return { id, library: params.get("view") === "library" };
}

function updateLocation(id: string | null, library = false) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("agenda", id);
  else url.searchParams.delete("agenda");
  if (library) url.searchParams.set("view", "library");
  else url.searchParams.delete("view");
  window.history.replaceState(window.history.state, "", url);
}

function protectedLogoUrl(path: string | null) {
  return path ? `/api/storage${path}` : "";
}

function displayDate(date?: string) {
  if (!date) return "Not yet saved";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "Recently updated"
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

function loadLegacy() {
  try {
    const text = localStorage.getItem(TEXT_KEY);
    const logo = localStorage.getItem(LOGO_KEY);
    const parsed = text ? JSON.parse(text) as Partial<AgendaFields> : {};
    return {
      available: text !== null || Boolean(logo),
      fields: {
        ...EMPTY,
        company: parsed.company ?? "",
        description: parsed.description ?? "",
        currentState: parsed.currentState ?? "",
        conversation: parsed.conversation ?? "",
        problems: parsed.problems ?? "",
        outcomes: parsed.outcomes ?? "",
      },
      logo,
    };
  } catch {
    return { available: false, fields: { ...EMPTY }, logo: null };
  }
}

function fileFromDataUrl(dataUrl: string): Promise<File> {
  return fetch(dataUrl).then(async (response) => {
    const blob = await response.blob();
    const type = ALLOWED_TYPES.includes(blob.type) ? blob.type : "image/webp";
    if (blob.size > MAX_LOGO_BYTES) throw new Error("The saved logo exceeds the 8 MB upload limit.");
    return new File([blob], "customer-logo.webp", { type });
  });
}

const fieldClass =
  "mt-2 block w-full rounded-xl border border-[#d5d8cd] bg-[#fffefa] px-4 py-3.5 text-[0.94rem] leading-relaxed text-[#17251e] placeholder:text-[#69756d]/60 shadow-[inset_0_1px_2px_rgba(23,37,30,.025)] transition focus:border-[#315a47] focus:outline-none focus:ring-4 focus:ring-[#315a47]/10";
const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#244b39] px-5 py-2.5 text-sm font-semibold text-[#f5f5eb] transition hover:bg-[#193b2c] disabled:cursor-not-allowed disabled:opacity-55";
const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#cbd1c5] bg-[#fffefa] px-5 py-2.5 text-sm font-semibold text-[#294735] transition hover:border-[#829589] hover:bg-[#f5f6ef] disabled:cursor-not-allowed disabled:opacity-55";

export default function Agenda() {
  const { user, isLoading: authLoading, isAuthenticated, login, logout } = useAuth();
  const queryClient = useQueryClient();
  const reducedMotion = useReducedMotion();
  const listQuery = useListAgendas({
    query: { enabled: isAuthenticated, queryKey: getListAgendasQueryKey() },
  });
  const [initialView] = useState(readInitialView);
  const [selectedId, setSelectedId] = useState<string | null>(initialView.id);
  const [creating, setCreating] = useState(!initialView.id);
  const [mode, setMode] = useState<"library" | "editor" | "presentation">(initialView.library ? "library" : "presentation");
  const [fields, setFields] = useState<AgendaFields>({ ...(initialView.id ? EMPTY : MORNINGSTAR_AGENDA) });
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [logoMessage, setLogoMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [legacy, setLegacy] = useState(loadLegacy);
  const [importing, setImporting] = useState(false);
  const initGuard = useRef<string | null>(null);

  const agendaQuery = useGetAgenda(selectedId ?? "", {
    query: {
      enabled: isAuthenticated && Boolean(selectedId),
      queryKey: getGetAgendaQueryKey(selectedId ?? ""),
    },
  });
  const createAgenda = useCreateAgenda();
  const updateAgenda = useUpdateAgenda();
  const deleteAgenda = useDeleteAgenda();
  const requestUpload = useRequestUploadUrl();
  const authorizeUpload = useAuthorizeUploadedObject();
  const activeAgenda = agendaQuery.data;

  useEffect(() => {
    if (!selectedId || !activeAgenda || initGuard.current === selectedId) return;
    initGuard.current = selectedId;
    setLoadedId(selectedId);
    setFields({
      company: activeAgenda.company ?? "",
      description: activeAgenda.description ?? "",
      currentState: activeAgenda.currentState ?? "",
      conversation: activeAgenda.conversation ?? "",
      problems: activeAgenda.problems ?? "",
      outcomes: activeAgenda.outcomes ?? "",
      logoPath: activeAgenda.logoPath ?? null,
    });
    setErrorMessage("");
  }, [activeAgenda, selectedId]);

  function openNew(template = false) {
    setSelectedId(null);
    setCreating(true);
    setLoadedId(null);
    initGuard.current = null;
    setFields({ ...(template ? MORNINGSTAR_AGENDA : EMPTY) });
    updateLocation(null);
    setErrorMessage("");
    setLogoMessage("");
    setMode(template ? "presentation" : "editor");
  }

  function openAgenda(id: string) {
    updateLocation(id);
    setSelectedId(id);
    setCreating(false);
    setLoadedId(null);
    initGuard.current = null;
    setErrorMessage("");
    setMode("editor");
  }

  function updateField<K extends keyof AgendaFields>(key: K, value: AgendaFields[K]) {
    setFields((previous) => ({ ...previous, [key]: value }));
  }

  async function uploadLogo(file: File) {
    setUploading(true);
    setLogoMessage("");
    try {
      const upload = await requestUpload.mutateAsync({
        data: { name: file.name, size: file.size, contentType: file.type as "image/png" | "image/jpeg" | "image/webp" },
      });
      const response = await fetch(upload.uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) throw new Error("The image upload did not complete. Please try again.");
      const authorized = await authorizeUpload.mutateAsync({ data: { objectPath: upload.objectPath } });
      updateField("logoPath", authorized.objectPath);
    } catch (error) {
      setLogoMessage(error instanceof Error ? error.message : "The logo could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  async function handleLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setLogoMessage("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoMessage("This image is over 8 MB. Choose a smaller image and try again.");
      return;
    }
    await uploadLogo(file);
  }

  function buildInput(): AgendaInput {
    return {
      company: fields.company.trim(),
      description: fields.description,
      currentState: fields.currentState,
      conversation: fields.conversation,
      problems: fields.problems,
      outcomes: fields.outcomes,
      logoPath: fields.logoPath,
    };
  }

  async function saveAgenda(event?: FormEvent) {
    event?.preventDefault();
    if (!fields.company.trim()) {
      setErrorMessage("Add a company name before saving this brief.");
      return;
    }
    setBusy(true);
    setErrorMessage("");
    try {
      let saved: Agenda;
      if (creating || !selectedId) {
        saved = await createAgenda.mutateAsync({ data: buildInput() });
      } else {
        saved = await updateAgenda.mutateAsync({ id: selectedId, data: buildInput() });
      }
      await queryClient.invalidateQueries({ queryKey: getListAgendasQueryKey() });
      queryClient.setQueryData(getGetAgendaQueryKey(saved.id), saved);
      setSelectedId(saved.id);
      updateLocation(saved.id);
      setCreating(false);
      setLoadedId(saved.id);
      initGuard.current = saved.id;
      setFields({
        company: saved.company,
        description: saved.description,
        currentState: saved.currentState,
        conversation: saved.conversation,
        problems: saved.problems,
        outcomes: saved.outcomes,
        logoPath: saved.logoPath,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Your changes could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function removeAgenda() {
    if (!selectedId) return;
    setBusy(true);
    setErrorMessage("");
    try {
      await deleteAgenda.mutateAsync({ id: selectedId });
      await queryClient.invalidateQueries({ queryKey: getListAgendasQueryKey() });
      queryClient.removeQueries({ queryKey: getGetAgendaQueryKey(selectedId) });
      setSelectedId(null);
      setCreating(false);
      setLoadedId(null);
      setFields({ ...EMPTY });
      setConfirmDelete(false);
      setMode("library");
      updateLocation(null, true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "This agenda could not be deleted. Please try again.");
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }

  async function importLegacy() {
    setImporting(true);
    setErrorMessage("");
    try {
      let logoPath: string | null = null;
      if (legacy.logo) {
        const file = await fileFromDataUrl(legacy.logo);
        const upload = await requestUpload.mutateAsync({
          data: {
            name: file.name,
            size: file.size,
            contentType: file.type as "image/png" | "image/jpeg" | "image/webp",
          },
        });
        const uploaded = await fetch(upload.uploadURL, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!uploaded.ok) throw new Error("The saved logo could not be transferred. Your local draft is still available.");
        const authorized = await authorizeUpload.mutateAsync({ data: { objectPath: upload.objectPath } });
        logoPath = authorized.objectPath;
      }
      const input: AgendaInput = {
        ...legacy.fields,
        company: legacy.fields.company.trim(),
        logoPath,
      };
      if (!input.company) throw new Error("Add a company name to the saved browser draft before importing it.");
      const saved = await createAgenda.mutateAsync({ data: input });
      await queryClient.invalidateQueries({ queryKey: getListAgendasQueryKey() });
      queryClient.setQueryData(getGetAgendaQueryKey(saved.id), saved);
      localStorage.removeItem(TEXT_KEY);
      localStorage.removeItem(LOGO_KEY);
      setLegacy({ available: false, fields: { ...EMPTY }, logo: null });
      setSelectedId(saved.id);
      updateLocation(saved.id);
      setCreating(false);
      setLoadedId(saved.id);
      initGuard.current = saved.id;
      setFields({
        company: saved.company,
        description: saved.description,
        currentState: saved.currentState,
        conversation: saved.conversation,
        problems: saved.problems,
        outcomes: saved.outcomes,
        logoPath: saved.logoPath,
      });
      setMode("editor");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The saved browser draft could not be imported.");
    } finally {
      setImporting(false);
    }
  }

  function cancelEditor() {
    setMode("library");
    // Clear the selection so reopening the same cached agenda triggers hydration.
    setSelectedId(null);
    setLoadedId(null);
    initGuard.current = null;
    setCreating(false);
    updateLocation(null, true);
    setErrorMessage("");
  }

  const list = listQuery.data ?? [];
  const queryBusy = Boolean(selectedId) && !agendaQuery.isError && (agendaQuery.isLoading || loadedId !== selectedId);

  if (authLoading) {
    return (
      <div className="min-h-[70dvh] bg-[#f1f2eb] px-5 pb-20 pt-28 md:px-8">
        <div className="mx-auto max-w-6xl animate-pulse space-y-5">
          <div className="h-9 w-52 rounded-lg bg-[#dfe3d8]" />
          <div className="h-28 rounded-3xl bg-[#e7e9e0]" />
          <div className="grid gap-4 md:grid-cols-2"><div className="h-40 rounded-2xl bg-[#e7e9e0]" /><div className="h-40 rounded-2xl bg-[#e7e9e0]" /></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[75dvh] bg-[#f1f2eb] px-5 pb-20 pt-28 md:px-8">
        <div className="mx-auto max-w-6xl">
          <section className="relative overflow-hidden rounded-[2rem] bg-[#244b39] px-6 py-12 text-[#f5f5eb] md:px-14 md:py-16">
            <div className="grid-lines absolute inset-0 opacity-50" aria-hidden />
            <div className="relative max-w-2xl">
              <div className="eyebrow text-[#d4e4a6]">ZCC Depot · Workshop workspace</div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">Today’s Agenda</h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#f5f5eb]/75">
                A shared, reusable conversation brief for Zendesk platform architects and the customers they work alongside.
              </p>
              <button type="button" onClick={login} data-testid="button-agenda-login" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#dce8bb] px-6 py-3 text-sm font-semibold text-[#203d2e] transition hover:bg-[#edf3dc]">
                Sign in to continue <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              <p className="mt-5 max-w-xl text-xs leading-relaxed text-[#f5f5eb]/55">Sign-in uses the portal’s secure identity provider. No separate account or password form is needed here.</p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="agenda-page min-h-[75dvh] bg-[#f1f2eb] pb-20">
      <header className="relative overflow-hidden bg-[#244b39] px-5 pb-9 pt-28 text-[#f6f5ec] md:px-8 md:pb-12 md:pt-32">
        <div className="grid-lines absolute inset-0 opacity-50" aria-hidden />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="eyebrow flex items-center gap-3 text-[#d4e4a6]"><span className="h-px w-8 bg-[#d4e4a6]" />Customer workshop · Conversation brief</div>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-[#f6f5ec]/65 sm:inline">{user?.email ?? "Signed in"}</span>
              <button type="button" onClick={logout} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/20 px-3.5 text-xs font-semibold text-white/85 transition hover:bg-white/10" data-testid="button-agenda-logout">
                <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
              </button>
            </div>
          </div>
          <div className="mt-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight md:text-6xl" data-testid="heading-agenda">Today’s Agenda</h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#f6f5ec]/70 md:text-lg">Objectives, platforms, conversation, validation, and outcomes — ready for the customer demo.</p>
            </div>
            {mode !== "library" && (
              <div className="flex w-fit rounded-full border border-white/20 bg-[#183629]/35 p-1" role="group" aria-label="Agenda view">
                <button type="button" onClick={cancelEditor} className="rounded-full px-4 py-2 text-sm font-semibold text-white/75 hover:text-white" data-testid="button-agenda-library">Library</button>
                <button type="button" onClick={() => setMode("editor")} aria-pressed={mode === "editor"} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "editor" ? "bg-[#e2ebc8] text-[#203d2e]" : "text-white/75 hover:text-white"}`} data-testid="button-agenda-edit">Edit</button>
                <button type="button" onClick={() => setMode("presentation")} aria-pressed={mode === "presentation"} disabled={!fields.company || busy || uploading || queryBusy} className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-40 ${mode === "presentation" ? "bg-[#e2ebc8] text-[#203d2e]" : "text-white/75 hover:text-white"}`} data-testid="button-agenda-present">Presentation</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pt-7 md:px-8 md:pt-9">
        <div className="mb-7 flex flex-col gap-3 rounded-2xl border border-[#d7dbd0] bg-[#fbfbf6] px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5" role="note" data-testid="notice-shared-agendas">
          <p className="flex max-w-4xl gap-3 text-sm leading-relaxed text-[#536157]">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#677b68]" aria-hidden />
            <span><strong className="font-semibold text-[#294735]">Shared workspace.</strong> Every agenda can be viewed and edited by all signed-in portal users. This is not a private customer-data space; keep sensitive or regulated details elsewhere.</span>
          </p>
          <span className="mono shrink-0 text-[10px] tracking-wider text-[#788379]">{mode !== "library" && creating ? "UNSAVED DRAFT" : "SHARED LIBRARY"}</span>
        </div>

        {errorMessage && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-[#a95843]/25 bg-[#f8e9e3] px-4 py-3.5 text-sm text-[#723e31]" data-testid="error-agenda-save">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1">{errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage("")} className="rounded p-1 hover:bg-[#a95843]/10" aria-label="Dismiss message" data-testid="button-dismiss-agenda-error"><X className="h-4 w-4" /></button>
          </div>
        )}

        {mode === "library" && (
          <>
            {legacy.available && (
              <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#c8d2bd] bg-[#e8eddf] p-5 md:flex-row md:items-center md:justify-between" aria-labelledby="legacy-heading" data-testid="notice-legacy-draft">
                <div className="flex gap-3">
                  <FileText className="mt-1 h-5 w-5 shrink-0 text-[#49664f]" aria-hidden />
                  <div>
                    <h2 id="legacy-heading" className="font-semibold text-[#294735]">A browser draft is still here</h2>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#536157]">Import your saved text and logo into the shared library. The local copy stays in this browser unless the import succeeds.</p>
                  </div>
                </div>
                <button type="button" onClick={importLegacy} disabled={importing} className={primaryButton} data-testid="button-import-local-agenda">
                  {importing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" aria-hidden />}
                  {importing ? "Importing draft…" : "Import browser draft"}
                </button>
              </section>
            )}
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="eyebrow text-[#68776b]">Shared library</div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1e3528] md:text-3xl">Workshop briefs</h2>
                <p className="mt-1.5 text-sm text-[#69766b]">Reusable context, ready for the next customer conversation.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => openNew(true)} className={secondaryButton} data-testid="button-morningstar-template">Morningstar template</button>
                <button type="button" onClick={() => openNew()} className={primaryButton} data-testid="button-create-agenda"><Plus className="h-4 w-4" aria-hidden /> New agenda</button>
              </div>
            </div>
            {listQuery.isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading agendas">
                {[0, 1, 2].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl border border-[#e0e3d9] bg-[#e8eae2]" />)}
              </div>
            ) : listQuery.isError ? (
              <section className="grid min-h-64 place-items-center rounded-[1.75rem] border border-[#d9ddd2] bg-[#fbfbf6] p-8 text-center" data-testid="error-agenda-library">
                <div className="max-w-md">
                  <AlertCircle className="mx-auto h-8 w-8 text-[#9a5a47]" aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold text-[#294735]">The library didn’t load</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#69766b]">Your saved agendas have not been changed. Check your connection and try again.</p>
                  <button type="button" onClick={() => void listQuery.refetch()} className={`${secondaryButton} mt-5`} data-testid="button-retry-agenda-library">Try again</button>
                </div>
              </section>
            ) : list.length === 0 ? (
              <section className="relative overflow-hidden rounded-[1.75rem] border border-[#d9ddd2] bg-[#fbfbf6] px-6 py-12 md:px-12 md:py-16" data-testid="empty-agenda-library">
                <div className="absolute right-8 top-8 hidden h-32 w-32 rounded-full border border-[#d8dfd1] md:block" aria-hidden />
                <div className="relative max-w-xl">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e6ecdd] text-[#426148]"><FileText className="h-5 w-5" aria-hidden /></div>
                  <div className="eyebrow mt-6 text-[#788579]">A good conversation starts with context</div>
                  <h3 className="mt-2 text-3xl font-semibold tracking-tight text-[#203a2c]">No agendas yet.</h3>
                  <p className="mt-3 text-base leading-relaxed text-[#68756a]">Start a shared brief with the objective, current platforms, conversation, questions, and desired outcomes.</p>
                  <button type="button" onClick={() => openNew()} className={`${primaryButton} mt-6`} data-testid="button-create-first-agenda"><Plus className="h-4 w-4" aria-hidden /> Create the first agenda</button>
                </div>
              </section>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="list-agendas">
                {list.map((agenda, index) => (
                  <motion.button
                    key={agenda.id}
                    type="button"
                    onClick={() => openAgenda(agenda.id)}
                    initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.38, delay: reducedMotion ? 0 : index * 0.045 }}
                    className="group min-h-48 rounded-2xl border border-[#d9ddd2] bg-[#fbfbf6] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#b5c4b3] hover:shadow-[0_14px_34px_-24px_rgba(30,53,40,.4)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#315a47]/15"
                    data-testid={`card-agenda-${agenda.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <AgendaCardLogo src={protectedLogoUrl(agenda.logoPath)} company={agenda.company} />
                      <ChevronRight className="mt-2 h-4 w-4 text-[#89958a] transition group-hover:translate-x-1 group-hover:text-[#315a47]" aria-hidden />
                    </div>
                    <h3 className="mt-5 line-clamp-1 text-lg font-semibold text-[#203a2c]" data-testid={`text-agenda-company-${agenda.id}`}>{agenda.company}</h3>
                    <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-relaxed text-[#68756a]">{agenda.description || "No objective added yet."}</p>
                    <div className="mono mt-4 text-[10px] tracking-wider text-[#8a948b]">UPDATED {displayDate(agenda.updatedAt).toUpperCase()}</div>
                  </motion.button>
                ))}
              </div>
            )}
          </>
        )}

        {mode === "editor" && (
          queryBusy ? (
            <div className="space-y-4" aria-label="Loading agenda">
              <div className="h-28 animate-pulse rounded-2xl bg-[#e4e8df]" />
              <div className="h-64 animate-pulse rounded-2xl bg-[#e4e8df]" />
              <div className="h-64 animate-pulse rounded-2xl bg-[#e4e8df]" />
            </div>
          ) : agendaQuery.isError ? (
            <section className="rounded-2xl border border-[#dedfd6] bg-[#fbfbf6] p-8 text-center">
              <h2 className="text-xl font-semibold text-[#294735]">This agenda couldn’t be opened</h2>
              <p className="mt-2 text-sm text-[#68756a]">It may have been removed by another portal user.</p>
              <div className="mt-5 flex justify-center gap-3">
                <button type="button" onClick={() => void agendaQuery.refetch()} className={secondaryButton} data-testid="button-retry-open-agenda">Try again</button>
                <button type="button" onClick={cancelEditor} className={primaryButton} data-testid="button-back-agenda-library">Back to library</button>
              </div>
            </section>
          ) : (
            <form onSubmit={saveAgenda} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
              <div className="space-y-5">
                <section className="rounded-[1.6rem] border border-[#d9ddd2] bg-[#fbfbf6] p-5 md:p-8" aria-labelledby="agenda-welcome-heading">
                  <div className="eyebrow text-[#728075]">Demo brief</div>
                  <h2 id="agenda-welcome-heading" className="mt-2 text-2xl font-semibold tracking-tight text-[#203a2c]">Company and objective</h2>
                  <p className="mt-1 text-sm text-[#6c786e]">Set the customer name and the purpose of the demo.</p>
                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <label className="block text-sm font-semibold text-[#304c38]">Company name
                      <input value={fields.company} onChange={(event) => updateField("company", event.target.value)} placeholder="Customer company" maxLength={120} className={fieldClass} data-testid="input-agenda-company" />
                    </label>
                    <label className="block text-sm font-semibold text-[#304c38]">Objective
                      <textarea value={fields.description} onChange={(event) => updateField("description", event.target.value)} placeholder="What should this customer demo explore or validate?" rows={4} maxLength={500} className={`${fieldClass} resize-y`} data-testid="input-agenda-description" />
                    </label>
                  </div>
                </section>
                {sections.map((section) => (
                  <section key={section.key} className="rounded-[1.6rem] border border-[#d9ddd2] bg-[#fbfbf6] p-5 md:p-8" aria-labelledby={`agenda-${section.key}-heading`}>
                    <h2 id={`agenda-${section.key}-heading`} className="text-2xl font-semibold tracking-tight text-[#203a2c]">{section.label}</h2>
                    <p className="mt-2 text-sm text-[#6c786e]">{section.prompt}</p>
                    <label className="mt-5 block text-sm font-semibold text-[#304c38]">{section.noteLabel}
                      <textarea value={fields[section.key]} onChange={(event) => updateField(section.key, event.target.value)} placeholder={section.placeholder} rows={section.rows} maxLength={5000} className={`${fieldClass} resize-y`} data-testid={`input-agenda-${section.key}`} />
                    </label>
                  </section>
                ))}
              </div>
              <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
                <section className="rounded-[1.6rem] border border-[#d3dacc] bg-[#e6ebdf] p-5" aria-labelledby="agenda-logo-heading">
                  <div className="eyebrow text-[#728075]">Brand asset</div>
                  <h2 id="agenda-logo-heading" className="mt-2 text-lg font-semibold text-[#294735]">Customer logo</h2>
                  <div className="mt-4 flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#aeb9aa] bg-white p-4">
                    {fields.logoPath
                      ? <img src={protectedLogoUrl(fields.logoPath)} alt={`${fields.company || "Customer"} logo`} className="block h-full w-full min-h-0 min-w-0 object-contain" data-testid="img-agenda-logo" />
                      : <div className="text-center text-[#788579]"><ImagePlus className="mx-auto h-7 w-7" aria-hidden /><p className="mt-2 text-xs">No logo added</p></div>}
                  </div>
                  <label className={`mt-4 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#294b38] px-4 py-3 text-sm font-semibold text-[#f5f5eb] transition hover:bg-[#1d3d2d] ${uploading ? "pointer-events-none opacity-60" : ""}`}>
                    {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
                    {uploading ? "Uploading…" : fields.logoPath ? "Replace logo" : "Upload a logo"}
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogo} disabled={uploading} className="sr-only" data-testid="input-agenda-logo" aria-label="Upload customer logo (PNG, JPEG, or WebP)" />
                  </label>
                  {fields.logoPath && <button type="button" onClick={() => updateField("logoPath", null)} className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[#815346] transition hover:bg-[#a95843]/10" data-testid="button-agenda-remove-logo"><X className="h-4 w-4" aria-hidden /> Remove logo</button>}
                  <p className="mt-3 text-xs leading-relaxed text-[#6d796e]">PNG, JPEG, or WebP · up to 8 MB. Logo uploads are stored separately from agenda text.</p>
                  {logoMessage && <p role="alert" className="mt-3 rounded-lg bg-[#f8e9e3] p-3 text-xs leading-relaxed text-[#723e31]" data-testid="error-agenda-logo">{logoMessage}</p>}
                </section>
                <section className="rounded-[1.4rem] border border-[#d9ddd2] bg-[#fbfbf6] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#38513d]"><Check className="h-4 w-4" aria-hidden /> Shared and reusable</div>
                  <p className="mt-2 text-xs leading-relaxed text-[#718074]">Changes become visible to all signed-in portal users when saved.</p>
                  {!creating && activeAgenda && <p className="mono mt-3 border-t border-[#e5e7df] pt-3 text-[10px] tracking-wide text-[#879187]">UPDATED {displayDate(activeAgenda.updatedAt).toUpperCase()}</p>}
                </section>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={cancelEditor} className={secondaryButton} data-testid="button-agenda-cancel"><ArrowLeft className="h-4 w-4" aria-hidden /> Library</button>
                  <button type="submit" disabled={busy || uploading || (Boolean(selectedId) && loadedId !== selectedId)} className={primaryButton} data-testid="button-agenda-save">
                    {busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
                    {busy ? "Saving…" : "Save brief"}
                  </button>
                </div>
                {selectedId && (
                  <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#895646] transition hover:bg-[#f3e4de]" data-testid="button-agenda-delete">
                    <Trash2 className="h-4 w-4" aria-hidden /> Delete agenda
                  </button>
                )}
              </aside>
            </form>
          )
        )}

        {mode === "presentation" && (selectedId || creating) && (
          <div className="space-y-4" data-testid="agenda-presentation">
            {queryBusy ? (
              <div className="space-y-4" aria-label="Loading agenda">
                <div className="h-48 animate-pulse rounded-3xl bg-[#e4e8df]" />
                <div className="h-96 animate-pulse rounded-3xl bg-[#e4e8df]" />
              </div>
            ) : agendaQuery.isError && selectedId ? (
              <section className="rounded-2xl border border-[#dedfd6] bg-[#fbfbf6] p-8 text-center" role="alert">
                <h2 className="text-xl font-semibold text-[#294735]">This agenda couldn’t be opened</h2>
                <p className="mt-2 text-sm text-[#68756a]">It may have been removed by another portal user.</p>
                <button type="button" onClick={() => void agendaQuery.refetch()} className={`${secondaryButton} mt-5`}>Try again</button>
              </section>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d7dbd0] bg-[#fbfbf6] p-4">
                  <p className="text-sm text-[#536157]">
                    {creating ? "Unsaved draft. Edit this agenda, then save it to the shared library." : `Saved agenda · updated ${displayDate(activeAgenda?.updatedAt)}. Save after making changes.`}
                  </p>
                  <button type="button" onClick={() => void saveAgenda()} disabled={busy || uploading} className={primaryButton} data-testid="button-agenda-save-presentation">
                    {busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
                    {busy ? "Saving…" : "Save agenda"}
                  </button>
                </div>
                <AgendaDocument fields={fields} logoUrl={protectedLogoUrl(fields.logoPath)} />
              </>
            )}
            <div className="flex flex-wrap justify-between gap-3 pt-3">
              <button type="button" onClick={cancelEditor} className={secondaryButton} data-testid="button-agenda-presentation-library"><ArrowLeft className="h-4 w-4" aria-hidden /> Library</button>
              <button type="button" onClick={() => setMode("editor")} disabled={queryBusy || agendaQuery.isError} className={primaryButton} data-testid="button-agenda-back-edit"><Presentation className="h-4 w-4" aria-hidden /> Edit agenda</button>
            </div>
          </div>
        )}
      </main>

      {confirmDelete && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[#14251c]/55 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmDelete(false); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-agenda-title" aria-describedby="delete-agenda-description" className="w-full max-w-md rounded-3xl border border-[#e1ded4] bg-[#fbfbf6] p-6 shadow-[0_24px_80px_-24px_rgba(12,27,18,.45)] md:p-8" data-testid="dialog-delete-agenda">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f4e6e0] text-[#8d5544]"><Trash2 className="h-5 w-5" aria-hidden /></div>
            <h2 id="delete-agenda-title" className="mt-5 text-xl font-semibold text-[#243b2d]">Delete this agenda?</h2>
            <p id="delete-agenda-description" className="mt-2 text-sm leading-relaxed text-[#68756a]">“{fields.company || "This agenda"}” will be removed for everyone in the shared library. This action cannot be undone.</p>
            <div className="mt-7 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmDelete(false)} className={secondaryButton} disabled={busy} data-testid="button-cancel-delete-agenda">Keep agenda</button>
              <button type="button" onClick={() => void removeAgenda()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#8d4e3d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#783e30] disabled:opacity-50" disabled={busy} data-testid="button-confirm-delete-agenda">
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" aria-hidden />} Delete
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
