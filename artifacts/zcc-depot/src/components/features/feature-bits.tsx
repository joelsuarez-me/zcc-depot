import { FEATURE_CLASSIFICATIONS, type EnterpriseFeature } from "@/data/feature-types";

export function ClassChips({ feature, dark = false }: { feature: EnterpriseFeature; dark?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1">
      {feature.classifications.map((c) => (
        <span key={c} title={FEATURE_CLASSIFICATIONS.find((x) => x.value === c)?.description}
          className={`fx-chip ${c === "Availability Requires Verification" ? "is-warn" : ""} ${dark ? "!border-[#F5F5F2]/25 !bg-transparent !text-[#F5F5F2]/85" : ""}`}>{c}</span>
      ))}
    </div>
  );
}

export function VerifiedDate({ date }: { date: string | null }) {
  if (!date) return <span className="fx-chip is-warn" data-testid="text-unverified">Unverified - review pending</span>;
  return <span className="mono text-[0.7rem] text-[#11110D]/60" data-testid="text-reviewed">Claim reviewed {date}</span>;
}
