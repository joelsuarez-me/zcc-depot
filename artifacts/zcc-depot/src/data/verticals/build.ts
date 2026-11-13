import type { UseCaseSeed, VerticalUseCase, WorkflowNode } from "./types";

export function buildUseCases(industryId: string, seeds: UseCaseSeed[]): VerticalUseCase[] {
  return seeds.map(seed => {
    const workflow: WorkflowNode[] = [
      { id: "contact", label: "Customer contact", component: "Customer journey", detail: seed.contact, kind: "Conceptual workflow" },
      { id: "routing", label: "Contact routing", component: "Amazon Connect", detail: seed.route, kind: "AWS configuration" },
      { id: "interaction", label: "Agent interaction", component: "Zendesk Agent Workspace", detail: seed.assist, kind: "Zendesk capability" },
      { id: "case", label: "Ticket & follow-through", component: "Zendesk ticket", detail: seed.record, kind: "Zendesk capability" },
      { id: "resolution", label: "Business resolution", component: seed.system, detail: `${seed.resolve} ${seed.integration}`, kind: "External integration" },
    ];
    return {
      id: `${industryId}-${seed.id}`, industryId, title: seed.title, category: seed.category, challenge: seed.challenge,
      solution: [
        { kind: "Zendesk capability", title: "Connected agent and case experience", detail: `${seed.assist} ${seed.record} Channel availability, permissions and ticket behavior depend on configuration.` },
        { kind: "AWS configuration", title: "Customer-defined routing", detail: `${seed.route} Voice contact flows and queues must be configured in the customer's Amazon Connect environment; this is not a single routing engine for every channel.` },
        { kind: "External integration", title: seed.system, detail: `${seed.integration} These industry-specific operations are not native Zendesk Contact Center functionality.` },
        { kind: "Conceptual workflow", title: "Optional AI, with explicit boundaries", detail: "AI assistance or self-service can be explored only where licensed, enabled and approved for the use case. Use prepared knowledge examples otherwise. Human review, authentication and regulated decisions are not replaced by caller recognition or generated answers." },
      ],
      workflow,
      architecture: [
        { ...workflow[1], id: "amazon-connect", label: "Amazon Connect" },
        { ...workflow[2], id: "agent-workspace", label: "Agent Workspace" },
        { ...workflow[3], id: "zendesk-tickets", label: "Zendesk tickets" },
        { ...workflow[4], id: "customer-systems", label: "Customer systems" },
      ],
      outcomes: seed.outcomes,
      demoSteps: [
        { title: "Introduce the customer moment", detail: `${seed.contact} Use synthetic identities and explain the challenge before showing tools.`, conceptual: true },
        { title: "Trace the routing decision", detail: `${seed.route} Use a configured sandbox flow if available; otherwise present this node as a conceptual walkthrough.`, conceptual: true },
        { title: "Show the agent experience", detail: `${seed.assist} Demonstrate only the workspace features enabled in the environment; label any prepared screen or AI response as simulated.`, conceptual: true },
        { title: "Capture the follow-through", detail: `${seed.record} Use a test ticket where configured. Show external-system actions using a labeled prepared payload unless a validated test integration exists.`, conceptual: true },
        { title: "Validate the business resolution", detail: `${seed.resolve} Explain the integration boundary, who owns the next action and which evidence would confirm the outcome.`, conceptual: true },
      ],
      discovery: seed.discovery, sourceIds: ["zcc", "agent", "flows", "tickets"],
    };
  });
}
