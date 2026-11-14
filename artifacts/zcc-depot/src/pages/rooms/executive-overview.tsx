import { useState } from "react";
import { Check, X } from "lucide-react";
import { RoomFrame, RoomSection, SourceNote } from "@/components/room-kit";
import { DemoButton, Ext } from "@/components/kit";
import { USE_CASES } from "@/data/content";
import { CustomerProof } from "@/components/customer-proof";

export default function ExecutiveOverview() {
  const [uc, setUc] = useState(0);
  const [after, setAfter] = useState(true);
  const u = USE_CASES[uc];
  return (
    <RoomFrame id="executive-overview" lede="Explore how connected service changes the customer experience, with customer-reported results and practical scenarios." actions={<DemoButton label="Guided demo" testId="button-room-demo" />}>
      <RoomSection id="before-after" eyebrow="Before and after" title="Make the change visible" lede="Pick a scenario, then flip between what breaks today and what the platform enables." tone="panel">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Scenarios">
          {USE_CASES.map((x, i) => <button key={x.t} type="button" role="tab" aria-selected={i === uc} onClick={() => setUc(i)} className={`room-pill ${i === uc ? "is-on" : ""}`} data-testid={`tab-scenario-${i}`}>{x.t}</button>)}
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-[15px] leading-relaxed text-[#11110D]/75">{u.scenario}</p>
            <div className="depot-mode is-light mt-5 w-max" role="radiogroup" aria-label="View">
              <button type="button" role="radio" aria-checked={!after} onClick={() => setAfter(false)} className={!after ? "is-on" : ""} data-testid="button-view-before">Today</button>
              <button type="button" role="radio" aria-checked={after} onClick={() => setAfter(true)} className={after ? "is-on" : ""} data-testid="button-view-after">With the platform</button>
            </div>
          </div>
          <div className="lg:col-span-7">
            <ul className={`exec-list ${after ? "is-after" : ""}`}>
              {(after ? [...u.enables, ...u.outcome] : u.broken).map((x) => (
                <li key={x}>{after ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : <X className="h-4 w-4 shrink-0" aria-hidden />}{x}</li>
              ))}
            </ul>
          </div>
        </div>
        <SourceNote>Outcomes describe intended direction, not measured results. Confirm baselines with the customer before quantifying.</SourceNote>
      </RoomSection>

      <RoomSection id="customer-proof" eyebrow="Customer proof" title="Customer-reported results" lede="Figures are as reported in Zendesk customer materials for these specific customers. They are not predictions for a new deployment.">
        <CustomerProof />
        <SourceNote>Customer-reported results, not independent measurements or guarantees for a new deployment. Read the public stories: <Ext href="https://www.zendesk.com/customer/the-good-meal-co/" className="underline">The Good Meal Co</Ext>{" · "}<Ext href="https://www.zendesk.com/customer/support-zebra/" className="underline">SupportZebra</Ext>{" · "}<Ext href="https://www.zendesk.com/customer/telus/" className="underline">TELUS</Ext>. Good Meal's percentages describe channel mix; TELUS compares asynchronous messaging with voice, not improvements to voice telephony.</SourceNote>
      </RoomSection>

    </RoomFrame>
  );
}
