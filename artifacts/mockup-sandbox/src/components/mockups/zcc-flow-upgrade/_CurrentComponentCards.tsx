import type { ReactNode } from "react";
import { CORE_COMPONENTS } from "./_core-components";
function Reveal({children,className}:{children:ReactNode;className?:string;delay?:number}){return <div className={className}>{children}</div>}
export function CurrentComponentCards(){return <section className="mt-10 bg-[#F5F5F2] p-8 text-[#11110D]">        <div className="grid gap-4 md:grid-cols-2">
          {CORE_COMPONENTS.map((c, k) => (
            <Reveal key={c.n} delay={k * 0.05} className="rounded-3xl border border-[#11110D]/10 bg-[#FBFBF8] p-7">
              <div className="mono text-sm text-[#203524]/50">{c.n}</div>
              <h3 className="mt-3 text-xl font-semibold">{c.t}</h3>
              <p className="mt-2 leading-relaxed text-[#11110D]/70">{c.d}</p>
              <div className="mt-4 flex flex-wrap gap-2">{c.chips.map((x) => <span key={x} className="rounded-full bg-[#203524]/8 px-3 py-1 text-xs">{x}</span>)}</div>
            </Reveal>
          ))}
        </div></section>}
