import type { SimDef, SimScenario } from "./types";

function build(id: string, label: string, summary: string, associate: boolean): SimScenario {
  const ticket = associate ? "#48211 (existing) Return label not received" : "#48390 (new) Call with Mara Okafor";
  return { id, label, summary, steps: [
    { stage: 0, actionLabel: "Answer call", caption: "The agent is available and a call is offered.", panels: [{ title: "Agent state", rows: [["Status", "Available", "ok"], ["Offer", "Inbound - Orders queue", "info"]] }], log: "Call offered", status: { label: "Ringing", tone: "info" } },
    { stage: 0, actionLabel: "Review customer profile", caption: "The agent accepts the call inside the Zendesk Agent Workspace.", panels: [{ title: "Agent state", rows: [["Status", "On call", "info"], ["Timer", "00:00:04"]] }], log: "Call accepted", say: { who: "Agent", text: "Thanks for calling Harbor & Pine, this is Priya." }, status: { label: "On call", tone: "info" } },
    { stage: 1, actionLabel: associate ? "Associate existing ticket" : "Create sample ticket", caption: "The requester profile and interaction history are inspected.", panels: [{ title: "Customer profile", rows: [["Name", "Mara Okafor (fictional)"], ["Since", "2021"], ["Recent", "2 tickets, 1 chat"]] }, { title: "History", rows: [["#48211", "Return label not received - Open", "warn"], ["#47002", "Sizing question - Solved", "muted"]] }], log: "Profile viewed" },
    { stage: 2, actionLabel: "Add sample notes", caption: associate ? "The call is associated with the open ticket that matches the reason for calling." : "A new ticket is created for this call.", panels: [{ title: "Ticket", rows: [["Ticket", ticket, "ok"], ["Channel", "Voice"], ["Action", associate ? "Associated" : "Created"]] }], log: associate ? "Call linked to #48211" : "Ticket #48390 created" , say: { who: "Caller", text: "I am still waiting on the return label for my jacket." } },
    { stage: 3, actionLabel: "End call & select disposition", caption: "Internal notes are captured while the call continues.", panels: [{ title: "Ticket", rows: [["Ticket", ticket], ["Internal note", "Label re-sent to email on file; caller confirmed address."]] }], log: "Internal note added" },
    { stage: 4, actionLabel: "Complete after-call work", caption: "The call ends and a disposition is selected.", panels: [{ title: "Wrap-up", rows: [["Disposition", "Returns - Resolved on call", "ok"], ["Ticket status", "Solved"], ["Custom field", "Return reason: wrong size (illustrative custom field)", "info"]] }], log: "Call ended; disposition set", status: { label: "After-call work", tone: "warn" } },
    { stage: 5, caption: "After-call work completes and the agent returns to available.", panels: [{ title: "Agent state", rows: [["Status", "Available", "ok"], ["ACW duration", "00:01:12"]] }, { title: "Ticket", rows: [["Ticket", ticket, "ok"], ["Status", "Solved"]] }], log: "ACW complete", status: { label: "Available", tone: "ok" } },
  ] };
}

export const workspaceSim: SimDef = {
  title: "Unified agent workspace",
  stages: ["Answer", "Profile", "Ticket", "Notes", "Disposition", "ACW"],
  scenarioLabel: "Ticket path",
  scenarios: [build("create", "Create new ticket", "No open ticket matches, so a new one is created.", false), build("associate", "Associate existing ticket", "An open ticket matches and the call is linked to it.", true)],
  boundary: ["Native: answering, profile, history and ticket handling in Zendesk Agent Workspace.", "Illustrative custom: disposition values and custom ticket fields are configured per deployment."],
};
