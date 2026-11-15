/** Public educational metadata only. Presenter guidance belongs exclusively on the API server. */
export type FeatureCategoryId = "voice" | "ai" | "agent" | "operations" | "architecture" | "security";
export type FeatureClassification =
  | "Native Zendesk Contact Center"
  | "Amazon Connect Configuration"
  | "Zendesk Product / Add-On"
  | "AWS Service Integration"
  | "Third-Party Integration"
  | "Custom Development"
  | "Availability Requires Verification";
export type FeatureDemoKind = "verification" | "workspace" | "ivr" | "assist" | "integration" | "continuity" | "workforce" | "lifecycle" | "journey";
export type EvidenceStatus = "documentation-reviewed" | "requires-verification" | "missing-evidence";
export interface FeatureEvidence {
  owner: string | null;
  status: EvidenceStatus;
  reviewedAt: string | null;
  productBoundary: FeatureClassification[];
  dependencies: string[];
  availabilityQualification: string;
  humanApproval: null;
}
export interface FeatureSource {
  id: string;
  label: string;
  href: string;
  /** Documentation claim review date; never evidence of deployment validation. */
  lastVerified: string | null;
}
export interface FeatureArchitecture {
  nodes: { id: string; label: string; detail: string; boundary: "Customer" | "AWS" | "Zendesk" | "External" }[];
  edges: { from: string; to: string; label: string; conditional?: boolean }[];
  notes: string[];
}
export interface EnterpriseFeature {
  id: string;
  title: string;
  aliases: string[];
  categories: FeatureCategoryId[];
  icon: string;
  description: string;
  overview: string;
  customerProblem: string;
  outcome: string;
  benefits: string[];
  useCases: { title: string; description: string }[];
  industries: string[];
  keywords: string[];
  classifications: FeatureClassification[];
  availability: string;
  lastVerified: string | null;
  sources: FeatureSource[];
  evidence: FeatureEvidence;
  configuration: { title: string; detail: string }[];
  architecture: FeatureArchitecture;
  demo: { kind: FeatureDemoKind; href?: string; label: string; reused: boolean };
  /** Keep the original brief and attribution discoverable, without weakening its qualifications. */
  legacy?: { index: number; title: string; description: string; sources: { label: string; href: string }[] };
}
export const FEATURE_CATEGORIES: { id: FeatureCategoryId; label: string; icon: string; description: string }[] = [
  { id: "voice", label: "Voice & Telephony", icon: "PhoneCall", description: "Connect callers to the right resolution path." },
  { id: "ai", label: "AI & Automation", icon: "Bot", description: "Explore supported self-service and agent assistance." },
  { id: "agent", label: "Agent Experience", icon: "Headset", description: "Bring people, conversations and context together." },
  { id: "operations", label: "Operations & Workforce", icon: "ChartNoAxesCombined", description: "Understand demand, quality and team performance." },
  { id: "architecture", label: "Architecture & Integrations", icon: "Workflow", description: "Trace the boundaries behind a connected service." },
  { id: "security", label: "Security & Governance", icon: "ShieldCheck", description: "Design verification, resilience and responsible controls." },
];
export const FEATURE_CLASSIFICATIONS: { value: FeatureClassification; description: string }[] = [
  { value: "Native Zendesk Contact Center", description: "A documented Contact Center workflow; prerequisites and deployment-specific availability still apply." },
  { value: "Amazon Connect Configuration", description: "Configured in the underlying Connect environment; not automatically enabled by a Zendesk subscription." },
  { value: "Zendesk Product / Add-On", description: "Uses a separately entitled Zendesk product or add-on; confirm licensing and supported integration." },
  { value: "AWS Service Integration", description: "Depends on an additional AWS service, permissions, regional support and potential AWS charges." },
  { value: "Third-Party Integration", description: "Depends on an external provider, contract, API or supported connector." },
  { value: "Custom Development", description: "An illustrative extension requiring implementation, security review and ongoing ownership." },
  { value: "Availability Requires Verification", description: "Do not promise native availability, plan inclusion, GA status or deployment support without current confirmation." },
];
