import { useEffect, useState } from "react";
import { Pause, Play } from "lucide-react";
import { CONTACT_COMPONENTS, componentConnections, type ContactComponentId } from "@/data/contact-center-components";
import "./components-guide.css";

function useMotionState() {
  const [hidden, setHidden] = useState(typeof document !== "undefined" && document.hidden);
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const f = () => setHidden(document.hidden);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const r = () => setReduce(mq.matches);
    r();
    document.addEventListener("visibilitychange", f);
    mq.addEventListener("change", r);
    return () => { document.removeEventListener("visibilitychange", f); mq.removeEventListener("change", r); };
  }, []);
  return { hidden, reduce };
}

/** Connector wire. orient="v" is always vertical; orient="hv" is vertical when stacked (<640px), horizontal on wider screens. */
function Wire({ on, label, orient, area }: { on: boolean; label: string; orient: "v" | "hv"; area: string }) {
  return (
    <div className={`ccg-wire ccg-orient-${orient} ccg-a-${area}`} data-on={on} aria-hidden>
      <svg className="ccg-wire-v" viewBox="0 0 10 100" preserveAspectRatio="none">
        <line className="base" x1="5" y1="0" x2="5" y2="100" vectorEffect="non-scaling-stroke" />
        <line className="flow" x1="5" y1="0" x2="5" y2="100" vectorEffect="non-scaling-stroke" />
      </svg>
      {orient === "hv" && (
        <svg className="ccg-wire-h" viewBox="0 0 100 10" preserveAspectRatio="none">
          <line className="base" x1="0" y1="5" x2="100" y2="5" vectorEffect="non-scaling-stroke" />
          <line className="flow" x1="0" y1="5" x2="100" y2="5" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
      <span className="lbl">{label}</span>
    </div>
  );
}

function Entry({ on, label, area }: { on: boolean; label: string; area: string }) {
  return (
    <div className={`ccg-entry ccg-a-${area}`} data-on={on}>
      <Wire on={on} label="" orient="v" area="none" />
      <span className="ccg-pill">{label}</span>
    </div>
  );
}

export function ComponentMap() {
  const [sel, setSel] = useState<ContactComponentId>("connect");
  const [userPaused, setUserPaused] = useState(false);
  const { hidden, reduce } = useMotionState();
  const paused = userPaused || hidden || reduce;
  const c = componentConnections(sel);
  const active = CONTACT_COMPONENTS.find((x) => x.id === sel)!;

  const node = (id: ContactComponentId, area: string) => {
    const n = CONTACT_COMPONENTS.find((x) => x.id === id)!;
    return (
      <button type="button" className={`ccg-node ccg-a-${area}`} aria-pressed={sel === id} aria-controls="ccg-detail"
        onClick={() => setSel(id)} data-testid={`button-component-${id}`}>
        <span className="k">{n.category}</span><span className="t">{n.title}</span><span className="s">{n.summary}</span>
      </button>
    );
  };

  return (
    <div className={`ccg ccg-map ${paused ? "ccg-paused" : ""}`} data-testid="component-map">
      <div className="ccg-grid">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="eyebrow text-[#D1F470]" id="ccg-map-hint">Select a component to trace its connections</p>
            <button type="button" className="ccg-motion" onClick={() => setUserPaused((p) => !p)} disabled={reduce}
              aria-pressed={userPaused} data-testid="button-map-motion">
              {reduce ? "Motion off (reduced motion)" : userPaused
                ? <><Play className="h-3.5 w-3.5" aria-hidden />Resume motion</>
                : <><Pause className="h-3.5 w-3.5" aria-hidden />Pause motion</>}
            </button>
          </div>
          <div className="ccg-stage" role="group" aria-labelledby="ccg-map-hint">
            {node("identity", "idp")}
            <div className="ccg-aws">
              <span className="ccg-aws-label">Customer AWS account</span>
              <div className="ccg-layout">
                <Wire on={c.identityConnect} label="SAML 2.0 SSO to Connect" orient="v" area="saml" />
                {node("connect", "connect")}
                <Wire on={c.connectApp} label="Connect ↔ app" orient="hv" area="link" />
                {node("app", "app")}
                <Entry on={c.customerConnect} label="Customer calls + chats" area="cust" />
                <Entry on={c.agentApp} label="Agent signs in to the app" area="agent" />
              </div>
              <div className="ccg-data">
                <span className="mono text-[0.66rem] uppercase tracking-[0.12em] text-[#D1F470]">Contact Center data</span>
                <span className="mt-1 block">Contact Center environment data is held within this account boundary.</span>
              </div>
            </div>
          </div>
        </div>
        <div id="ccg-detail" role="region" aria-live="polite" aria-label="Component details">
          <div key={sel} className="ccg-panel ccg-panel-in" data-testid="panel-component-detail">
            <p className="eyebrow text-[#203524]">{active.category}</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">{active.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#11110D]/80">{active.description}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {active.points.map((p) => <li key={p} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#203524]" aria-hidden />{p}</li>)}
            </ul>
            <div className="mt-5 rounded-xl bg-[#203524] p-4 text-sm text-[#F5F5F2]">
              <span className="eyebrow text-[#D1F470]">Boundary</span>
              <p className="mt-1 leading-relaxed">{active.boundary}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
