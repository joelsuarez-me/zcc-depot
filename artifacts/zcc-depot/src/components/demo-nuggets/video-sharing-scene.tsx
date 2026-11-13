import { AppWindow, BarChart3, CheckCircle2, Home, Inbox, MessageSquare, Mic, MicOff, Monitor, MonitorUp, PhoneOff, Settings, Users, Video, VideoOff } from "lucide-react";
import type { DemoPlayback } from "@/hooks/use-demo-playback";
import "./video-sharing-scene.css";

type Who = "agent" | "customer";

/** Illustrated participant; purely decorative SVG, no camera. */
function Person({ who, talking, camOff }: { who: Who; talking: boolean; camOff?: boolean }) {
  const a = who === "agent";
  if (camOff) {
    return (
      <div className="grid h-full w-full place-items-center bg-[#2A3A2C]">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-[#D1F470] text-sm font-bold text-[#11110D]">{a ? "MO" : "PR"}</span>
      </div>
    );
  }
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={`bg-${who}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={a ? "#2F4B35" : "#E9DCC6"} />
          <stop offset="1" stopColor={a ? "#1B2A1E" : "#CDBB9C"} />
        </linearGradient>
      </defs>
      <rect width="160" height="120" fill={`url(#bg-${who})`} />
      {a ? (
        <g opacity=".35"><rect x="10" y="14" width="34" height="22" rx="3" fill="#D1F470" /><rect x="118" y="20" width="4" height="60" fill="#F5F5F2" /><circle cx="120" cy="18" r="8" fill="#7DA33A" /></g>
      ) : (
        <g opacity=".55"><rect x="104" y="10" width="44" height="36" rx="3" fill="#F7F1E4" /><path d="M104 46h44" stroke="#A88F6A" /><rect x="14" y="70" width="26" height="40" rx="4" fill="#8DA676" /><circle cx="27" cy="62" r="12" fill="#6E8F57" /></g>
      )}
      <g className="vs-breathe">
        <path d={a ? "M38 120c4-26 22-36 42-36s38 10 42 36z" : "M36 120c5-25 22-35 44-35s39 10 44 35z"} fill={a ? "#D1F470" : "#3C6E8F"} />
        {a && <path d="M70 86l10 14 10-14" fill="#203524" />}
        <rect x="72" y="70" width="16" height="16" rx="6" fill={a ? "#8A5A3C" : "#E2B48E"} />
        <ellipse cx="80" cy="56" rx="20" ry="23" fill={a ? "#8A5A3C" : "#E2B48E"} />
        {a ? <path d="M59 52c0-18 12-26 22-26s21 7 21 24c-6-8-16-10-22-10s-15 3-21 12z" fill="#1C1410" />
           : <path d="M58 60c-4-24 10-36 24-36 15 0 26 12 20 40-2-12-8-20-20-22-8 4-16 6-24 18z" fill="#6B3A22" />}
        {a && <path d="M57 54a23 23 0 0146 0" fill="none" stroke="#11110D" strokeWidth="3" />}
        {a && <rect x="54" y="52" width="6" height="12" rx="3" fill="#11110D" />}
        {a && <path d="M57 63q4 10 14 10" fill="none" stroke="#11110D" strokeWidth="2" />}
        <g className="vs-blink"><ellipse cx="72" cy="57" rx="2" ry="2.4" fill="#11110D" /><ellipse cx="88" cy="57" rx="2" ry="2.4" fill="#11110D" /></g>
        <ellipse className={talking ? "vs-talk" : ""} cx="80" cy="68" rx="5" ry="2" fill="#5A2A22" />
      </g>
    </svg>
  );
}

function Tile({ who, talking, camOff, label, className = "" }: { who: Who; talking: boolean; camOff?: boolean; label: string; className?: string }) {
  return (
    <div className={`vs-tile ${className}`}>
      <Person who={who} talking={talking} camOff={camOff} />
      <span className="vs-name">{talking && <span className="vs-meter flex h-2.5 items-end gap-[2px] text-[#D1F470]"><i /><i /><i /></span>}{label}</span>
    </div>
  );
}

const windows = [
  { id: "app", label: "Brightline Home app", icon: AppWindow },
  { id: "screen", label: "Entire screen", icon: Monitor },
  { id: "mail", label: "Email inbox", icon: MessageSquare },
];

export function VideoSharingScene({ pb }: { pb: DemoPlayback }) {
  const idle = pb.status === "idle";
  const s = idle ? 4 : Math.max(0, Math.min(5, pb.stepIndex));
  const live = pb.playing;
  const k = (n: string) => `${n}-${s}`;
  const inCall = s >= 2 && s <= 4;
  const sharing = s === 4;
  const go = (i: number) => pb.seekStep(i);

  const thread = [
    { me: false, t: "My new Brightline thermostat keeps saying 'pairing failed' in the app." },
    { me: true, t: "Thanks Priya. A quick video call could get this sorted faster." },
  ];

  return (
    <div className={`vs-root relative px-3 pb-6 pt-14 sm:px-8 sm:pt-16 ${live ? "" : "vs-paused"}`}>
      <div className="vs-shell relative flex min-h-[400px]">
        <nav className="vs-rail hidden w-12 shrink-0 flex-col items-center gap-5 py-4 sm:flex" aria-hidden>
          <span className="text-lg font-bold text-[#F5F5F2]">Z</span>
          <Home className="h-4 w-4" /><span className="grid h-9 w-full place-items-center bg-[#17494D] text-[#F5F5F2]"><Inbox className="h-4 w-4" /></span>
          <Users className="h-4 w-4" /><BarChart3 className="h-4 w-4" /><Settings className="h-4 w-4" />
        </nav>

        {/* Ticket context — always present */}
        <aside className="hidden w-44 shrink-0 border-r border-[#11110D]/10 p-3 text-xs md:block">
          <div className="eyebrow text-[0.6rem] text-[#203524]/70">Ticket #48213</div>
          <div className="mt-1 text-sm font-semibold leading-snug">Thermostat will not pair</div>
          <dl className="mt-3 space-y-2">
            <div><dt className="opacity-55">Requester</dt><dd className="font-semibold">Priya Raman</dd></div>
            <div><dt className="opacity-55">Channel</dt><dd className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />Messaging</dd></div>
            <div><dt className="opacity-55">Device</dt><dd>Brightline T2</dd></div>
            <div><dt className="opacity-55">Status</dt><dd><span className={`vs-chip ${s === 5 ? "bg-[#D1F470] text-[#203524]" : "bg-[#F0B840]/30 text-[#7A5310]"}`}>{s === 5 ? "Solved" : "Open"}</span></dd></div>
          </dl>
        </aside>

        <main className="min-w-0 flex-1 p-3 sm:p-4">
          <header className="flex flex-wrap items-center gap-2 border-b border-[#11110D]/10 pb-2">
            <h3 className="text-base font-semibold sm:text-lg">Priya Raman</h3>
            <span className="vs-chip bg-[#11110D]/[.06]">via Messaging</span>
            <span className="vs-chip ml-auto bg-[#203524] text-[#D1F470]" data-testid="status-call">
              {["Messaging", "Preview", "On video call", "Choosing share", "Sharing screen", "Call ended"][s]}
            </span>
          </header>

          <div className="mt-3 space-y-1.5 md:max-w-[68%]">
            {thread.map((m, i) => (
              <p key={i} className={`rounded-xl px-3 py-1.5 text-xs leading-snug sm:text-[0.8rem] ${m.me ? "ml-8 bg-[#203524] text-[#F5F5F2]" : "mr-8 bg-[#11110D]/[.06]"}`}>{m.t}</p>
            ))}
            {s === 0 && (
              <div key={k("inv")} className="vs-in ml-8 flex items-center gap-2 rounded-xl border-2 border-dashed border-[#203524]/40 bg-[#D1F470]/30 px-3 py-2 text-xs">
                <Video className="h-4 w-4 shrink-0" /><span className="font-semibold">Video call invite sent in this conversation</span>
              </div>
            )}
            {s === 5 && (
              <div key={k("res")} className="vs-in space-y-1.5">
                <p className="ml-8 flex items-center gap-2 rounded-xl bg-[#11110D]/[.06] px-3 py-1.5 text-xs"><Video className="h-3.5 w-3.5" />Video call ended · 6 min 42 s</p>
                <p className="mr-8 rounded-xl bg-[#11110D]/[.06] px-3 py-1.5 text-xs">It's paired and showing 21.5 degrees. Thank you!</p>
              </div>
            )}
          </div>

          {/* Composer with invite action (stage 0) */}
          {(s === 0 || s === 5) && (
            <div className="mt-3 rounded-xl border border-[#11110D]/15 bg-white/60 p-2 md:max-w-[68%]">
              <div className="h-7 px-1 text-xs opacity-50">{s === 5 ? "Add an internal note: resolved on video call..." : "Type a reply..."}</div>
              <div className="flex items-center justify-between">
                <span className="text-[0.65rem] opacity-55">Ticket history kept on this ticket</span>
                {s === 0 ? (
                  <button type="button" onClick={() => go(1)} className={`vs-btn bg-[#203524] text-[#D1F470] ${live ? "vs-ring" : ""}`} data-testid="button-share-video-invite">
                    <Video className="h-4 w-4" />Share video call invite
                  </button>
                ) : (
                  <button type="button" onClick={() => go(0)} className="vs-btn border border-[#203524]/30 text-[#203524]" data-testid="button-restart-call-demo">
                    <CheckCircle2 className="h-4 w-4" />Submit as Solved
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Agent call console */}
          {s >= 1 && s <= 4 && (
            <section key={k("console")} className="vs-in mt-3 rounded-2xl bg-[#11110D] p-2.5 text-[#F5F5F2] md:max-w-[68%]" aria-label="Agent video call console (simulated)">
              <div className="mb-2 flex items-center justify-between text-[0.7rem]">
                <span className="font-semibold">{s === 1 ? "Check audio and video" : sharing ? "Priya is sharing a window" : "Video call · 00:0" + (s + 1) + ":14"}</span>
                <span className="opacity-60">Agent console</span>
              </div>

              {s === 3 ? (
                <div className="grid grid-cols-1 gap-2 rounded-xl bg-[#F5F5F2] p-2 text-[#11110D] sm:grid-cols-3" role="group" aria-label="Choose what to share">
                  {windows.map((w, i) => (
                    <button key={w.id} type="button" onClick={() => go(4)} className={`vs-win vs-in p-2 ${i === 0 ? "is-on" : ""}`} style={{ animationDelay: `${i * 0.12}s` }} data-testid={`button-share-${w.id}`}>
                      <div className="mb-1.5 h-12 rounded-md bg-[#203524]/10 p-1.5">{i === 0 && <div className="h-full rounded bg-[#3C6E8F]/30" />}</div>
                      <span className="flex items-center gap-1 text-xs font-semibold"><w.icon className="h-3.5 w-3.5" />{w.label}</span>
                    </button>
                  ))}
                </div>
              ) : sharing ? (
                <div key={k("share")} className="vs-pop relative overflow-hidden rounded-xl bg-[#F7F1E4] p-3 text-[#11110D]">
                  <div className="vs-scan" />
                  <div className="text-[0.65rem] font-semibold uppercase tracking-wider opacity-60">Brightline Home app</div>
                  <div className="mt-1 text-sm font-semibold">Add device · Step 3 of 4</div>
                  <div className="mt-2 flex gap-2">
                    <div className="flex-1 rounded-lg bg-white p-2 text-xs"><b>Wi-Fi network</b><div className="opacity-60">Raman-Home-5G</div></div>
                    <div className="flex-1 rounded-lg border-2 border-[#203524] bg-[#D1F470]/50 p-2 text-xs"><b>Switch to 2.4 GHz</b><div className="opacity-70">Required for T2</div></div>
                  </div>
                  <svg className="vs-cursor absolute bottom-6 left-1/2 h-5 w-5" viewBox="0 0 20 20" aria-hidden><path d="M3 2l13 7-6 1-3 6z" fill="#11110D" stroke="#fff" /></svg>
                  <Tile who="agent" talking={live} label="You" className="absolute right-2 top-2 h-16 w-24 border-2 border-[#11110D] sm:h-20 sm:w-28" />
                  <Tile who="customer" talking={false} label="Priya" className="absolute bottom-2 right-2 h-16 w-24 border-2 border-[#11110D] sm:h-20 sm:w-28" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Tile who="customer" talking={live && s === 2} camOff={s === 1} label={s === 1 ? "Priya · joining" : "Priya Raman"} className="aspect-[4/3]" />
                  <Tile who="agent" talking={live && s >= 1} label="You (Morgan)" className="aspect-[4/3]" />
                </div>
              )}

              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                <button type="button" className="vs-ctl" aria-pressed={s === 1} aria-label="Microphone preview" onClick={() => go(1)} data-testid="button-mic">{s === 1 ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</button>
                <button type="button" className="vs-ctl" aria-pressed={s === 2} aria-label="Camera" onClick={() => go(2)} data-testid="button-camera">{s === 1 ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}</button>
                <button type="button" className="vs-ctl" aria-pressed={s >= 3} aria-label="Share screen" onClick={() => go(3)} data-testid="button-share-screen"><MonitorUp className="h-4 w-4" /></button>
                <button type="button" className="vs-ctl is-end" aria-label="End call" onClick={() => go(5)} data-testid="button-end-call"><PhoneOff className="h-4 w-4" /></button>
                {s === 1 && <button type="button" onClick={() => go(2)} className="vs-btn ml-1 bg-[#D1F470] text-[#11110D]" data-testid="button-join-call">Start call</button>}
              </div>
            </section>
          )}

          {s === 5 && (
            <div key={k("done")} className="vs-in mt-3 flex items-start gap-2 rounded-xl bg-[#D1F470]/50 p-3 text-xs text-[#203524] md:max-w-[68%]">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span><b>Resolved on the same ticket.</b> Messaging thread and ticket fields stay in context after the call.</span>
            </div>
          )}
        </main>

        {/* Customer pop-out window */}
        {s <= 4 && (
          <div key={k("cust")} className="vs-in absolute bottom-3 right-3 hidden w-[34%] max-w-[220px] rounded-2xl border border-[#11110D]/15 bg-white p-2 shadow-[0_24px_40px_-20px_rgba(17,17,13,.6)] md:block">
            <div className="mb-1.5 flex items-center justify-between text-[0.65rem]"><b>Customer view</b><span className="opacity-55">Brightline help</span></div>
            {s === 0 ? (
              <div className="rounded-xl bg-[#11110D]/[.05] p-2 text-xs">
                <p>A support agent has requested that you join a video call.</p>
                <button type="button" onClick={() => go(1)} className={`vs-btn mt-2 w-full bg-[#203524] text-[#D1F470] ${live ? "vs-ring" : ""}`} data-testid="button-customer-join">Join</button>
              </div>
            ) : s === 1 ? (
              <div className="space-y-1.5 text-xs">
                <Tile who="customer" talking={false} label="Your preview" className="aspect-[4/3]" />
                <div className="flex items-center gap-2"><Mic className="h-3.5 w-3.5" />Mic level<span className={`vs-meter ml-auto flex h-3 items-end gap-[2px] text-[#7DA33A]`}><i /><i /><i /><i /><i /></span></div>
              </div>
            ) : (
              <Tile who="agent" talking={live} label={sharing ? "Morgan · you are sharing" : "Morgan (Agent)"} className="aspect-[4/3]" />
            )}
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-[0.7rem] text-[#203524]/70">Prepared simulation · illustrated participants · no camera, mic or screen capture used · interim scope, subject to change</p>
    </div>
  );
}
