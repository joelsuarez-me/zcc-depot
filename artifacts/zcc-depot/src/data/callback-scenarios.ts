import type { CbConfig, ScenarioId } from "@/lib/callback-engine";

export type Kind = "customer" | "channel" | "connect" | "flow" | "decision" | "queue" | "agent" | "aws" | "ext" | "ai" | "schedule" | "fail" | "retry" | "zendesk";
export type CNode = { id: string; x: number; y: number; kind: Kind; label: string; sub?: string; role: string };
export type CEdge = [string, string, ("fail" | "retry" | "opt")?];
export type ControlKey = keyof CbConfig;
export type Surface = "phone" | "web" | "calendar" | "chat" | "ai" | "crm" | "dashboard" | "tree" | "system";
export type Guide = { native: string; resources: string[]; blocks: string[]; queue: string; dial: string; number: string; delay: string; retry: string; ext: string; apis: string[]; iam: string[]; docs: (keyof typeof DOCS)[]; limits: string[] };
export type Scenario = {
  id: ScenarioId; n: number; cat: "A" | "B" | "C" | "D"; title: string; tagline: string; flow: string; nature: "Native" | "Native, eligible instances only" | "Custom pattern" | "Native plus custom";
  surface: Surface; accent: string; nodes: CNode[]; edges: CEdge[]; controls: ControlKey[]; failures: CbConfig["failure"][]; defaults: Partial<CbConfig>;
  script?: { who: "customer" | "bot" | "agent"; text: string; node: string }[]; guide: Guide;
};

export const DOCS = {
  queued: { label: "Set up queued callback", url: "https://docs.aws.amazon.com/connect/latest/adminguide/setup-queued-cb.html" },
  customerFirst: { label: "Customer-first callbacks", url: "https://docs.aws.amazon.com/connect/latest/adminguide/customer-first-cb.html" },
  failed: { label: "Failed callback attempts", url: "https://docs.aws.amazon.com/connect/latest/adminguide/failed-callback-attempt.html" },
  initiation: { label: "Contact initiation methods", url: "https://docs.aws.amazon.com/connect/latest/adminguide/contact-initiation-methods.html" },
  sov: { label: "StartOutboundVoiceContact API", url: "https://docs.aws.amazon.com/connect/latest/APIReference/API_StartOutboundVoiceContact.html" },
  scheduler: { label: "EventBridge Scheduler", url: "https://docs.aws.amazon.com/scheduler/latest/UserGuide/what-is-scheduler.html" },
  sfn: { label: "AWS Step Functions", url: "https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html" },
  hours: { label: "Hours of operation", url: "https://docs.aws.amazon.com/connect/latest/adminguide/set-hours-operation.html" },
  lex: { label: "Amazon Lex with Amazon Connect", url: "https://docs.aws.amazon.com/connect/latest/adminguide/amazon-lex.html" },
};

export const CATEGORIES: Record<Scenario["cat"], string> = { A: "Native and voice callbacks", B: "Digital and scheduled callbacks", C: "Intelligent and external-system callbacks", D: "Advanced callback orchestration" };
export const ROOM_ID = (id: ScenarioId) => `callback-${id === "queued" ? "queued" : id}`;

const IAM_API = ["connect:StartOutboundVoiceContact on the instance, flow and queue", "lambda:InvokeFunction for the Connect instance", "Scoped execution role; no wildcard instance access"];
const IAM_SCHED = [...IAM_API, "scheduler:CreateSchedule, UpdateSchedule, DeleteSchedule", "iam:PassRole for the scheduler target role", "dynamodb:PutItem, UpdateItem on the bookings table"];
const NATIVE_RETRY = "Agent-first only: Max retries and Minimum time between attempts on the Transfer to queue (callback) block. Ringing no-answer retries; voicemail counts as connected; rejection is not an attempt.";
const CUSTOM_RETRY = "No native retry for this custom pattern. Implement retry counters, waits and limits in the application and record each attempt.";

const g = (o: Partial<Guide> & Pick<Guide, "native">): Guide => ({
  resources: ["Amazon Connect instance", "Callback queue with outbound caller ID", "Routing profile including the queue"], blocks: [], queue: "Add the queue to routing profiles of agents who should handle callbacks; set priority and delay per routing profile.",
  dial: "Agent-first (default).", number: "Set callback number from customer number or captured input; must be E.164.", delay: "Initial delay is a minimum wait before routing, not an appointment.", retry: NATIVE_RETRY, ext: "None required.",
  apis: [], iam: ["connect permissions to edit flows and queues (admin)"], docs: ["queued", "failed"], limits: ["Callbacks are new contacts linked to the original."], ...o,
});

const NA: CbConfig["failure"][] = ["none", "no-answer", "max-retries", "busy", "invalid", "voicemail", "reject", "expiry"];
const API: CbConfig["failure"][] = ["none", "no-answer", "max-retries", "busy", "invalid", "voicemail", "reject", "api", "expiry"];

