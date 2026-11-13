import { Check, Headset, Phone } from "lucide-react";
import type { DemoPlayback } from "@/hooks/use-demo-playback";
import { useSceneText } from "./scene-copy";

const checks = ["Replacement created", "Carrier pickup scheduled", "Notifications sent"] as const;

/** Decorative reconstruction; nothing here is interactive or connected. */
export function VoiceAiScene({ pb }: { pb: DemoPlayback }) {
  const { locale, t } = useSceneText();
  const idle = pb.status === "idle";
  const s = idle ? 4 : pb.stepIndex;
  const secs = 48 + Math.floor((idle ? 14000 : pb.elapsedMs) / 1000);
  const time = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
  const doneChecks = idle || pb.complete ? 3 : Math.max(0, s - 1) - (pb.stepProgress < 0.5 && s >= 2 ? 1 : 0);
  const k = (n: string) => `${n}-${pb.stepIndex}`;

  return (
    <div lang={locale} className="relative flex min-h-[460px] flex-col gap-4 px-4 pb-6 pt-14 sm:px-10 sm:pt-16" aria-hidden>
      <div className="flex justify-end">
        <div className="flex items-center gap-3 rounded-xl bg-[#F5F5F2] px-3 py-1.5 shadow">
          <span className={`h-2.5 w-2.5 rounded-full bg-[#D93F4C] ${pb.playing ? "dn-ring" : ""}`} />
          <span className="mono text-lg text-[#11110D]">{time}</span>
          <Phone className="h-4 w-4 text-[#3F8F3F]" />
        </div>
      </div>
      <div key={k("c")} className="dn-in flex items-center justify-end gap-3">
        <p className="rounded-2xl bg-[#FBFBF8] px-4 py-2.5 text-sm text-[#11110D] shadow-lg sm:text-base">{t(s === 0 ? "My order arrived damaged. Can I get a replacement?" : "Yes, that's fine.")}</p>
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#C9B8A6] font-semibold text-[#11110D] ring-4 ring-[#11110D]">TS</span>
      </div>
      <div className="flex items-start gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-[#D1F470]/60 bg-[#ECF7C8] text-[#4E7A2E]"><Headset className="h-6 w-6" /></span>
        <p key={k("a")} className="dn-in max-w-sm rounded-2xl bg-[#FBFBF8] px-4 py-3 text-sm leading-relaxed text-[#11110D] shadow-lg sm:text-base">
          {t(idle || pb.complete ? "Example complete. No replacement or pickup was created and no notification was sent."
            : s === 0 ? "I'm sorry to hear that. I can guide you through a replacement and pickup. Does that work?"
            : s === 1 ? "Thanks, Terry. Let's review those steps."
            : s === 2 ? (pb.stepProgress < 0.5 ? "Illustrating the replacement step." : "Replacement step illustrated. Next, the pickup.")
            : s === 3 ? (pb.stepProgress < 0.5 ? "Illustrating the carrier pickup step." : "Pickup step illustrated. Next, the confirmation.")
            : pb.stepProgress < 0.5 ? "Preparing the sample confirmation."
            : "Example complete. No replacement or pickup was created and no notification was sent.")}
        </p>
      </div>
      {s >= 1 && (
        <div className="relative ml-auto w-full max-w-sm">
          <div className="dn-dots absolute -top-4 left-10 h-4 w-1" />
          <div className="dn-in rounded-2xl bg-[#FBFBF8] p-4 text-[#11110D] shadow-[0_0_60px_10px_rgba(209,244,112,.35)]">
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold"><Headset className="h-4 w-4" />{t("AI agent activity")} <span className="ml-auto text-[0.6rem] font-normal uppercase tracking-wider opacity-50 mono">{t("simulated")}</span></div>
            <ul className="mt-3 space-y-2.5">
              {checks.map((c, i) => {
                const done = i < doneChecks;
                const working = !done && i === doneChecks && s >= 2 && !pb.complete;
                return (
                  <li key={c} className={`flex items-center gap-3 text-sm transition-opacity duration-500 ${done || working ? "opacity-100" : "opacity-35"}`}>
                    <span className={`grid h-6 w-6 place-items-center rounded-full transition-colors duration-500 ${done ? "bg-[#8DBF3F] text-white" : "border-2 border-dashed border-[#8DBF3F]"}`}>{done && <Check className="dn-in h-3.5 w-3.5" strokeWidth={3} />}</span>
                    {t(c)}{working && <span className="dn-wave ml-auto text-[#8DBF3F]"><i /><i /><i /></span>}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs opacity-65">{t("No orders are changed. Real actions require configured integrations.")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
