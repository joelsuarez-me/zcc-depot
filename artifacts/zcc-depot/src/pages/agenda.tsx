import { useEffect, useState, type ChangeEvent } from "react";
import { ArrowLeft, Check, ImagePlus, RotateCcw, Upload, X } from "lucide-react";

type AgendaData = {
  company: string;
  description: string;
  currentState: string;
  problems: string;
  outcomes: string;
};

const TEXT_KEY = "zcc-depot:agenda:v1";
const LOGO_KEY = "zcc-depot:agenda-logo:v1";
const EMPTY: AgendaData = {
  company: "",
  description: "",
  currentState: "",
  problems: "",
  outcomes: "",
};
const MAX_LOGO_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

function loadText(): AgendaData {
  try {
    const saved = localStorage.getItem(TEXT_KEY);
    return saved ? { ...EMPTY, ...JSON.parse(saved) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function loadLogo(): string {
  try {
    return localStorage.getItem(LOGO_KEY) || "";
  } catch {
    return "";
  }
}

function resizeLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      let scale = Math.min(1, 640 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Your browser could not prepare this image."));
        return;
      }
      let compressed = "";
      for (let attempt = 0; attempt < 5; attempt += 1) {
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        compressed = canvas.toDataURL("image/webp", Math.max(0.42, 0.72 - attempt * 0.08));
        if (compressed.length < 180_000) break;
        scale *= 0.72;
      }
      if (compressed.length >= 180_000) {
        reject(new Error("This image is too detailed to store safely. Choose a smaller or simpler logo."));
        return;
      }
      resolve(compressed);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This image could not be opened. Try another PNG, JPEG, or WebP file."));
    };
    image.src = url;
  });
}

const inputClass = "mt-2 w-full rounded-2xl border border-[#203524]/20 bg-[#FBFBF8] px-4 py-3.5 text-sm leading-relaxed text-[#11110D] placeholder:text-[#11110D]/35 focus:border-[#203524] focus:outline-none focus:ring-2 focus:ring-[#203524]/15";