export const SCENARIOS: Scenario[] = [
  {
    id: "queued", n: 1, cat: "A", title: "Traditional queued voice callback", tagline: "Long wait detected, callback offered, caller hangs up, place kept.", flow: "Inbound · IVR · Queue · Offer · Callback contact · Agent · Dial", nature: "Native", surface: "phone", accent: "#17494D",
    nodes: [
      { id: "caller", x: 0, y: 1, kind: "customer", label: "Caller", sub: "C1 inbound", role: "The original inbound voice contact." },
      { id: "ivr", x: 1, y: 1, kind: "flow", label: "Entry flow IVR", sub: "Menu: billing", role: "Inbound flow sets the working queue." },
      { id: "qin", x: 2, y: 1, kind: "queue", label: "Customer queue flow", sub: "Get queue metrics", role: "Plays hold treatment and checks estimated wait." },
      { id: "served", x: 2, y: 0, kind: "agent", label: "Served live", sub: "Below threshold", role: "Branch when the wait is short: no callback." },
      { id: "offer", x: 3, y: 1, kind: "decision", label: "Callback offer", sub: "Wait over threshold", role: "Get customer input asks to accept a callback." },
      { id: "setnum", x: 4, y: 1, kind: "flow", label: "Set callback number", sub: "E.164 check", role: "Stores the number to dial." },
      { id: "xfer", x: 5, y: 1, kind: "connect", label: "Transfer to queue", sub: "Callback created", role: "Creates the new callback contact C2 with initial delay and retry settings." },
      { id: "disc", x: 5, y: 0, kind: "customer", label: "C1 disconnects", sub: "Free to hang up", role: "The original call ends; C2 keeps the inherited start time for priority." },
      { id: "cbq", x: 6, y: 1, kind: "queue", label: "Callback queue", sub: "C2 waiting", role: "C2 waits in queue like any contact." },
      { id: "agent", x: 6, y: 2.4, kind: "agent", label: "Agent accepts", sub: "Agent-first", role: "Agent is reserved before the dial." },
      { id: "dial", x: 5, y: 2.4, kind: "connect", label: "Outbound dial", sub: "Queue caller ID", role: "Connect dials the customer." },
      { id: "conn", x: 4, y: 2.4, kind: "customer", label: "Customer connected", sub: "Outbound whisper", role: "Customer answers and hears the outbound whisper." },
      { id: "retry", x: 3, y: 2.4, kind: "retry", label: "Native retry", sub: "No-answer only", role: "Max retries and minimum interval." },
      { id: "fail", x: 2, y: 2.4, kind: "fail", label: "Failed", sub: "Ended", role: "Terminal failure." },
    ],
    edges: [["caller", "ivr"], ["ivr", "qin"], ["qin", "served", "opt"], ["qin", "offer"], ["offer", "setnum"], ["setnum", "xfer"], ["xfer", "disc", "opt"], ["xfer", "cbq"], ["cbq", "agent"], ["agent", "dial"], ["dial", "conn"], ["dial", "retry", "retry"], ["retry", "cbq", "retry"], ["dial", "fail", "fail"], ["setnum", "fail", "fail"]],
    controls: ["wait", "threshold", "phone", "queue", "agents", "initialDelay", "maxRetries", "minInterval", "failAttempts", "customRecovery", "zendesk"], failures: NA, defaults: {},
    guide: g({ native: "Native queued callback. No custom code required.", blocks: ["Get queue metrics", "Check contact attributes (wait vs threshold)", "Get customer input (offer)", "Set callback number", "Transfer to queue (Transfer to callback queue tab)", "Customer queue flow, Agent whisper, Outbound whisper"], ext: "None. Optional Zendesk integration may log the interaction.", limits: ["Initial delay is not an appointment.", "C2 is a new contact; C1 ends.", "Equal queue priority: C2 inherits C1 start time."] }),
  },
  {
    id: "agent-first", n: 2, cat: "A", title: "Agent-first callback", tagline: "The default: agent accepts first, then Connect dials the customer.", flow: "Queue · Profile · Agent accepts · Whisper · Dial · Answer · Connected", nature: "Native", surface: "phone", accent: "#1F73B7",
    nodes: [
      { id: "cbq", x: 0, y: 1, kind: "queue", label: "Callback queue", sub: "C2 waiting", role: "Callback contact waiting." },
      { id: "prof", x: 1, y: 1, kind: "decision", label: "Routing profile", sub: "Queue membership", role: "Determines which agents can receive it." },
      { id: "agentA", x: 2, y: 0.3, kind: "agent", label: "Mara Okafor", sub: "First offer", role: "First Available agent." },
      { id: "reroute", x: 2, y: 1.9, kind: "agent", label: "Next agent", sub: "After rejection", role: "Rejection is not a dial attempt; rerouted here." },
      { id: "aw", x: 3, y: 1, kind: "flow", label: "Agent whisper", sub: "Callback context", role: "Agent hears it is a callback." },
      { id: "dial", x: 4, y: 1, kind: "connect", label: "Dial customer", sub: "Agent hears ring", role: "Connect dials; agent time is spent ringing." },
      { id: "cust", x: 5, y: 1, kind: "customer", label: "Customer answers", sub: "Human or voicemail", role: "Voicemail counts as connected." },
      { id: "ow", x: 6, y: 1, kind: "flow", label: "Outbound whisper", sub: "Then connected", role: "Customer hears whisper, then talks to agent." },
      { id: "retry", x: 4, y: 2.5, kind: "retry", label: "Retry loop", sub: "Min interval", role: "Ringing no-answer retries." },
      { id: "fail", x: 5, y: 2.5, kind: "fail", label: "Failed", sub: "Busy, invalid, max", role: "Terminal failure." },
    ],
    edges: [["cbq", "prof"], ["prof", "agentA"], ["agentA", "reroute", "fail"], ["agentA", "aw"], ["reroute", "aw"], ["aw", "dial"], ["dial", "cust"], ["cust", "ow"], ["dial", "retry", "retry"], ["retry", "prof", "retry"], ["dial", "fail", "fail"]],
    controls: ["phone", "queue", "agents", "initialDelay", "maxRetries", "minInterval", "failAttempts", "customRecovery", "zendesk"], failures: NA, defaults: { failure: "no-answer", failAttempts: 1 },
    guide: g({ native: "Native default dial mode.", blocks: ["Transfer to queue (callback)", "Agent whisper flow", "Outbound whisper flow"], dial: "Agent-first is the default dial mode.", limits: ["Agent occupancy includes ringing time.", "Busy and invalid numbers are not modeled as native no-answer retries here."] }),
  },
  {
    id: "customer-first", n: 3, cat: "A", title: "Customer-first callback", tagline: "Dial the customer first; reserve an agent only after a human answers.", flow: "Eligibility · C1 · C2 queued · C3 dialed · Check call progress · Queue · Agent", nature: "Native, eligible instances only", surface: "phone", accent: "#5C3B9E",
    nodes: [
      { id: "elig", x: 0, y: 1, kind: "decision", label: "Instance check", sub: "Next-gen eligible", role: "Customer-first requires an eligible next-generation Amazon Connect Customer instance." },
      { id: "blocked", x: 0, y: 2.5, kind: "fail", label: "Blocked", sub: "Prerequisite unmet", role: "Truthful outcome when the instance is not eligible." },
      { id: "c1", x: 1, y: 1, kind: "customer", label: "C1 inbound", sub: "Accepts callback", role: "Original inbound contact." },
      { id: "c2", x: 2, y: 1, kind: "queue", label: "C2 queued", sub: "CUSTOMER_FIRST_QUEUED", role: "Callback waiting in queue." },
      { id: "c3", x: 3, y: 1, kind: "connect", label: "C3 dialed", sub: "CUSTOMER_FIRST_DIALED", role: "Customer dialed; outbound callback flow runs." },
      { id: "ccp", x: 4, y: 1, kind: "decision", label: "Check call progress", sub: "Human or machine", role: "Required block that classifies the answer." },
      { id: "xfer", x: 5, y: 1, kind: "queue", label: "Transfer to queue", sub: "After human", role: "Only a confirmed human proceeds." },
      { id: "agent", x: 6, y: 1, kind: "agent", label: "Agent connects", sub: "No ring time", role: "Agent joins a customer already on the line." },
      { id: "c4", x: 3, y: 2.5, kind: "retry", label: "C4 recreated", sub: "Custom retry", role: "Custom: Wait + retry attribute, back of queue." },
      { id: "fail", x: 5, y: 2.5, kind: "fail", label: "Failed", sub: "No native retry", role: "C2 has no agent-first retry settings." },
    ],
    edges: [["elig", "c1"], ["elig", "blocked", "fail"], ["c1", "c2"], ["c2", "c3"], ["c3", "ccp"], ["ccp", "xfer"], ["xfer", "agent"], ["ccp", "c4", "retry"], ["c4", "c2", "retry"], ["ccp", "fail", "fail"]],
    controls: ["eligibleInstance", "phone", "queue", "agents", "initialDelay", "maxRetries", "minInterval", "failAttempts", "customRecovery", "zendesk"], failures: NA, defaults: {},
    guide: g({ native: "Native on eligible next-generation Amazon Connect Customer instances only. Retry recreation is custom.", blocks: ["Transfer to queue (callback, customer-first)", "Outbound callback flow (required)", "Check call progress", "Transfer to queue (after human)", "Optional: Wait + Set contact attributes for custom C4 retry"], dial: "Customer-first.", retry: "C2 does not support Max retries or Minimum time. Custom C3 flow can recreate a callback (C4) with a retry attribute; it rejoins the back of the queue unless priority or age is adjusted.", docs: ["customerFirst", "initiation", "failed"], limits: ["Not available on every instance.", "Check call progress works for customer-first callbacks and outbound campaigns, not ordinary outbound API calls."] }),
  },
  {
    id: "web", n: 4, cat: "B", title: "Web callback / click-to-call", tagline: "A web form calls your API, which asks Connect to place the call.", flow: "Website · Form · API · Validate · StartOutboundVoiceContact · Flow · Agent", nature: "Custom pattern", surface: "web", accent: "#1F73B7",
    nodes: [
      { id: "site", x: 0, y: 1, kind: "channel", label: "Help center", sub: "northwind.example", role: "Customer website." },
      { id: "form", x: 1, y: 1, kind: "channel", label: "Callback form", sub: "Consent required", role: "Captures name, number, reason, timing." },
      { id: "api", x: 2, y: 1, kind: "aws", label: "API Gateway", sub: "Lambda handler", role: "Custom backend." },
      { id: "val", x: 3, y: 1, kind: "decision", label: "Validate", sub: "E.164, consent", role: "Server-side validation." },
      { id: "sched", x: 3, y: 0, kind: "schedule", label: "Scheduler", sub: "If scheduled", role: "EventBridge Scheduler one-time schedule." },
      { id: "sov", x: 4, y: 1, kind: "aws", label: "StartOutbound", sub: "VoiceContact API", role: "Dials the customer then runs the flow." },
      { id: "cust", x: 5, y: 1, kind: "customer", label: "Customer phone", sub: "Press 1 to confirm", role: "Customer answers first." },
      { id: "flow", x: 6, y: 1, kind: "flow", label: "Outbound flow", sub: "Transfer to queue", role: "Routes the answered call." },
      { id: "agent", x: 6, y: 2.5, kind: "agent", label: "Agent", sub: "Connected", role: "Agent receives the call." },
      { id: "retry", x: 4, y: 2.5, kind: "retry", label: "App retry", sub: "Custom", role: "Application-level retry." },
      { id: "fail", x: 2, y: 2.5, kind: "fail", label: "Failed", sub: "Request closed", role: "Terminal failure." },
    ],
    edges: [["site", "form"], ["form", "api"], ["api", "val"], ["val", "sched", "opt"], ["sched", "sov", "opt"], ["val", "sov"], ["sov", "cust"], ["cust", "flow"], ["flow", "agent"], ["cust", "retry", "retry"], ["retry", "sov", "retry"], ["val", "fail", "fail"], ["sov", "fail", "fail"]],
    controls: ["name", "phone", "reason", "dept", "webTiming", "date", "slot", "tz", "consent", "agents", "maxRetries", "minInterval", "failAttempts", "customRecovery", "zendesk"], failures: API, defaults: { customRecovery: true },
    guide: g({ native: "Custom web application integration. Amazon Connect provides the outbound API and flows; the form, API and scheduling are yours.", resources: ["Amazon Connect instance and outbound flow", "Queue for routing", "API Gateway + Lambda", "Optional EventBridge Scheduler"], blocks: ["Outbound flow: Get customer input (press 1)", "Transfer to queue"], dial: "Customer is dialed first by StartOutboundVoiceContact (custom).", retry: CUSTOM_RETRY, ext: "Website, API, bot protection, consent storage.", apis: ["StartOutboundVoiceContact", "scheduler:CreateSchedule (scheduled pattern)"], iam: IAM_SCHED, docs: ["sov", "scheduler", "initiation"], limits: ["Not a native queued callback.", "Scheduler precision is one minute.", "Rate-limit and verify consent."] }),
  },
  {
    id: "courtesy", n: 5, cat: "B", title: "Courtesy callback: customer picks a time", tagline: "A real booking with validation, reschedule and cancel.", flow: "Inbound · Offer · Time pick · Validation · Scheduler · Fires · Call · Agent", nature: "Native plus custom", surface: "calendar", accent: "#C2410C",
    nodes: [
      { id: "inbound", x: 0, y: 1, kind: "customer", label: "Inbound call", sub: "Peak period", role: "Original call." },
      { id: "offer", x: 1, y: 1, kind: "flow", label: "Courtesy offer", sub: "Later today?", role: "Queue flow offers a time." },
      { id: "pick", x: 2, y: 1, kind: "ai", label: "Time capture", sub: "IVR or Lex", role: "Collects preferred date and time." },
      { id: "validate", x: 3, y: 1, kind: "decision", label: "Validate slot", sub: "Hours, capacity", role: "Rejects closed, blackout, full slots." },
      { id: "sched", x: 4, y: 1, kind: "schedule", label: "Scheduler", sub: "DynamoDB booking", role: "One-time schedule + booking record." },
      { id: "cancel", x: 4, y: 0, kind: "fail", label: "Reschedule / cancel", sub: "Update or delete", role: "Customer changes their mind." },
      { id: "fire", x: 5, y: 1, kind: "schedule", label: "Schedule fires", sub: "1-minute precision", role: "Target invoked near the booked time." },
      { id: "sov", x: 6, y: 1, kind: "aws", label: "StartOutbound", sub: "VoiceContact", role: "Places the call." },
      { id: "cust", x: 6, y: 2.5, kind: "customer", label: "Customer answers", sub: "Confirms", role: "Customer on the line." },
      { id: "agent", x: 5, y: 2.5, kind: "agent", label: "Agent", sub: "Connected", role: "Agent connects." },
      { id: "retry", x: 4, y: 2.5, kind: "retry", label: "App retry", sub: "Custom", role: "Custom retry." },
      { id: "fail", x: 2, y: 2.5, kind: "fail", label: "Failed", sub: "", role: "Terminal failure." },
    ],
    edges: [["inbound", "offer"], ["offer", "pick"], ["pick", "validate"], ["validate", "sched"], ["sched", "cancel", "opt"], ["sched", "fire"], ["fire", "sov"], ["sov", "cust"], ["cust", "agent"], ["cust", "retry", "retry"], ["retry", "sov", "retry"], ["pick", "fail", "fail"], ["sov", "fail", "fail"]],
    controls: ["date", "slot", "tz", "schedAction", "phone", "agents", "maxRetries", "minInterval", "failAttempts", "customRecovery", "zendesk"], failures: API, defaults: { date: "2026-11-24", slot: 900, customRecovery: true },
    guide: g({ native: "Offer in a native flow; precise booking and execution are custom orchestration.", resources: ["Amazon Connect flow and queue", "DynamoDB bookings table", "EventBridge Scheduler", "Lambda"], blocks: ["Get customer input / Lex time capture", "Invoke AWS Lambda function (validate + book)", "Disconnect"], delay: "Not used for appointments. A queued callback's initial delay is not a guaranteed appointment.", retry: CUSTOM_RETRY, ext: "Booking store, capacity model, time-zone handling.", apis: ["scheduler:CreateSchedule / UpdateSchedule / DeleteSchedule", "StartOutboundVoiceContact"], iam: IAM_SCHED, docs: ["scheduler", "sov", "hours"], limits: ["Scheduler precision is one minute.", "Capacity must be modeled separately from queues."] }),
  },
  {
    id: "chat", n: 6, cat: "B", title: "Chat-to-voice callback", tagline: "Move from chat to phone without losing the story.", flow: "Chat · Bot · Context · Lambda · Outbound call · Queue · Agent with transcript", nature: "Custom pattern", surface: "chat", accent: "#0F766E",
    nodes: [
      { id: "chat", x: 0, y: 1, kind: "channel", label: "Web chat", sub: "Chat contact", role: "Customer chat." },
      { id: "bot", x: 1, y: 1, kind: "ai", label: "Lex bot", sub: "Captures number", role: "Detects request and collects number." },
      { id: "ctx", x: 2, y: 0.3, kind: "connect", label: "Contact context", sub: "Attributes, transcript", role: "Context preserved for the agent." },
      { id: "lam", x: 3, y: 1, kind: "aws", label: "Lambda", sub: "Outbound request", role: "Calls StartOutboundVoiceContact." },
      { id: "cust", x: 4, y: 1, kind: "customer", label: "Customer phone", sub: "Answers", role: "Customer called." },
      { id: "q", x: 5, y: 1, kind: "queue", label: "Billing queue", sub: "Transfer to queue", role: "Routes the voice contact." },
      { id: "agent", x: 6, y: 1, kind: "agent", label: "Agent + context", sub: "Transcript shown", role: "Agent sees chat summary." },
      { id: "retry", x: 4, y: 2.5, kind: "retry", label: "App retry", sub: "Custom", role: "Custom retry." },
      { id: "fail", x: 2, y: 2.5, kind: "fail", label: "Failed", sub: "", role: "Terminal failure." },
    ],
    edges: [["chat", "bot"], ["bot", "ctx"], ["ctx", "lam"], ["bot", "lam"], ["lam", "cust"], ["cust", "q"], ["q", "agent"], ["ctx", "agent", "opt"], ["cust", "retry", "retry"], ["retry", "lam", "retry"], ["bot", "fail", "fail"], ["lam", "fail", "fail"]],
    controls: ["phone", "agents", "maxRetries", "minInterval", "failAttempts", "customRecovery", "zendesk"], failures: API, defaults: { customRecovery: true },
    script: [
      { who: "customer", text: "Hi, I was charged twice for order NW-55120.", node: "chat" },
      { who: "bot", text: "Sorry about that. I can look into it here, or have someone call you.", node: "bot" },
      { who: "customer", text: "A call please. This is easier to explain by phone.", node: "bot" },
      { who: "bot", text: "Sure. Is +1 312 555 0147 the best number?", node: "ctx" },
      { who: "customer", text: "Yes.", node: "ctx" },
      { who: "bot", text: "Calling you now. Your agent will see this conversation.", node: "lam" },
    ],
    guide: g({ native: "This visualization uses a custom chat-to-outbound-API integration. Separately, Amazon Connect supports Transfer to Callback in the Transfer to queue block for supported chat, task and email contacts; configure callback number, queue and routing profile for that native alternative.", resources: ["Chat flow with Lex bot", "Lambda", "Outbound flow and queue"], blocks: ["Get customer input (Lex)", "Set contact attributes", "Invoke AWS Lambda function", "Native alternative: Set callback number + Transfer to queue (callback)"], dial: "Customer dialed first via outbound API (custom). Native queued transfer uses its separately configured dial mode.", retry: CUSTOM_RETRY, ext: "Transcript storage and summarization if desired.", apis: ["StartOutboundVoiceContact (with RelatedContactId and Attributes)"], iam: IAM_API, docs: ["queued", "sov", "lex", "initiation"], limits: ["Context must be passed explicitly.", "Chat ends or stays open by design choice."] }),
  },
  {
    id: "external", n: 7, cat: "C", title: "External-system availability callback", tagline: "Only call when the system that can fix it is actually up.", flow: "Customer · Connect · Lambda · External API · Decision · Pending · Recheck · Call · Agent", nature: "Custom pattern", surface: "system", accent: "#8457C9",
    nodes: [
      { id: "cust", x: 0, y: 1, kind: "customer", label: "Customer", sub: "Requests callback", role: "Customer request." },
      { id: "connect", x: 1, y: 1, kind: "connect", label: "Amazon Connect", sub: "Flow", role: "Flow captures the request." },
      { id: "lam", x: 2, y: 1, kind: "aws", label: "AWS Lambda", sub: "Health check", role: "Calls the external health endpoint." },
      { id: "ext", x: 2, y: 0, kind: "ext", label: "{system}", sub: "Health API", role: "External dependency." },
      { id: "decide", x: 3, y: 1, kind: "decision", label: "Decision engine", sub: "Proceed or hold", role: "Business rule." },
      { id: "pend", x: 3, y: 2.5, kind: "schedule", label: "DynamoDB pending", sub: "PENDING_DEPENDENCY", role: "Durable pending record." },
      { id: "sfn", x: 2, y: 2.5, kind: "aws", label: "Step Functions", sub: "Wait and poll", role: "Polling loop." },
      { id: "eb", x: 4, y: 2.5, kind: "aws", label: "EventBridge", sub: "Status event", role: "Event-driven resume." },
      { id: "sov", x: 4, y: 1, kind: "aws", label: "StartOutbound", sub: "VoiceContact", role: "Places the call." },
      { id: "phone", x: 4, y: 0, kind: "customer", label: "Customer phone", sub: "Confirms", role: "Customer answers." },
      { id: "q", x: 5, y: 1, kind: "queue", label: "Queue", sub: "Transfer", role: "Routes call." },
      { id: "agent", x: 6, y: 1, kind: "agent", label: "Agent", sub: "System ready", role: "Agent can complete the request." },
      { id: "fail", x: 6, y: 2.5, kind: "fail", label: "Failed / expired", sub: "Timeout", role: "Dependency never recovered in time." },
    ],
    edges: [["cust", "connect"], ["connect", "lam"], ["lam", "ext"], ["lam", "decide"], ["decide", "pend", "retry"], ["pend", "sfn", "retry"], ["sfn", "decide", "retry"], ["pend", "eb", "opt"], ["eb", "decide", "opt"], ["decide", "sov"], ["sov", "phone"], ["phone", "q"], ["q", "agent"], ["sfn", "fail", "fail"], ["sov", "fail", "fail"]],
    controls: ["system", "ext", "trigger", "poll", "extLimit", "extTimeout", "phone", "agents", "zendesk"], failures: API, defaults: { ext: "unavailable", customRecovery: false },
    guide: g({ native: "Custom orchestration pattern using AWS services. Not an automatically deployed native callback feature.", resources: ["Amazon Connect flow", "Lambda", "Step Functions", "DynamoDB", "EventBridge (rule and/or Scheduler)", "External system health API"], blocks: ["Invoke AWS Lambda function", "Set contact attributes", "Play prompt / Disconnect"], dial: "Customer dialed first via outbound API once eligible.", delay: "Waiting is governed by the dependency, not by initial delay.", retry: "Polling interval, check limit and timeout are custom settings.", ext: "Health endpoint or status events from the external system; idempotent release.", apis: ["StartOutboundVoiceContact", "states:StartExecution, SendTaskSuccess", "events:PutRule / PutEvents"], iam: [...IAM_API, "states:StartExecution", "dynamodb:UpdateItem", "events:PutEvents"], docs: ["sov", "sfn", "scheduler"], limits: ["Design for duplicate events.", "Set a timeout and customer fallback."] }),
  },
  {
    id: "availability", n: 8, cat: "C", title: "Agent availability-based callback", tagline: "Executes when a properly skilled agent becomes available, no promise of instant.", flow: "Queue · Profile · Dashboard · Proficiency · Agent · Mode · Connected", nature: "Native", surface: "dashboard", accent: "#2A9192",
    nodes: [
      { id: "cbq", x: 0, y: 1, kind: "queue", label: "Callback queue", sub: "{queue}", role: "Callback waiting." },
      { id: "prof", x: 1, y: 1, kind: "decision", label: "Routing profiles", sub: "Membership", role: "Which agents serve the queue." },
      { id: "dash", x: 2, y: 1, kind: "agent", label: "Agent states", sub: "5 agents", role: "Live availability." },
      { id: "profc", x: 3, y: 1, kind: "decision", label: "Proficiency", sub: "Min level", role: "Required proficiency." },
      { id: "agent", x: 4, y: 1, kind: "agent", label: "Eligible agent", sub: "Selected", role: "Chosen agent." },
      { id: "dial", x: 5, y: 1, kind: "connect", label: "Execute callback", sub: "Selected mode", role: "Agent-first or customer-first." },
      { id: "conn", x: 6, y: 1, kind: "customer", label: "Connected", sub: "", role: "Customer and agent talk." },
      { id: "fb", x: 3, y: 2.5, kind: "fail", label: "Fallback routing", sub: "Relaxed step", role: "Explicit fallback when nobody qualifies." },
      { id: "retry", x: 5, y: 2.5, kind: "retry", label: "Retry", sub: "Mode-specific", role: "Retry per mode." },
      { id: "fail", x: 6, y: 2.5, kind: "fail", label: "Failed", sub: "", role: "Terminal failure." },
    ],
    edges: [["cbq", "prof"], ["prof", "dash"], ["dash", "profc"], ["profc", "agent"], ["profc", "fb", "fail"], ["fb", "agent", "opt"], ["agent", "dial"], ["dial", "conn"], ["dial", "retry", "retry"], ["retry", "agent", "retry"], ["dial", "fail", "fail"]],
    controls: ["queue", "minProf", "freeAgent", "mode", "eligibleInstance", "phone", "maxRetries", "minInterval", "failAttempts", "zendesk"], failures: NA, defaults: { queue: "Billing", agents: "available" },
    guide: g({ native: "Native routing with proficiency; fallback is explicit routing-step configuration.", resources: ["Queues", "Routing profiles", "Predefined attributes for proficiency", "Agent proficiencies"], blocks: ["Set routing criteria (proficiency steps)", "Transfer to queue (callback)"], queue: "Agents must have the queue in their routing profile and meet proficiency.", limits: ["Availability does not create an appointment.", "Nothing guarantees immediate execution."] }),
  },
  {
    id: "vip", n: 9, cat: "C", title: "CRM-triggered VIP callback", tagline: "The CRM spots a high-value customer and starts a priority callback.", flow: "CRM event · Lookup · Classify · Orchestrate · Call · Priority queue · Preferred agent", nature: "Custom pattern", surface: "crm", accent: "#B4561F",
    nodes: [
      { id: "crm", x: 0, y: 1, kind: "ext", label: "CRM event", sub: "Urgent case", role: "Case created in CRM." },
      { id: "lookup", x: 1, y: 1, kind: "aws", label: "Customer lookup", sub: "Lambda", role: "Reads profile." },
      { id: "classify", x: 2, y: 1, kind: "decision", label: "Tier classify", sub: "Tier + severity", role: "Decides priority." },
      { id: "orch", x: 3, y: 1, kind: "aws", label: "Step Functions", sub: "Orchestration", role: "Runs the workflow." },
      { id: "later", x: 3, y: 2.5, kind: "retry", label: "Customer window", sub: "Wait / retry", role: "Customer availability rules." },
      { id: "sov", x: 4, y: 1, kind: "aws", label: "StartOutbound", sub: "VoiceContact", role: "Places the call." },
      { id: "phone", x: 5, y: 1, kind: "customer", label: "Customer phone", sub: "Confirms", role: "Customer answers." },
      { id: "prio", x: 6, y: 0, kind: "queue", label: "VIP Care queue", sub: "Priority", role: "Higher-priority queue." },
      { id: "std", x: 6, y: 2.5, kind: "queue", label: "Standard queue", sub: "Billing", role: "Standard routing." },
      { id: "pref", x: 6, y: 1, kind: "agent", label: "Preferred agent", sub: "Relationship", role: "Preferred agent if available." },
      { id: "agent", x: 5, y: 2.5, kind: "agent", label: "Next agent", sub: "", role: "Any eligible agent." },
      { id: "fail", x: 4, y: 2.5, kind: "fail", label: "Failed", sub: "", role: "Terminal failure." },
    ],
    edges: [["crm", "lookup"], ["lookup", "classify"], ["classify", "orch"], ["orch", "later", "retry"], ["later", "sov", "retry"], ["orch", "sov"], ["sov", "phone"], ["phone", "prio"], ["phone", "std"], ["prio", "pref"], ["std", "agent"], ["sov", "fail", "fail"]],
    controls: ["tier", "severity", "team", "preferredAgent", "priority", "reach", "phone", "maxRetries", "customRecovery", "zendesk"], failures: API, defaults: { tier: "VIP", customRecovery: true, maxRetries: 1 },
    guide: g({ native: "Custom CRM integration; queue priority and agent routing are native settings it uses.", resources: ["CRM webhook or event bus", "Lambda + Step Functions", "VIP Care queue", "Agent queues or routing criteria"], blocks: ["Outbound flow: Set contact attributes, Set routing criteria, Transfer to queue"], queue: "VIP Care in routing profiles with priority 1.", retry: CUSTOM_RETRY, ext: "CRM API credentials stored in Secrets Manager.", apis: ["StartOutboundVoiceContact", "UpdateContactRoutingData (optional priority/age adjustment)"], iam: [...IAM_API, "states:StartExecution", "secretsmanager:GetSecretValue"], docs: ["sov", "sfn", "initiation"], limits: ["Tier logic is yours.", "No automatic Zendesk ticket unless integration configured."] }),
  },
  {
    id: "ai", n: 10, cat: "C", title: "AI-assisted callback", tagline: "An AI agent gathers the why, the number and the window.", flow: "Customer · AI conversation · Intent · Collect · Confirm · Payload · Scheduler · Agent", nature: "Custom pattern", surface: "ai", accent: "#7C3AED",
    nodes: [
      { id: "cust", x: 0, y: 1, kind: "customer", label: "Customer", sub: "Voice or chat", role: "Customer." },
      { id: "ai", x: 1, y: 1, kind: "ai", label: "AI agent", sub: "Conversation", role: "AI orchestration." },
      { id: "intent", x: 2, y: 1, kind: "ai", label: "Intent", sub: "Needs a human", role: "Classifies the request." },
      { id: "collect", x: 3, y: 1, kind: "flow", label: "Collect details", sub: "Number, window", role: "Captures inputs." },
      { id: "confirm", x: 4, y: 1, kind: "decision", label: "Confirm", sub: "Read back", role: "Customer confirms." },
      { id: "cancel", x: 4, y: 2.5, kind: "fail", label: "Canceled", sub: "Declined", role: "No request created." },
      { id: "payload", x: 4, y: 0, kind: "ext", label: "Payload", sub: "Structured JSON", role: "Request document." },
      { id: "sched", x: 5, y: 0, kind: "schedule", label: "Scheduler", sub: "Window opens", role: "Holds until window." },
      { id: "sov", x: 5, y: 1, kind: "aws", label: "StartOutbound", sub: "VoiceContact", role: "Places the call." },
      { id: "phone", x: 6, y: 0, kind: "customer", label: "Customer phone", sub: "Confirms", role: "Customer answers." },
      { id: "agent", x: 6, y: 1, kind: "agent", label: "Human agent", sub: "AI summary", role: "Agent with summary." },
      { id: "retry", x: 5, y: 2.5, kind: "retry", label: "App retry", sub: "Custom", role: "Custom retry." },
      { id: "fail", x: 6, y: 2.5, kind: "fail", label: "Failed", sub: "", role: "Terminal failure." },
    ],
    edges: [["cust", "ai"], ["ai", "intent"], ["intent", "collect"], ["collect", "confirm"], ["confirm", "cancel", "fail"], ["confirm", "payload"], ["payload", "sched"], ["sched", "sov"], ["sov", "phone"], ["phone", "agent"], ["phone", "retry", "retry"], ["retry", "sov", "retry"], ["sov", "fail", "fail"]],
    controls: ["aiConfirm", "phone", "agents", "maxRetries", "failAttempts", "customRecovery", "zendesk"], failures: API, defaults: { customRecovery: true },
    script: [
      { who: "bot", text: "Hi Lena, this is Northwind's assistant. What can I help with?", node: "ai" },
      { who: "customer", text: "I was billed twice for invoice NW-2211.", node: "ai" },
      { who: "bot", text: "That looks like a billing dispute over $500. I'd like a specialist to call you.", node: "intent" },
      { who: "bot", text: "Best number and time? Today between 11 and 1 works for our team.", node: "collect" },
      { who: "customer", text: "This number, 11 to 1 is fine.", node: "collect" },
      { who: "bot", text: "Confirming: billing dispute, +1 312 555 0147, today 11:00 to 1:00 ET. Correct?", node: "confirm" },
      { who: "customer", text: "Yes.", node: "payload" },
    ],
    guide: g({ native: "AI orchestration is custom; execution uses Amazon Connect outbound APIs and routing.", resources: ["AI agent / Lex bot", "Lambda", "Scheduler", "Outbound flow"], blocks: ["Get customer input (Lex)", "Invoke AWS Lambda function", "Set contact attributes"], retry: CUSTOM_RETRY, ext: "Summarization, PII handling, confirmation policy.", apis: ["StartOutboundVoiceContact", "scheduler:CreateSchedule"], iam: IAM_SCHED, docs: ["lex", "sov", "scheduler"], limits: ["Always confirm before creating a request.", "Review AI summaries for accuracy."] }),
  },
  {
    id: "after-hours", n: 11, cat: "D", title: "After-hours and holiday callback", tagline: "Closed tonight, closed for the holiday: book the next real window.", flow: "Inbound · Hours check · Windows · Selection · Holiday check · Scheduler · Opens · Call", nature: "Native plus custom", surface: "calendar", accent: "#B42318",
    nodes: [
      { id: "inbound", x: 0, y: 1, kind: "customer", label: "Inbound call", sub: "7:40 PM Wed", role: "Customer calls after hours." },
      { id: "hours", x: 1, y: 1, kind: "decision", label: "Hours check", sub: "Closed", role: "Check hours of operation." },
      { id: "windows", x: 2, y: 1, kind: "schedule", label: "Service windows", sub: "Next available", role: "Computes next open windows." },
      { id: "select", x: 3, y: 1, kind: "customer", label: "Customer selects", sub: "Date and time", role: "Customer chooses." },
      { id: "reject", x: 4, y: 0, kind: "retry", label: "Rejected slot", sub: "Holiday, blackout", role: "Offers next available." },
      { id: "sched", x: 4, y: 1, kind: "schedule", label: "Scheduler", sub: "One-time", role: "Books the callback." },
      { id: "opens", x: 5, y: 1, kind: "schedule", label: "Business opens", sub: "Schedule fires", role: "Time arrives." },
      { id: "sov", x: 6, y: 1, kind: "aws", label: "StartOutbound", sub: "VoiceContact", role: "Places the call." },
      { id: "cust", x: 6, y: 2.5, kind: "customer", label: "Customer answers", sub: "", role: "Customer." },
      { id: "agent", x: 5, y: 2.5, kind: "agent", label: "Agent", sub: "Connected", role: "Agent." },
      { id: "fail", x: 3, y: 2.5, kind: "fail", label: "Failed", sub: "", role: "Terminal failure." },
    ],
    edges: [["inbound", "hours"], ["hours", "windows"], ["windows", "select"], ["select", "reject", "retry"], ["reject", "sched", "retry"], ["select", "sched"], ["sched", "opens"], ["opens", "sov"], ["sov", "cust"], ["cust", "agent"], ["sov", "fail", "fail"], ["select", "fail", "fail"]],
    controls: ["date", "slot", "tz", "schedAction", "phone", "maxRetries", "customRecovery", "zendesk"], failures: API, defaults: { date: "2026-11-30", slot: 540, customRecovery: true },
    guide: g({ native: "Hours check is native; window calculation and scheduled execution are custom.", resources: ["Hours of operation with holiday overrides", "Scheduler, DynamoDB, Lambda"], blocks: ["Check hours of operation", "Get customer input", "Invoke AWS Lambda function"], delay: "Do not use initial delay to span closures.", retry: CUSTOM_RETRY, ext: "Holiday calendar and blackout source of truth.", apis: ["scheduler:CreateSchedule", "StartOutboundVoiceContact"], iam: IAM_SCHED, docs: ["hours", "scheduler", "sov"], limits: ["Time zones must be explicit.", "One-minute schedule precision."] }),
  },
  {
    id: "recovery", n: 12, cat: "D", title: "Failed callback, retry and recovery", tagline: "Every failure, the retry rules that really apply, and where it ends.", flow: "Attempt · Detection · Retry decision · Wait · New attempt · Completed / Failed / Escalated", nature: "Native plus custom", surface: "tree", accent: "#C2412A",
    nodes: [
      { id: "attempt", x: 0, y: 1, kind: "connect", label: "Callback attempt", sub: "{mode}", role: "First attempt." },
      { id: "detect", x: 1.5, y: 1, kind: "decision", label: "Result detection", sub: "Answer type", role: "What happened." },
      { id: "decide", x: 3, y: 1, kind: "decision", label: "Retry decision", sub: "Mode rules", role: "Mode-specific retry logic." },
      { id: "wait", x: 3, y: 0, kind: "schedule", label: "Wait / reschedule", sub: "Min interval", role: "Delay before retry." },
      { id: "newatt", x: 1.5, y: 0, kind: "connect", label: "New attempt", sub: "Same contact or C4", role: "Next attempt." },
      { id: "done", x: 4.5, y: 1, kind: "agent", label: "Completed", sub: "Connected", role: "Success." },
      { id: "failed", x: 4.5, y: 2.5, kind: "fail", label: "Failed", sub: "Terminal", role: "No more attempts." },
      { id: "esc", x: 6, y: 2.5, kind: "zendesk", label: "Escalated", sub: "Custom follow-up", role: "Custom follow-up task or ticket." },
    ],
    edges: [["attempt", "detect"], ["detect", "decide", "retry"], ["decide", "wait", "retry"], ["wait", "newatt", "retry"], ["newatt", "detect", "retry"], ["detect", "done"], ["decide", "failed", "fail"], ["failed", "esc", "opt"]],
    controls: ["mode", "eligibleInstance", "maxRetries", "minInterval", "failAttempts", "customRecovery", "zendesk", "phone"], failures: API, defaults: { failure: "no-answer", failAttempts: 2 },
    guide: g({ native: "Native agent-first retries; customer-first and API retries are custom.", blocks: ["Transfer to queue (Max retries, Minimum time)", "Customer-first: Check call progress, Wait, Set contact attributes", "Event rules for escalation"], retry: `${NATIVE_RETRY} Customer-first: no native max retries; custom C4 recreation. Outbound API: entirely application-level.`, ext: "Escalation target (task, CRM, Zendesk via configured integration).", apis: ["StartOutboundVoiceContact", "StopContact", "Contact events via EventBridge"], iam: [...IAM_API, "events:PutRule"], docs: ["failed", "customerFirst", "queued", "sov"], limits: ["Do not apply agent-first settings to customer-first.", "No automatic Zendesk ticket."] }),
  },
];
export const scenarioById = (id: string) => SCENARIOS.find((s) => s.id === id);

