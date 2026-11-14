import { DOCS, type Scenario } from "@/data/callback-scenarios";

export function CallbackConfigGuide({ sc, ns = "" }: { sc: Scenario; ns?: string }) {
  const g = sc.guide;
  const rows: [string, string | string[]][] = [
    ["Native capability versus custom implementation", g.native], ["Required Amazon Connect resources", g.resources], ["Required contact flow blocks", g.blocks], ["Queue and routing profile configuration", g.queue],
    ["Callback dial mode", g.dial], ["Callback number handling", g.number], ["Initial delay configuration", g.delay], ["Retry configuration", g.retry], ["External integration requirements", g.ext],
    ["Relevant AWS APIs", g.apis.length ? g.apis : ["None required for the native path"]], ["Required IAM permissions", g.iam],
  ];
  return (
    <details className="rt-guide" id={`${ns}guide-${sc.id}`} data-testid={`guide-${ns}${sc.id}`}>
      <summary><span className="mono text-xs opacity-60">{String(sc.n).padStart(2, "0")}</span>How to Configure This in Amazon Connect · {sc.title}<span className={`cb-nature ${sc.nature === "Custom pattern" ? "is-custom" : ""}`}>{sc.nature}</span></summary>
      <ol className="cb-guide">
        {rows.map(([h, b], i) => <li key={h}><h4><span className="mono">{i + 1}.</span> {h}</h4>{Array.isArray(b) ? <ul>{b.map((x) => <li key={x}>{x}</li>)}</ul> : <p>{b}</p>}</li>)}
        <li><h4><span className="mono">12.</span> Official AWS documentation</h4><ul>{g.docs.map((d) => <li key={d}><a className="underline" href={DOCS[d].url} target="_blank" rel="noreferrer" data-testid={`link-doc-${ns}${sc.id}-${d}`}>{DOCS[d].label}</a></li>)}</ul></li>
        <li><h4><span className="mono">13.</span> Implementation limitations and prerequisites</h4><ul>{g.limits.map((x) => <li key={x}>{x}</li>)}</ul></li>
      </ol>
    </details>
  );
}