export default function Agenda() {
  const [data, setData] = useState<AgendaData>(loadText);
  const [logo, setLogo] = useState(loadLogo);
  const [mode, setMode] = useState<"edit" | "present">("edit");
  const [storageMessage, setStorageMessage] = useState("");
  const [logoMessage, setLogoMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSaving(true);
    try {
      localStorage.setItem(TEXT_KEY, JSON.stringify(data));
      setStorageMessage("");
    } catch {
      setStorageMessage("Couldn’t save your agenda in this browser. Check available storage or browser privacy settings; your current edits remain on this page.");
    } finally {
      setSaving(false);
    }
  }, [data]);

  function update(field: keyof AgendaData, value: string) {
    setData((previous) => ({ ...previous, [field]: value }));
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
    try {
      const compressed = await resizeLogo(file);
      setLogo(compressed);
      setLogoMessage("");
      try {
        localStorage.setItem(LOGO_KEY, compressed);
      } catch {
        setLogoMessage("The logo is shown for this session, but browser storage is full, so it could not be saved. Your agenda text is saved separately.");
      }
    } catch (error) {
      setLogoMessage(error instanceof Error ? error.message : "The logo could not be processed.");
    }
  }

  function removeLogo() {
    setLogo("");
    setLogoMessage("");
    try {
      localStorage.removeItem(LOGO_KEY);
    } catch {
      setLogoMessage("The logo was removed from this page, but browser storage could not be updated.");
    }
  }

  function resetAgenda() {
    if (!window.confirm("Clear all agenda text and remove the saved logo from this browser? This cannot be undone.")) return;
    setData(EMPTY);
    setLogo("");
    setLogoMessage("");
    try {
      localStorage.removeItem(LOGO_KEY);
      localStorage.setItem(TEXT_KEY, JSON.stringify(EMPTY));
      setStorageMessage("");
    } catch {
      setStorageMessage("The agenda was cleared on this page, but browser storage could not be updated.");
    }
  }

  const fields: { key: keyof AgendaData; label: string; prompt: string; placeholder: string }[] = [
    { key: "currentState", label: "Hero 1 · Current State", prompt: "Describe the operating reality today.", placeholder: "How does the team work today? Include channels, tools, workflows, or context that will help frame the conversation." },
    { key: "problems", label: "Hero 2 · Problems", prompt: "Name the friction worth solving.", placeholder: "Where are customers or agents getting stuck? Capture the specific pain points and their impact." },
    { key: "outcomes", label: "Hero 3 · Outcomes", prompt: "Make the desired future concrete.", placeholder: "What should be different after this work? Describe the customer and business outcomes you want to explore." },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#F5F5F2] pb-20">
      <header className="bg-[#203524] px-5 pb-11 pt-28 text-[#F5F5F2] md:px-8 md:pb-14 md:pt-32">
        <div className="mx-auto max-w-7xl">
          <div className="eyebrow flex items-center gap-2 text-[#D1F470]"><span className="h-px w-8 bg-[#D1F470]" />Customer workshop · Conversation brief</div>
          <div className="mt-5 flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl" data-testid="heading-agenda">Today’s Agenda</h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#F5F5F2]/70 md:text-lg">Turn account notes into a clear, customer-ready conversation.</p>
            </div>
            <div className="flex shrink-0 rounded-full border border-[#F5F5F2]/20 bg-[#11110D]/20 p-1" role="group" aria-label="Agenda view">
              <button type="button" onClick={() => setMode("edit")} aria-pressed={mode === "edit"} data-testid="button-agenda-edit"
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${mode === "edit" ? "bg-[#D1F470] text-[#11110D]" : "text-[#F5F5F2]/75 hover:text-[#F5F5F2]"}`}>Edit</button>
              <button type="button" onClick={() => setMode("present")} aria-pressed={mode === "present"} data-testid="button-agenda-present"
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${mode === "present" ? "bg-[#D1F470] text-[#11110D]" : "text-[#F5F5F2]/75 hover:text-[#F5F5F2]"}`}>Presentation</button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pt-8 md:px-8 md:pt-10">
        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-[#203524]/12 bg-[#FBFBF8] px-4 py-4 text-sm md:flex-row md:items-center md:justify-between md:px-5">
          <p className="max-w-3xl leading-relaxed text-[#11110D]/70" data-testid="notice-local-storage">
            <strong className="font-semibold text-[#203524]">Private to this browser.</strong> Agenda text and the resized logo are stored in this browser only. They are not synced or sent to a server.
          </p>
          <div className="flex items-center gap-2 self-start whitespace-nowrap text-xs text-[#203524]/70 md:self-auto" aria-live="polite" data-testid="status-agenda-save">
            {saving ? <span className="h-2 w-2 animate-pulse rounded-full bg-[#B78A32]" /> : <Check className="h-4 w-4 text-[#3E7548]" aria-hidden />}
            {saving ? "Saving…" : "Saved in this browser"}
          </div>
        </div>

        {storageMessage && <div role="alert" className="mb-6 rounded-xl border border-[#A34B32]/30 bg-[#F9E8E1] px-4 py-3 text-sm text-[#71331F]" data-testid="error-agenda-storage">{storageMessage}</div>}

        {mode === "edit" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="space-y-5">
              <section className="rounded-[1.75rem] border border-[#203524]/10 bg-[#FBFBF8] p-5 md:p-8" aria-labelledby="edit-hero0">
                <div className="eyebrow text-[#203524]/65">Hero 0 · Welcome</div>
                <h2 id="edit-hero0" className="mt-2 text-2xl font-semibold tracking-tight">Set the room</h2>
                <p className="mt-1 text-sm text-[#11110D]/55">A name, a little context, and a recognizable mark.</p>
                <div className="mt-6 grid gap-5 md:grid-cols-[1fr_1fr]">
                  <label className="block text-sm font-semibold text-[#203524]">Company name
                    <input value={data.company} onChange={(e) => update("company", e.target.value)} placeholder="Add the customer’s company name" maxLength={120}
                      className={inputClass} data-testid="input-agenda-company" />
                  </label>
                  <label className="block text-sm font-semibold text-[#203524]">Short description
                    <textarea value={data.description} onChange={(e) => update("description", e.target.value)} placeholder="A concise account or workshop description" rows={3} maxLength={500}
                      className={`${inputClass} resize-y`} data-testid="input-agenda-description" />
                  </label>
                </div>
              </section>
              {fields.map((field, index) => (
                <section key={field.key} className="rounded-[1.75rem] border border-[#203524]/10 bg-[#FBFBF8] p-5 md:p-8" aria-labelledby={`edit-${field.key}`}>
                  <div className="eyebrow text-[#203524]/65">{field.label}</div>
                  <h2 id={`edit-${field.key}`} className="mt-2 text-2xl font-semibold tracking-tight">{field.prompt}</h2>
                  <label className="mt-5 block text-sm font-semibold text-[#203524]">
                    {index === 0 ? "Current state notes" : index === 1 ? "Problem notes" : "Outcome notes"}
                    <textarea value={data[field.key]} onChange={(e) => update(field.key, e.target.value)} placeholder={field.placeholder} rows={5} maxLength={5000}
                      className={`${inputClass} resize-y`} data-testid={`input-agenda-${field.key}`} />
                  </label>
                </section>
              ))}
            </div>
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <section className="rounded-[1.75rem] border border-[#203524]/10 bg-[#E8EBDD] p-5" aria-labelledby="logo-heading">
                <div className="eyebrow text-[#203524]/65">Brand asset</div>
                <h2 id="logo-heading" className="mt-2 text-lg font-semibold">Customer logo</h2>
                <div className="mt-4 grid min-h-36 place-items-center rounded-2xl border border-dashed border-[#203524]/25 bg-[#FBFBF8] p-4">
                  {logo ? <img src={logo} alt="Uploaded customer logo preview" className="max-h-28 max-w-full object-contain" data-testid="img-agenda-logo" /> : <div className="text-center text-[#203524]/55"><ImagePlus className="mx-auto h-7 w-7" aria-hidden /><p className="mt-2 text-xs">No logo added</p></div>}
                </div>
                <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-full bg-[#203524] px-4 py-3 text-sm font-semibold text-[#D1F470] transition-colors hover:bg-[#2b4630]">
                  <Upload className="h-4 w-4" aria-hidden />{logo ? "Replace logo" : "Upload a logo"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogo} className="sr-only" data-testid="input-agenda-logo" aria-label="Upload customer logo (PNG, JPEG, or WebP)" />
                </label>
                {logo && <button type="button" onClick={removeLogo} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-[#71331F] hover:bg-[#A34B32]/10" data-testid="button-agenda-remove-logo"><X className="h-4 w-4" aria-hidden />Remove logo</button>}
                <p className="mt-3 text-xs leading-relaxed text-[#11110D]/55">PNG, JPEG, or WebP · up to 8 MB. Resized before browser storage.</p>
                {logoMessage && <p role="alert" className="mt-3 rounded-xl bg-[#F9E8E1] p-3 text-xs leading-relaxed text-[#71331F]" data-testid="error-agenda-logo">{logoMessage}</p>}
              </section>
              <button type="button" onClick={resetAgenda} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[#A34B32]/25 px-4 py-3 text-sm font-semibold text-[#71331F] transition-colors hover:bg-[#A34B32]/8" data-testid="button-agenda-reset">
                <RotateCcw className="h-4 w-4" aria-hidden />Clear agenda
              </button>
              <p className="mt-2 text-center text-xs leading-relaxed text-[#11110D]/45">You’ll be asked to confirm before anything is cleared.</p>
            </aside>
          </div>
        ) : (
          <div className="space-y-4" data-testid="agenda-presentation">
            <section className="relative overflow-hidden rounded-[2rem] bg-[#203524] p-7 text-[#F5F5F2] md:min-h-64 md:p-11">
              <div className="grid-lines absolute inset-0 opacity-70" aria-hidden />
              <div className="relative flex flex-col-reverse justify-between gap-7 sm:flex-row sm:items-center">
                <div>
                  <div className="eyebrow text-[#D1F470]">Hero 0 · Welcome</div>
                  <h2 className="mt-4 break-words text-4xl font-semibold tracking-tight md:text-6xl" data-testid="text-agenda-company">{data.company || "Company name"}</h2>
                  <p className="mt-4 max-w-2xl whitespace-pre-wrap text-base leading-relaxed text-[#F5F5F2]/72" data-testid="text-agenda-description">{data.description || "Add a short description in Edit to set the context for today’s conversation."}</p>
                </div>
                {logo && <div className="grid h-24 w-40 shrink-0 place-items-center rounded-2xl bg-[#FBFBF8] p-3 sm:h-32 sm:w-48"><img src={logo} alt="Customer logo" className="max-h-full max-w-full object-contain" /></div>}
              </div>
              <span className="mono relative mt-8 block text-xs text-[#F5F5F2]/45">CUSTOMER WORKSHOP</span>
            </section>
            {fields.map((field, index) => (
              <section key={field.key} className={`grid gap-5 rounded-[2rem] p-6 md:grid-cols-[13rem_1fr] md:items-start md:p-9 ${index === 0 ? "bg-[#DDE6D7]" : index === 1 ? "bg-[#E9DFD2]" : "bg-[#D6E6E0]"}`} data-testid={`card-agenda-${field.key}`}>
                <div>
                  <div className="eyebrow text-[#203524]/60">{field.label.split(" · ")[0]}</div>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#203524]">{field.label.split(" · ")[1]}</h2>
                </div>
                <p className="min-h-16 whitespace-pre-wrap text-base leading-relaxed text-[#11110D]/80 md:text-lg" data-testid={`text-agenda-${field.key}`}>
                  {data[field.key] || <span className="text-[#11110D]/40">{field.prompt} Add notes in Edit to shape this section.</span>}
                </p>
              </section>
            ))}
            <div className="flex justify-end pt-3">
              <button type="button" onClick={() => setMode("edit")} className="inline-flex items-center gap-2 rounded-full bg-[#203524] px-5 py-3 text-sm font-semibold text-[#D1F470] transition-transform hover:-translate-y-0.5" data-testid="button-agenda-back-edit"><ArrowLeft className="h-4 w-4" aria-hidden />Back to editing</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
