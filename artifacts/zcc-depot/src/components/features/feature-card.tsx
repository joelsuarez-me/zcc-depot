import { ArrowRight, Play } from "lucide-react";
import type { EnterpriseFeature } from "@/data/feature-types";
import { FeatureIcon } from "./feature-icon";
import { ClassChips } from "./feature-bits";

export function FeatureCard({ feature, onOpen }: { feature: EnterpriseFeature; onOpen: (id: string, demo?: boolean) => void }) {
  return (
    <article className="fx-card" data-testid={`card-feature-${feature.id}`}>
      <div className="flex items-start gap-3">
        <span className="fx-icon"><FeatureIcon name={feature.icon} /></span>
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug tracking-tight">{feature.title}</h3>
          <p className="mt-0.5 line-clamp-2 text-[0.82rem] text-[#11110D]/65">{feature.description}</p>
        </div>
      </div>
      <p className="border-l-2 border-[#D1F470] pl-2.5 text-[0.8rem] leading-snug text-[#11110D]/80"><span className="mono mr-1 text-[0.62rem] uppercase tracking-wider text-[#203524]/70">Outcome</span>{feature.outcome}</p>
      <ClassChips feature={feature} />
      <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
        <button type="button" className="fx-btn fx-btn-ink" onClick={() => onOpen(feature.id)} data-testid={`button-explore-${feature.id}`}>Explore Feature<ArrowRight className="h-3.5 w-3.5" aria-hidden /></button>
        <button type="button" className="fx-btn fx-btn-ghost" onClick={() => onOpen(feature.id, true)} data-testid={`button-launch-demo-${feature.id}`}><Play className="h-3.5 w-3.5" aria-hidden />Launch Demo</button>
      </div>
    </article>
  );
}
