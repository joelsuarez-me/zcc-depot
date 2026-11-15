import type { SimDef, SimScenario } from "./types";

function sys(id: string, label: string, req: string, res: string, fields: [string, string][], fail = false): SimScenario {
  return { id, label, summary: `Simulated ${label} lookup through Lambda. No real request or credentials.`, steps: [
    { stage: 0, caption: "The contact flow invokes a Lambda function with contact attributes.", panels: [{ title: "Invoke", rows: [["Function", "lookup-" + id + " (sample)"], ["Input", "ani=+15550104471"]] }], log: "Lambda invoked", status: { label: "Loading", tone: "info" } },
    { stage: 1, caption: "Lambda calls the external API (simulated).", panels: [{ title: "Sample request", rows: [["Request", req], ["Auth", "Stored secret reference (not shown)", "muted"]] }], log: "Request sent to " + label },
    { stage: 2, caption: fail ? "The external system returns an error." : "The external system responds.", panels: [{ title: "Sample response", rows: [["Response", res, fail ? "bad" : "ok"]] }], log: fail ? "Error response" : "200 OK", status: fail ? { label: "Error", tone: "bad" } : { label: "Success", tone: "ok" } },
    { stage: 3, caption: fail ? "Lambda returns a safe fallback; the flow continues without data." : "Lambda returns selected fields as contact attributes.", panels: [{ title: "Attributes", rows: fail ? [["lookupStatus", "error", "bad"]] : fields.map(([k, v]) => [k, v] as [string, string]) }], log: "Attributes returned" },
    { stage: 4, caption: "The agent workspace displays the configured context.", panels: [{ title: "Workspace", rows: fail ? [["Context", "Unavailable - agent asks caller", "warn"]] : fields.map(([k, v]) => [k, v, "info"] as [string, string, "info"]) }], log: "Workspace updated" },
  ] };
}

export const integrationSim: SimDef = {
  title: "External system integration",
  stages: ["Lambda", "Request", "Response", "Attributes", "Workspace"],
  scenarioLabel: "External system",
  scenarios: [
    sys("salesforce", "Salesforce", "GET /services/data/v60.0/query?q=Contact by phone", "{ Name: 'Mara Okafor', Tier: 'Gold' }", [["crmName", "Mara Okafor"], ["crmTier", "Gold"]]),
    sys("servicenow", "ServiceNow", "GET /api/now/table/incident?caller_phone=...", "{ number: 'INC0012931', state: 'In progress' }", [["incident", "INC0012931"], ["incidentState", "In progress"]]),
    sys("rest", "Custom REST", "POST /v1/customers/lookup", "{ id: 'c_8812', plan: 'Plus' }", [["customerId", "c_8812"], ["plan", "Plus"]]),
    sys("db", "Customer DB", "SELECT id, segment FROM customers WHERE phone = ?", "504 Gateway Timeout (simulated)", [], true),
    sys("oms", "Order Management", "GET /orders?customer=c_8812&limit=1", "{ order: 'HP-77-3150', status: 'Shipped' }", [["lastOrder", "HP-77-3150"], ["orderStatus", "Shipped"]]),
  ],
  boundary: ["Lambda and external API calls are custom development in the customer's AWS account.", "Third-party systems require their own contracts, credentials and security review.", "All requests and responses on this page are simulated."],
};
