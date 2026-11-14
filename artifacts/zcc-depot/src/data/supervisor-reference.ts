/** Review date is advanced only following an actual documentation review. */
export const SUPERVISOR_REVIEW_DATE = "2026-11-13";
const root = "https://docs.aws.amazon.com/connect/latest/adminguide/";
export const SUPERVISOR_SOURCES = [
  { id: "guide", title: "Amazon Connect Administrator Guide", url: root },
  { id: "realtime", title: "Real-time metrics reports", url: root + "real-time-metrics-reports.html" },
  { id: "historical", title: "Historical metrics and interval attribution", url: root + "historical-metrics.html" },
  { id: "definitions", title: "Metric definitions and calculation logic", url: root + "metrics-definitions.html" },
  { id: "agents", title: "Agent event streams — Kinesis Data Streams", url: root + "agent-event-streams.html" },
  { id: "records", title: "Contact record data model", url: root + "ctr-data-model.html" },
  { id: "dashboards", title: "Native dashboards and refresh frequencies", url: root + "dashboards.html" },
  { id: "history", title: "Documentation history", url: root + "doc-history.html" },
  { id: "rules", title: "Native real-time metrics rules and actions", url: root + "rule-real-time-metrics.html" },
  { id: "events", title: "Contact events — EventBridge integration", url: root + "contact-events.html" },
  { id: "lake", title: "Analytics data lake — delayed analytical data", url: root + "data-lake.html" },
  { id: "cloudwatch", title: "Instance metrics sent to CloudWatch", url: root + "monitoring-cloudwatch.html" },
  { id: "permissions", title: "Dashboard and reporting permissions", url: root + "dashboard-required-permissions.html" },
  { id: "regions", title: "Feature availability by AWS Region", url: root + "regions.html" },
  { id: "transfers", title: "Configured quick connects and transfer destinations", url: root + "quick-connects.html" },
  { id: "status", title: "Agent custom statuses", url: root + "agent-custom.html" },
  { id: "status-change", title: "Native supervisor availability changes and Next activity", url: root + "rtm-change-agent-activity-state.html" },
  { id: "tickets", title: "Zendesk Tickets API — separate integration surface", url: "https://developer.zendesk.com/api-reference/ticketing/tickets/tickets/" },
] as const;
export const METRIC_NOTES = {
  service: "Native Service level X counts queue removals within X seconds by answer, customer abandonment or callback request, divided by contacts queued. This is NOT the same as an answered-within-target measure. This lab also offers an explicitly custom answered-only measure.",
  cohort: "Contact-record metrics use disconnect-time cohorts; queue legs are separate records in this model. A transferred leg is not another unique arriving customer. Still-waiting contacts appear in live gauges, not completed-record denominators. Completed ACW can update an earlier disconnect cohort.",
  occupancy: "Occupancy uses agent activity time: contact time / (contact time + idle time). Concurrency does not multiply occupied seconds. Break, lunch, custom and offline time are not idle routing capacity.",
  asa: "ASA is average queue answer time for agent-answered contacts; the queue duration includes whisper time in the real service. The lab uses 10-second event steps with separate entry and IVR steps, not real network or whisper latency.",
  aht: "AHT includes interaction, customer hold, ACW and task pause where applicable. The lab models interaction, hold and ACW; task pause is zero. Figures are illustrative, not live Connect metrics.",
  freshness: "Native real-time reports refresh current values about every 15 seconds; historical metrics are near-real-time. Dashboards have surface-specific refresh rates (time-series widgets can refresh every 15 minutes). The lab runs an accelerated synthetic clock.",
  actions: "All actions are simulated. Routing-profile changes require administrative permissions; overflow needs configured flow logic; staffing, announcements, callbacks and escalations need their respective configuration. This page never calls AWS.",
  status: "Native managers with Agent status - View permission can change availability in real-time reports/dashboards. During an active contact, changes appear as Next activity rather than terminating the contact. This lab simplifies the workflow to idle-agent changes only.",
  alerts: "Connect has native real-time metrics rules with email, task and EventBridge actions. Custom integrations can consume EventBridge/contact events or Kinesis agent streams with Lambda. CloudWatch instance metrics are a separate subset, not a mirror of every report metric.",
  limits: "Validate Region, instance version, channels, quotas, security profiles, hierarchy/tag access, service charges and data lake permissions before implementation. This fictional voice-first model simplifies media concurrency, transfers, IVR and staffing; it does not reproduce internal routing or Erlang staffing algorithms.",
};
