import type { SimDef } from "./types";

export const workforceSim: SimDef = {
  title: "Workforce and quality",
  stages: ["Forecast", "Staffing", "Schedule", "Adherence", "QA", "Coaching", "Trends"],
  scenarioLabel: "Week",
  scenarios: [{ id: "week", label: "Sample week", summary: "Fictional team of 14 agents, one week.", steps: [
    { stage: 0, caption: "Zendesk WFM forecasts demand from historical volume (fictional).", panels: [{ title: "Forecast - Zendesk WFM", rows: [["Mon", "1,284 contacts"], ["Tue", "1,167"], ["Wed", "1,203"], ["Peak", "10:00-11:30"]] }], log: "Forecast generated" },
    { stage: 1, caption: "Required staffing is derived per interval.", panels: [{ title: "Staffing - Zendesk WFM", rows: [["Peak need", "13 agents"], ["Planned", "12 agents", "warn"], ["Gap", "1 agent at peak", "warn"]] }], log: "Staffing gap flagged" },
    { stage: 2, caption: "Schedules are published to agents.", panels: [{ title: "Schedule - Zendesk WFM", rows: [["Priya N.", "08:00-16:30"], ["Dev R.", "09:00-17:30"], ["Ana M.", "10:00-18:30"]] }], log: "Schedules published" },
    { stage: 3, caption: "Adherence compares fictional activity with a sample schedule.", panels: [{ title: "Adherence", rows: [["Priya N.", "96.4%", "ok"], ["Dev R.", "88.1%", "warn"], ["Ana M.", "93.7%", "ok"]], note: "Illustrative inputs only. Supported Contact Center ingestion and Zendesk WFM activity coverage require deployment-specific validation." }], log: "Sample adherence reviewed" },
    { stage: 4, caption: "Zendesk QA scores a sample of conversations.", panels: [{ title: "QA - Zendesk QA", rows: [["Reviewed", "38 calls"], ["Avg score", "84.6"], ["Lowest category", "Verification steps", "warn"]] }], log: "QA reviews scored" },
    { stage: 5, caption: "A coaching session is assigned from QA findings.", panels: [{ title: "Coaching", rows: [["Agent", "Dev R."], ["Topic", "Verification steps"], ["Status", "Scheduled Thu 14:00", "info"]] }], log: "Coaching assigned" },
    { stage: 6, caption: "Trends across the week.", panels: [{ title: "Trends", rows: [["Adherence", "+1.8 pts", "ok"], ["QA score", "+2.3 pts", "ok"], ["Peak gap", "Unchanged", "warn"]] }], log: "Weekly trends", status: { label: "Week reviewed", tone: "ok" } },
  ] }],
  boundary: ["Zendesk WFM and Zendesk QA are separately entitled Zendesk products and require add-on setup.", "Amazon Connect offers its own forecasting and scheduling capabilities; this demo shows the Zendesk products."],
};
