export type Category = "Service & routing" | "Risk & escalation" | "Applications & onboarding" | "Billing & transactions" | "Technical support" | "Customer engagement";
export type CapabilityKind = "Zendesk capability" | "AWS configuration" | "External integration" | "Conceptual workflow";
export type Industry = { id: string; name: string; icon: string; description: string; qualification: string };
export type WorkflowNode = { id: string; label: string; component: string; detail: string; kind: CapabilityKind };
export type UseCaseSource = { id: string; title: string; url: string; scope: string };
export type VerticalUseCase = {
  id: string; industryId: string; title: string; category: Category; challenge: string;
  solution: { kind: CapabilityKind; title: string; detail: string }[];
  workflow: WorkflowNode[]; architecture: WorkflowNode[];
  outcomes: string[]; demoSteps: { title: string; detail: string; conceptual: boolean }[];
  discovery: string[]; sourceIds: string[];
};
export type UseCaseSeed = {
  id: string; title: string; category: Category; challenge: string;
  contact: string; route: string; assist: string; record: string; resolve: string;
  system: string; integration: string; outcomes: [string, string, string]; discovery: [string, string, string];
};