export type ControlSpec = { label: string; type: "range" | "select" | "toggle" | "text"; min?: number; max?: number; step?: number; unit?: string; options?: [string, string][] };
export const CONTROLS: Partial<Record<ControlKey, ControlSpec>> = {
  wait: { label: "Estimated wait", type: "range", min: 60, max: 1800, step: 60, unit: "s" },
  threshold: { label: "Offer threshold", type: "range", min: 60, max: 1200, step: 60, unit: "s" },
  phone: { label: "Callback number (E.164)", type: "text" },
  name: { label: "Customer name", type: "text" },
  reason: { label: "Reason", type: "text" },
  dept: { label: "Department", type: "select", options: [["Billing", "Billing"], ["Support", "Technical support"], ["Claims", "Claims"]] },
  queue: { label: "Queue", type: "select", options: [["Billing", "Billing"], ["Support", "Support"], ["Claims", "Claims"], ["VIP Care", "VIP Care"]] },
  agents: { label: "Agent availability", type: "select", options: [["available", "Agent available"], ["busy", "All busy (wait)"], ["none", "None staffed"]] },
  initialDelay: { label: "Initial delay", type: "range", min: 0, max: 600, step: 30, unit: "s" },
  maxRetries: { label: "Max retries", type: "range", min: 0, max: 5, step: 1 },
  minInterval: { label: "Minimum time between attempts", type: "range", min: 60, max: 900, step: 60, unit: "s" },
  failAttempts: { label: "Attempts that ring out (no-answer)", type: "range", min: 1, max: 6, step: 1 },
  customRecovery: { label: "Custom recovery (explicitly custom)", type: "toggle" },
  eligibleInstance: { label: "Eligible next-gen instance", type: "toggle" },
  mode: { label: "Execution mode", type: "select", options: [["agent-first", "Agent-first (native default)"], ["customer-first", "Customer-first (eligible only)"], ["outbound-api", "Outbound API (custom)"]] },
  webTiming: { label: "Web timing", type: "select", options: [["immediate", "Call me now"], ["scheduled", "Scheduled for later"]] },
  consent: { label: "Consent given", type: "toggle" },
  tz: { label: "Customer time zone", type: "select", options: [["ET", "Eastern"], ["CT", "Central"], ["MT", "Mountain"], ["PT", "Pacific"], ["GMT", "London"], ["CET", "Berlin"]] },
  schedAction: { label: "After booking", type: "select", options: [["confirm", "Keep booking"], ["reschedule", "Customer reschedules"], ["cancel", "Customer cancels"]] },
  ext: { label: "External system status", type: "select", options: [["available", "Available"], ["degraded", "Degraded"], ["unavailable", "Unavailable"], ["maintenance", "Maintenance"], ["recovering", "Recovering"]] },
  system: { label: "External system", type: "select", options: [["core-banking", "Core banking"], ["claims", "Claims system"], ["health", "Healthcare scheduling"], ["payments", "Payment processor"], ["airline", "Airline reservations"], ["orders", "Order management"]] },
  trigger: { label: "Re-check trigger", type: "select", options: [["polling", "Polling (Step Functions)"], ["event", "Event-driven (EventBridge)"]] },
  poll: { label: "Polling interval", type: "range", min: 60, max: 600, step: 60, unit: "s" },
  extLimit: { label: "Check limit", type: "range", min: 1, max: 10, step: 1 },
  extTimeout: { label: "Timeout", type: "range", min: 5, max: 60, step: 5, unit: "min" },
  minProf: { label: "Required proficiency", type: "range", min: 1, max: 5, step: 1 },
  freeAgent: { label: "Agent who frees up", type: "select", options: [["mara", "Mara Okafor"], ["theo", "Theo Lindqvist"], ["amaya", "Amaya Reyes"], ["jonah", "Jonah Feld"], ["sunita", "Sunita Rao"]] },
  tier: { label: "Customer tier", type: "select", options: [["Standard", "Standard"], ["Gold", "Gold"], ["VIP", "VIP"]] },
  severity: { label: "Issue severity", type: "select", options: [["Low", "Low"], ["High", "High"], ["Critical", "Critical"]] },
  team: { label: "Preferred team", type: "select", options: [["Private Client Desk", "Private Client Desk"], ["Billing", "Billing"]] },
  preferredAgent: { label: "Preferred agent", type: "select", options: [["sunita", "Sunita Rao"], ["mara", "Mara Okafor"], ["theo", "Theo Lindqvist"]] },
  priority: { label: "Callback priority", type: "range", min: 1, max: 5, step: 1 },
  reach: { label: "Customer availability", type: "select", options: [["now", "Available now"], ["later", "After 11:00"], ["unreachable", "Unreachable"]] },
  aiConfirm: { label: "Customer confirms", type: "toggle" },
  zendesk: { label: "Zendesk integration configured", type: "toggle" },
};
export const FAILURE_LABEL: Record<CbConfig["failure"], string> = { none: "Success path", "no-answer": "No answer", busy: "Busy signal", invalid: "Invalid number", voicemail: "Voicemail", reject: "Agent rejects", api: "API failure", expiry: "Window expires", "max-retries": "Max retries reached" };

/* ---------- Architecture explorer ---------- */
export type ArchNode = { id: string; lane: number; row: number; label: string; detail: string; api?: string };
export type ArchView = { id: string; label: string; summary: string; nodes: ArchNode[]; edges: [string, string, ("fail" | "retry")?][]; states: string[] };
export const LANES = ["Channels", "Amazon Connect", "Flows", "Queue / orchestration", "AWS services", "External", "Agent", "Zendesk"];
export const ARCH_VIEWS: ArchView[] = [
  { id: "native", label: "Native callback", summary: "Everything inside Amazon Connect: flows create a callback contact, the queue holds it, an agent executes it.", states: ["C1 INBOUND", "C2 CALLBACK queued", "Agent reserved", "Dialing", "Connected", "Ended"],
    nodes: [{ id: "voice", lane: 0, row: 1, label: "Phone", detail: "Customer calls the support number." }, { id: "cc", lane: 1, row: 1, label: "Contact", detail: "Inbound contact C1." }, { id: "qf", lane: 2, row: 1, label: "Queue flow", detail: "Offer, Set callback number, Transfer to queue." }, { id: "q", lane: 3, row: 1, label: "Callback queue", detail: "C2 waits with inherited start time." }, { id: "retry", lane: 3, row: 2, label: "Native retry", detail: "Agent-first ringing no-answer only." }, { id: "ag", lane: 6, row: 1, label: "Agent", detail: "Accepts, whisper, dial." }, { id: "zd", lane: 7, row: 1, label: "Agent Workspace", detail: "Interaction shown if the Zendesk integration is configured." }],
    edges: [["voice", "cc"], ["cc", "qf"], ["qf", "q"], ["q", "ag"], ["ag", "retry", "retry"], ["retry", "q", "retry"], ["ag", "zd"]] },
  { id: "web", label: "Web callback", summary: "A web form posts to your API; Lambda asks Amazon Connect to dial the customer and run an outbound flow.", states: ["Requested (app)", "Validated (app)", "API accepted", "Dialing", "Confirmed", "Queued", "Connected"],
    nodes: [{ id: "web", lane: 0, row: 1, label: "Web form", detail: "Consent, E.164 number." }, { id: "apigw", lane: 4, row: 0, label: "API Gateway", detail: "POST /callbacks", api: "POST /callbacks → 202 {requestId}" }, { id: "lam", lane: 4, row: 1, label: "Lambda", detail: "Validates and calls Connect.", api: "StartOutboundVoiceContact → {ContactId}" }, { id: "of", lane: 2, row: 1, label: "Outbound flow", detail: "Press 1, Transfer to queue." }, { id: "q", lane: 3, row: 1, label: "Queue", detail: "Routes answered call." }, { id: "fail", lane: 5, row: 2, label: "Error store", detail: "Failed requests for follow-up." }, { id: "ag", lane: 6, row: 1, label: "Agent", detail: "Receives the call." }, { id: "zd", lane: 7, row: 1, label: "Agent Workspace", detail: "Ticket only if configured." }],
    edges: [["web", "apigw"], ["apigw", "lam"], ["lam", "of"], ["of", "q"], ["q", "ag"], ["ag", "zd"], ["lam", "fail", "fail"]] },
  { id: "scheduled", label: "Scheduled callback", summary: "Bookings are stored and a one-time schedule fires near the chosen time (one-minute precision).", states: ["Requested", "Validated", "Scheduled", "Rescheduled / Canceled", "Fired", "Dialing", "Connected"],
    nodes: [{ id: "ivr", lane: 0, row: 1, label: "Phone or web", detail: "Customer picks a time." }, { id: "flow", lane: 2, row: 1, label: "Booking flow", detail: "Get customer input, Invoke Lambda." }, { id: "ddb", lane: 4, row: 0, label: "DynamoDB", detail: "Bookings and capacity.", api: "PutItem {pk:CB#48213,status:SCHEDULED}" }, { id: "sch", lane: 4, row: 1, label: "EventBridge Scheduler", detail: "One-time schedule.", api: "CreateSchedule at(2026-11-24T20:00:00)" }, { id: "lam", lane: 4, row: 2, label: "Lambda", detail: "Fires the call.", api: "StartOutboundVoiceContact" }, { id: "q", lane: 3, row: 1, label: "Queue", detail: "Routes the answered call." }, { id: "ag", lane: 6, row: 1, label: "Agent", detail: "Connected." }, { id: "zd", lane: 7, row: 1, label: "Agent Workspace", detail: "If configured." }],
    edges: [["ivr", "flow"], ["flow", "ddb"], ["flow", "sch"], ["sch", "lam"], ["lam", "q"], ["q", "ag"], ["ag", "zd"], ["lam", "sch", "retry"]] },
  { id: "external", label: "External-system-triggered", summary: "The callback waits on an external dependency; polling or events release it.", states: ["Requested", "Pending dependency", "Rechecking", "Eligible", "Dialing", "Connected", "Expired"],
    nodes: [{ id: "voice", lane: 0, row: 1, label: "Customer", detail: "Requests callback." }, { id: "cf", lane: 2, row: 1, label: "Flow", detail: "Invoke Lambda." }, { id: "sfn", lane: 3, row: 1, label: "Step Functions", detail: "Wait, poll, decide." }, { id: "lam", lane: 4, row: 1, label: "Lambda", detail: "Health checks.", api: "GET /health → {status:'unavailable'}" }, { id: "eb", lane: 4, row: 2, label: "EventBridge", detail: "Status events.", api: "{detail-type:'DependencyStatusChanged'}" }, { id: "core", lane: 5, row: 1, label: "Core system", detail: "Banking, claims, ERP." }, { id: "q", lane: 3, row: 0, label: "Queue", detail: "After StartOutboundVoiceContact." }, { id: "ag", lane: 6, row: 0, label: "Agent", detail: "System is ready." }, { id: "zd", lane: 7, row: 0, label: "Agent Workspace", detail: "If configured." }],
    edges: [["voice", "cf"], ["cf", "sfn"], ["sfn", "lam"], ["lam", "core"], ["core", "eb", "retry"], ["eb", "sfn", "retry"], ["sfn", "q"], ["q", "ag"], ["ag", "zd"], ["lam", "sfn", "fail"]] },
  { id: "ai", label: "AI-assisted callback", summary: "An AI agent collects intent, details and a window, then hands a structured request to orchestration.", states: ["Conversation", "Intent", "Collected", "Confirmed", "Scheduled", "Dialing", "Connected with summary"],
    nodes: [{ id: "voice", lane: 0, row: 1, label: "Voice or chat", detail: "Customer talks to AI." }, { id: "ai", lane: 2, row: 1, label: "AI agent", detail: "Intent and slot filling." }, { id: "lam", lane: 4, row: 1, label: "Lambda", detail: "Builds payload.", api: "{intent:'BillingDispute',window:'11:00-13:00'}" }, { id: "sch", lane: 4, row: 0, label: "Scheduler", detail: "Holds until window." }, { id: "q", lane: 3, row: 1, label: "Queue", detail: "Routes call." }, { id: "crm", lane: 5, row: 1, label: "CRM", detail: "Optional profile lookup." }, { id: "ag", lane: 6, row: 1, label: "Agent", detail: "Sees AI summary." }, { id: "zd", lane: 7, row: 1, label: "Agent Workspace", detail: "If configured." }],
    edges: [["voice", "ai"], ["ai", "lam"], ["lam", "crm"], ["lam", "sch"], ["sch", "q"], ["q", "ag"], ["ag", "zd"], ["ai", "voice", "retry"]] },
];

export const VALUE_CARDS = [
  ["Reduced hold time", "Customers who accept a callback stop holding the moment they hang up."],
  ["Customer convenience", "A time the customer chose beats a queue position they did not."],
  ["Flexible scheduling", "Hours, holidays and blackouts are validated before anything is promised."],
  ["Agent preparation", "Reason, history and attributes arrive before the first hello."],
  ["Better context", "Chat transcripts and AI summaries travel with the callback."],
  ["Automated orchestration", "Schedules, retries and escalations run without manual tracking."],
  ["Dependency handling", "Calls wait for the system that can actually fix the problem."],
  ["Operational visibility", "Every state, attempt and failure is visible and reportable."],
];
