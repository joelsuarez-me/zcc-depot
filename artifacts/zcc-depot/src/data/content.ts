export const DEMO_URL = "https://zendesk.storylane.io/share/contactcenter-feb2026-en-us";
const HC = "https://support.zendesk.com/hc/en-us/";
export const LINKS = {
  product: "https://www.zendesk.com/service/contact-center/",
  resolution: "https://www.zendesk.com/au/blog/zendesk-insights/innovation/advancing-resolution-platform/",
  marketplace: "https://www.zendesk.com/marketplace/apps/support/1162892/zendesk-for-contact-center-dashboards/",
  aiSuggestions: HC + "articles/10143999626394-Using-real-time-AI-suggestions-in-Contact-Center",
  components: HC + "articles/9829206009242-Understanding-Contact-Center-components",
  awsServices: HC + "articles/10342463822746-About-AWS-services-in-Contact-Center",
  gettingStarted: HC + "articles/10512753593370-Getting-started-with-Zendesk-Contact-Center-app",
  usingSection: HC + "sections/9248688983706-Using-Zendesk-Contact-Center",
  dashboardsApp: HC + "articles/9696160145818-Using-the-Contact-Center-dashboards-app",
  dashboardsGuide: HC + "articles/9459010766362-Understanding-Contact-Center-dashboards",
  install: HC + "articles/9824150119450-Implementing-Zendesk-Contact-Center-app",
  gtmDoc: "https://docs.google.com/document/d/1Cpv8Sg_BQ_R6kK6uBK91NOJGw3s0mVL7cN0uQ4PbiTA/edit?tab=t.0#heading=h.2rzpayujd9if",
};

export type Resource = { id: string; title: string; url: string; category: string; kind: "Article" | "Section" | "Product page" | "Internal" };
const a = (id: string, title: string, slug: string, category: string): Resource => ({ id, title, url: HC + "articles/" + slug, category, kind: "Article" });
const s = (id: string, title: string, slug: string, category: string): Resource => ({ id, title, url: HC + "sections/" + slug, category, kind: "Section" });

export const RESOURCE_CATEGORIES = ["Basics", "Using Contact Center", "Setting up", "Marketplace app", "AI & analytics", "Platform & product"] as const;

export const RESOURCES: Resource[] = [
  a("about", "About Zendesk Contact Center", "9459059241626-About-Zendesk-Contact-Center", "Basics"),
  a("managing-calls", "Managing calls in Contact Center", "10946560449050-Managing-calls-in-Contact-Center", "Basics"),
  a("accept-decline", "Accepting and declining calls in Contact Center", "10937641189786-Accepting-and-declining-calls-in-Contact-Center", "Basics"),
  a("calls-tickets", "Understanding how Contact Center calls become tickets", "10912570849050-Understanding-how-Contact-Center-calls-become-tickets", "Basics"),
  a("outbound", "Making outbound calls in Contact Center", "10904751873690-Making-outbound-calls-in-Contact-Center", "Basics"),
  a("components", "Understanding Contact Center components", "9829206009242-Understanding-Contact-Center-components", "Basics"),
  a("aws-services", "About AWS services in Contact Center", "10342463822746-About-AWS-services-in-Contact-Center", "Basics"),
  s("basics-all", "Contact Center basics (all 11 articles)", "9641939356698-Contact-Center-basics", "Basics"),
  a("translation", "About real-time voice translation in Contact Center (EAP)", "11202642705434-About-real-time-voice-translation-in-Contact-Center-EAP", "Using Contact Center"),
  a("offline", "Setting agent status to offline and signing out of Contact Center", "10879356124314-Setting-agent-status-to-offline-and-signing-out-of-Contact-Center", "Using Contact Center"),
  a("agent-interface", "Using the Contact Center agent interface and configuring voice preferences", "10879034148890-Using-the-Contact-Center-agent-interface-and-configuring-voice-preferences", "Using Contact Center"),
  a("engage-legacy", "Documentation for Engage legacy", "10542506275226-Documentation-for-Engage-legacy", "Using Contact Center"),
  a("billing", "Understanding Contact Center billing", "10263112119066-Understanding-Contact-Center-billing", "Using Contact Center"),
  a("attributes-call-info", "Adding call information to Zendesk using Amazon Connect attributes", "10880620037914-Adding-call-information-to-Zendesk-using-Amazon-Connect-attributes", "Using Contact Center"),
  { id: "article-10879422998554", title: "Contact Center Help Center article 10879422998554", url: HC + "articles/10879422998554", category: "Using Contact Center", kind: "Article" },
  s("using-all", "Using Contact Center (all 32 articles)", "9641951759770-Using-Contact-Center", "Using Contact Center"),
  s("using-zcc", "Using Zendesk Contact Center (section hub)", "9248688983706-Using-Zendesk-Contact-Center", "Using Contact Center"),
  a("ivr-recipe", "Workflow recipe: Recording a Contact Center IVR selection on a ticket", "11433279888026-Workflow-recipe-Recording-a-Contact-Center-IVR-selection-on-a-ticket", "Setting up"),
  a("console-access", "Configuring call console access in Contact Center", "11358781997210-Configuring-call-console-access-in-Contact-Center", "Setting up"),
  a("summaries", "Configuring summaries in Contact Center call notifications", "11334283055514-Configuring-summaries-in-Contact-Center-call-notifications", "Setting up"),
  a("outbound-queue", "Configuring outbound queue selection in Contact Center", "11304607715994-Configuring-outbound-queue-selection-in-Contact-Center", "Setting up"),
  a("routing-profiles-update", "Updating Amazon Connect routing profiles for Contact Center", "11304595034266-Updating-Amazon-Connect-routing-profiles-for-Contact-Center", "Setting up"),
  s("setup-all", "Setting up Contact Center (all 43 articles)", "9641975750554-Setting-up-Contact-Center", "Setting up"),
  a("getting-started", "Getting started with Zendesk Contact Center (app)", "10512753593370-Getting-started-with-Zendesk-Contact-Center-app", "Marketplace app"),
  a("implementing", "Implementing Zendesk Contact Center (app)", "9824150119450-Implementing-Zendesk-Contact-Center-app", "Marketplace app"),
  a("direct-routing", "Configuring number assignments and voicemail for direct agent routing (app)", "10255377209498-Configuring-number-assignments-and-voicemail-for-direct-agent-routing-app", "Marketplace app"),
  a("voicemail", "Configuring voicemail in Contact Center (app)", "10255333454490-Configuring-voicemail-in-Contact-Center-app", "Marketplace app"),
  a("routing-profiles", "Managing routing profiles in Contact Center (app)", "9791029507738-Managing-routing-profiles-in-Contact-Center-app", "Marketplace app"),
  a("display-attributes", "Displaying attributes to agents (app)", "9790998800410-Displaying-attributes-to-agents-app", "Marketplace app"),
  s("app-all", "Documentation for Contact Center marketplace app (all 23 articles)", "10880055043226-Documentation-for-Contact-Center-marketplace-app", "Marketplace app"),
  a("ai-suggestions", "Using real-time AI suggestions in Contact Center", "10143999626394-Using-real-time-AI-suggestions-in-Contact-Center", "AI & analytics"),
  a("qa-transcriptions", "Using Zendesk QA for call transcriptions in Contact Center", "9475134529050-Using-Zendesk-QA-for-call-transcriptions-in-Contact-Center", "AI & analytics"),
  a("dashboards-understand", "Understanding Contact Center dashboards", "9459010766362-Understanding-Contact-Center-dashboards", "AI & analytics"),
  a("dashboards-app", "Using the Contact Center dashboards app", "9696160145818-Using-the-Contact-Center-dashboards-app", "AI & analytics"),
  { id: "marketplace", title: "Zendesk for Contact Center Dashboards (Marketplace)", url: LINKS.marketplace, category: "AI & analytics", kind: "Product page" },
  { id: "product", title: "Zendesk Contact Center product page", url: LINKS.product, category: "Platform & product", kind: "Product page" },
  { id: "resolution", title: "Zendesk: Advancing the Resolution Platform", url: LINKS.resolution, category: "Platform & product", kind: "Product page" },
  { id: "storylane", title: "Guided click-through demo (Storylane)", url: DEMO_URL, category: "Platform & product", kind: "Product page" },
  { id: "gtm", title: "Contact Center Level 1 Foundation GTM guide (internal, access required)", url: LINKS.gtmDoc, category: "Platform & product", kind: "Internal" },
];

export const PILLARS = [
  { t: "One platform for every conversation", d: "Bring agentic AI, voice, email, chat, SMS, and WEM together on one platform for more consistent support across channels." },
  { t: "Voice AI that delivers better outcomes", d: "Use AI throughout the call to help customers resolve issues, support agents, and give supervisors clearer insight." },
  { t: "Improve service with every call", d: "Use insights from customer calls to improve AI performance, service quality, and operational efficiency." },
];

export const FEATURES = [
  { tag: "Voice AI agents", t: "Voice AI agents", d: "Automate up to 80% of interactions with AI that delivers outcomes, not just basic responses. Voice AI agents use shared knowledge, data, and workflows to resolve issues or route customers to the best agent with full context." },
  { tag: "Agent assist", t: "Voice copilots", d: "Listen to live calls, fill out complex forms, and suggest responses in one place. Connect third-party tools for workflows such as booking deliveries and processing returns." },
  { tag: "Global service", t: "Real-time voice translation", d: "Enable instant translation between customers and agents, helping teams serve more customers across regions with one workforce." },
  { tag: "Workforce engagement", t: "AI-powered WEM", d: "Use AI-driven workforce management and quality tools to forecast, schedule, and monitor human and AI interactions." },
  { tag: "Privacy controls", t: "Transcription with redaction", d: "Contact Lens can redact transcripts and recordings when configured. Zendesk QA can redact post-call transcripts with the Advanced Data Privacy and Protection add-on; transcript redaction does not redact attached call audio." },
  { tag: "Compliance", t: "PHI and HIPAA compliance", d: "Contact Center can be used with a HIPAA-enabled Zendesk account under Advanced Compliance. A separate AWS BAA is required for integrated AWS services, including Amazon Connect; eligibility and configuration requirements apply." },
  { tag: "Follow-up automation", t: "Proactive outbound calling", d: "Manage follow-ups automatically with proactive outbound calling." },
  { tag: "Call quality", t: "Real-time call monitoring", d: "Monitor calls in real time to gauge customer mood and call quality." },
  { tag: "Connected channels", t: "Connected digital, voice, and visual channels", d: "Switch seamlessly between digital, voice, and visual channels." },
];

export const JOURNEY = [
  { k: "01", label: "Customer", t: "Voice", d: "Customer calls the service line.", detail: "Voice entry: Amazon Connect receives the customer call and begins the configured contact flow.", chips: [] as string[] },
  { k: "02", label: "Voice + routing", t: "Amazon Connect", d: "Contact flows handle IVR, routing, and configured AWS integrations.", detail: "Contact flows orchestrate IVR (Amazon Lex), Lambda integrations, and Contact Lens analytics before routing to the right queue.", chips: ["Lex · IVR", "Lambda", "Contact Lens"] },
  { k: "03", label: "Call context", t: "Call context", d: "Attributes can populate tickets. Recordings and transcripts depend on enabled features and writeback settings.", detail: "Mapped attributes, transcripts when enabled, and recordings when enabled travel toward the Zendesk ticket.", chips: ["Mapped attributes", "Transcripts, when enabled", "Recordings, when enabled"] },
  { k: "04", label: "Agent experience", t: "Zendesk Contact Center", d: "Agents manage calls and tickets together in Zendesk Agent Workspace.", detail: "Call controls, ticket, and customer context sit together in Agent Workspace.", chips: ["Call controls", "Ticket", "Customer context"] },
];

export const FLOW_NODES = [
  { id: "zcc", side: "Zendesk AWS Cloud", t: "Zendesk Contact Center", sub: "Agent Workspace", d: "Call controls run in Zendesk Agent Workspace. The experience can read Amazon Connect Customer Profiles and custom contact attributes using the logged-in agent's permissions.", chips: ["Ticket search", "Agent status sync", "Call analysis", "Reporting + usage"] },
  { id: "connect", side: "Customer AWS Cloud", t: "Amazon Connect", sub: "Voice + contact flows", d: "Amazon Connect hosts the voice experience, contact flows, and routing foundation.", chips: ["Voice", "Contact flows", "Routing"] },
  { id: "lambda", side: "Customer AWS Cloud", t: "API Gateway + Lambda", sub: "Integration helpers", d: "Lambda functions and API Gateway carry call events, transcripts, recordings, and agent UI requests between Connect and Zendesk.", chips: ["Event handling", "API proxy"] },
  { id: "cognito", side: "Customer AWS Cloud", t: "AWS Cognito", sub: "Template component", d: "Cognito holds Contact Center user accounts for agents, supervisors, and admins, deployed by the CloudFormation template.", chips: ["User pool", "SAML 2.0"] },
  { id: "internal", side: "Customer AWS Cloud", t: "Internal systems", sub: "Data lake · CRM · other", d: "Customer-owned systems that contact flows and Lambda helpers can reach for lookups or data distribution, depending on configuration.", chips: ["Data lake", "CRM"] },
  { id: "records", side: "Customer AWS Cloud", t: "Call records", sub: "Logs · transcripts · CTRs", d: "Contact attributes, transcripts, and Contact Trace Records produced in the customer's AWS account.", chips: ["Contact attributes", "Transcripts", "Contact Trace Records"] },
];
export const FLOWS = [
  { id: "controls", t: "Agent controls", path: ["zcc", "lambda", "connect"], d: "Agent actions in Workspace are proxied through API Gateway and Lambda to Amazon Connect." },
  { id: "context", t: "Customer context", path: ["connect", "lambda", "zcc"], d: "Caller lookup (ticket or contact search) and mapped attributes flow into the agent experience during the live call." },
  { id: "records", t: "Call records", path: ["connect", "records", "lambda", "zcc"], d: "After the call, Contact Trace Records, recordings, and transcripts are processed and sent to Zendesk where configured." },
];

export const CORE_COMPONENTS = [
  { n: "01", t: "Amazon Connect", d: "The telephony and contact-routing foundation. Each customer supplies a Connect instance in their AWS account; one Contact Center environment links to one Connect instance.", chips: ["Voice", "Chat", "Queues", "Contact flows"] },
  { n: "02", t: "Contact Center app", d: "A Zendesk-built web app that works with Connect. Agents use it for calls and messages, omnichannel workflows, AI-powered tools, and dashboards.", chips: ["Agent interface", "Omnichannel", "AI tools"] },
  { n: "03", t: "Identity and sign-in", d: "Amazon Cognito holds Contact Center user accounts for agents, supervisors, and admins. Zendesk acts as a SAML 2.0 identity provider for sign-in to Connect, Cognito, and the AWS console after users authenticate through their corporate identity provider.", chips: ["Cognito user pool", "SAML 2.0 SSO", "Corporate MFA policies"] },
  { n: "04", t: "CloudFormation", d: "Automates deployment of the AWS resources and permissions that connect the app and Connect, including Cognito, IAM roles, Lambda functions, and streaming connections.", chips: ["Automated setup", "AWS permissions", "Stack lifecycle"] },
];

export const LAMBDAS = {
  deployment: [
    { n: "FetchConnectDetails", d: "Reads Connect configuration such as storage settings, bucket names, KMS keys, Kinesis streams, and the Customer Profiles domain to supply stack parameters." },
    { n: "SubscribeRecordingBucket", d: "Enables EventBridge notifications on the call-recording S3 bucket." },
    { n: "ContactLensStreamsLambda", d: "Associates the Contact Lens Kinesis stream with Connect storage when a stream is not already configured." },
  ],
  runtime: [
    { n: "ZendeskVoicePostCall", d: "After a call, processes Contact Trace Records, reads the recording from S3, and sends call data to the Zendesk Voice API." },
    { n: "ZendeskVoiceSearch", d: "Searches for the caller's Zendesk ticket or contact record during a live call." },
    { n: "ContactLensEventsLambda", d: "Forwards real-time Contact Lens conversation-analysis events to Zendesk." },
    { n: "CTRIngestLambda", d: "Forwards Contact Trace Record analytics to Zendesk, including data used by the Resolution Code dashboard." },
    { n: "TranscriptIngestLambda", d: "Uploads chat transcript JSON from S3 after EventBridge detects a new transcript file." },
    { n: "RecordingIngestLambda", d: "Notifies Zendesk when EventBridge detects a completed voice recording in S3." },
    { n: "ZendeskAPI", d: "Acts as an API Gateway proxy for the Zendesk admin UI and reads or writes AWS Systems Manager Parameter Store and Secrets Manager values." },
    { n: "VoiceAIBrokerRegisterContext", d: "Registers Voice AI context and returns the transfer number and DTMF tones used to continue a contact flow." },
    { n: "MainHandler", d: "Serves agent UI requests, proxies calls to Connect, Customer Profiles, and Wisdom, creates presigned S3 URLs for transcripts and attachments, and manages Cognito sessions." },
  ],
};

export const REGIONS = [
  { r: "Americas", pts: [{ n: "Oregon", x: 16, y: 36 }, { n: "Ohio", x: 25, y: 35 }, { n: "N. Virginia", x: 28, y: 39 }] },
  { r: "Europe", pts: [{ n: "London", x: 48, y: 28 }, { n: "Ireland", x: 45.5, y: 27 }, { n: "Frankfurt", x: 51.5, y: 30 }] },
  { r: "Asia Pacific", pts: [{ n: "Tokyo", x: 87, y: 38 }, { n: "Osaka", x: 85.5, y: 40 }, { n: "Sydney", x: 89, y: 76 }] },
];

export const USE_CASES = [
  { t: "Stop making customers repeat themselves", scenario: "A customer tried self-service, then chat, and now they call, frustrated. They're asked to repeat their account details, explain the issue again, and then they get transferred.", broken: ["Channels are siloed (voice over here, digital over there)", "Agent doesn't have the full context", "Transfers and re-explaining drive up handle time and customer frustration"], enables: ["Voice and digital interactions can be part of a more unified service experience", "Agents can work in one place with better context", "Routing can reduce unnecessary transfers"], outcome: ["Faster resolutions", "Better customer experience (less friction, fewer repeats)", "Less time wasted per interaction"] },
  { t: "Route calls to the right expert the first time", scenario: "A customer calls with a billing dispute. The first agent is polite but isn't a billing expert. They transfer the call. The customer waits again. Now they're annoyed and the clock is ticking.", broken: ["Calls are routed based on availability, not best fit", "Transfers are disruptive in voice (more so than digital)", "First Contact Resolution suffers (solved only after multiple handoffs)"], enables: ["Skill/proficiency-based routing patterns can get the call to the right person sooner", "Handle real-time voice journeys with fewer costly transfers"], outcome: ["Higher First Contact Resolution", "Lower Average Handle Time (less bouncing around)", "Lower customer frustration"] },
  { t: "Let AI handle the simple stuff so humans can handle the hard stuff", scenario: "A contact center is overwhelmed with repetitive calls: \u201cWhere's my order?\u201d \u201cCan you reset my password?\u201d \u201cWhat's my account status?\u201d Meanwhile complex calls pile up, and customers who really need a human wait longer than they should.", broken: ["Humans are doing work that could be automated", "High-cost voice agents get tied up in low-complexity tasks", "Customers with complex needs experience long wait times"], enables: ["A more modern model where automation and humans work together", "AI supports deflection (resolving without a live agent) and triage, while humans focus on complex, emotional, or high-stakes calls"], outcome: ["Reduced volume to agents", "Faster service for complex calls", "Better cost-to-serve over time"] },
  { t: "Cut after-call work and reduce agent burnout", scenario: "An agent finishes a call and then spends a long time on notes, summaries, tagging, and updating other systems. Multiply that by hundreds of calls and dozens of agents. It's exhausting, and it reduces capacity.", broken: ["After-call work eats up time and attention", "Documentation is inconsistent (or rushed)", "It contributes to burnout and churn"], enables: ["Real-time transcription and summaries can reduce manual note-taking when enabled", "More consistent records help the next agent and the broader team"], outcome: ["More available agent time", "Better consistency and continuity across interactions", "Improved agent experience (lower cognitive load)"] },
  { t: "Consolidate the tech stack: one platform, fewer vendors", scenario: "A company uses Zendesk for digital support, but voice is handled elsewhere. IT is pushing to consolidate. Procurement is tired of vendor sprawl. Support leadership is tired of disconnected reporting.", broken: ["Separate systems create duplicated effort and fragmented insights", "Multiple vendors mean multiple renewals, security reviews, and support motions", "Disconnected data limits the ability to improve service with AI across channels"], enables: ["A path to consolidate onto Zendesk as the service platform", "Voice becomes part of the same overall service ecosystem and improvement loop"], outcome: ["Simpler operations", "Lower tool sprawl and less integration maintenance", "A more unified foundation for AI and service optimization"] },
];

export const OUTCOMES = [
  { co: "The Good Meal Co", theme: "Voice and web service", stats: [["5 weeks", "implementation time"], ["60 / 40", "orders via voice / web"]] },
  { co: "SupportZebra", theme: "Less after-call work", stats: [["30\u201350%", "lower average handle time"], ["<5 min", "after-call work"]] },
  { co: "TELUS", theme: "More efficient follow-up", stats: [["50%+", "less after-work time vs voice"], ["+5 p.p.", "first-contact resolution vs voice"]] },
];

export const FAQ = [
  ["What is contact center software?", "Software for managing customer conversations across channels, especially voice. It brings together tools such as routing, call controls, AI automation, and workforce management."],
  ["What is Zendesk Contact Center?", "An AI-powered contact center built on the Zendesk Resolution Platform. It combines voice, digital, and self-service workflows in the Zendesk agent experience, where AI and human agents can work together."],
  ["How is Zendesk Contact Center different from Zendesk Voice?", "Zendesk Voice is positioned for smaller teams with simpler inbound needs. Contact Center is designed for more complex operations, with capabilities such as advanced IVR orchestration, predictive dialing, and deeper AI automation."],
  ["What makes Zendesk Contact Center truly enterprise-grade?", "Zendesk's page cites an intelligence layer trained on more than 18 billion service interactions, support in 158 countries, 40+ Tier-1 carriers, and 99.9% uptime SLAs. Confirm the scope and applicable SLA in current product and contract documentation."],
  ["How does Zendesk Contact Center impact my agents' productivity?", "Voice is integrated into Agent Workspace. Voice Copilot can help with notes, summaries, and sentiment during calls, while workforce management and QA tools support coaching and operations."],
  ["How does Zendesk support compliance in regulated industries?", "Zendesk's product page lists GDPR, HIPAA, SOC 2 Type II, and data-residency controls for voice recordings. Confirm certification scope, region, and configuration with current trust documentation."],
  ["What makes Zendesk Contact Center different from other CCaaS voice solutions?", "Zendesk positions Contact Center as an AI-enabled service platform that brings voice together with digital, self-service, and the Zendesk agent workflow. The page emphasizes integrated AI and a unified vendor experience; purchasing options can vary."],
];

export const ROADMAP = {
  executive: [
    { when: "Q2 2026", t: "Fully native Contact Center", d: "Build the foundation for power, data, and faster innovation across the Resolution Platform.", items: ["Unified workspace", "Multimodal video", "Zendesk AI agents", "Zendesk knowledge"] },
    { when: "Q3 2026", t: "Agentic Contact Center", d: "Use service data to orchestrate self-service, routing, and tasks across systems.", items: ["Voice AI agents", "Copilot Auto Assist", "Admin Copilot actions", "Expanded knowledge"] },
    { when: "Q4 2026", t: "Enriched data and insights", d: "Unify call events to support real-time insights, predictive forecasting, and custom call scoring.", items: ["Integrated OCR", "Task agents", "Intelligent AI routing", "Unified WEM"] },
    { when: "EOY", t: "Self-improving service", d: "Envision a business analyst that identifies trends and recommends actions through custom reports and conversational BI.", items: ["Analyst Copilot", "Conversational BI", "Real-time QA", "AI agent QA"] },
  ],
  technical: [
    { when: "Q2 2026", t: "Workspace foundation", d: "", items: ["Unified Agent Workspace MVP: embed call capabilities in the agent workspace", "Unified Call Object: manage voice interactions natively within Zendesk", "Voice Copilot knowledge suggestions: surface relevant knowledge during calls (deck labels this LIVE)", "Voice AI Agents (deck labels these EAP LIVE)"] },
    { when: "Q3 2026", t: "Multimodal and agent support", d: "", items: ["Video calling and screen sharing initiated by agents", "Voice Copilot Auto Assist with post-call instructions for faster wrap-up", "Unified Dashboards with real-time and historical reporting"] },
    { when: "Q4 2026", t: "Advanced operations and AI", d: "", items: ["Advanced Multimodal with AI transcription, workflow automation, and customer-initiated video", "Real-time QA and Voice AI Agent Reporting", "Unified Omnichannel Routing (OCR) between Zendesk and Amazon Connect", "Unified WFM and Analyst Copilot"] },
  ],
  internal: [
    { when: "Aug\u2013Oct FY2027", t: "Native Contact Center parity", d: "", items: ["VDI optimization, quick connects, outbound queue selection, custom call attributes, and multi-tab support", "Agent-initiated browser video and real-time screen sharing; native voicemail configuration", "Copilot template instructions and Contact Center Voice AI agents", "Real-time voice translations (EAP) and unified real-time QA"] },
    { when: "Nov\u2013Jan FY2027", t: "Enterprise Contact Center", d: "", items: ["Multiple Amazon Connect instances, ACGR, Amazon Connect chat, and integrated team management", "Contact Center CX Agents and Copilot Auto Assist", "Analyst Copilot for self-service NQL dashboards through HyperArc", "Unified WFM and dashboards, plus department and brand support"] },
    { when: "Feb\u2013Jul FY2028", t: "Enterprise voice controls", d: "", items: ["Interrupt routing, agent-to-agent calling, and agent call-recording permissions", "Integrated omnichannel routing, video call recording, and an AI-configured Contact Center", "Contact Center Call Object for complex conversations and human handoff", "Voice AI Agents Phase 2, advanced multimodal support, and real-time translation GA", "Outcome-based pricing migration and preview-dialing outbound campaigns"] },
  ],
};

export const GTM = [
  { t: "Market context and customer pain", body: "The guide frames the category shift as on-premise telephony moving to cloud contact centers, then toward AI-first service. Buyers want voice to work as part of the overall service experience, with less tool sprawl and less friction for customers and agents.", list: ["Legacy stacks separate voice, ticketing, CRM, knowledge, and reporting.", "Customers repeat information, get transferred, and wait while agents search for context.", "Agents swivel between tools; leaders face fragmented reporting and growing integration effort.", "Common buyer signals include consolidation pressure, demand for real-time AI value, agent experience concerns, and high expectations for voice reliability."] },
  { t: "Product story and role of Amazon Connect", body: "Describe Zendesk Contact Center as Zendesk's enterprise-grade voice solution for organizations where voice is important and requirements are more complex. Amazon Connect provides the cloud telephony foundation; Zendesk Contact Center connects that voice layer with Zendesk Agent Workspace and the broader service platform.", list: ["Simple positioning: \u201cZendesk Contact Center brings scalable voice capabilities into the Zendesk experience, helping teams support customers across voice and digital channels in a more unified way.\u201d"] },
  { t: "Core capabilities to recognize", body: "Use the relevant product and configuration details when describing availability; this overview is for first conversations, not technical scoping.", list: ["Conversational IVR: guides callers to the right next step and can handle simpler requests.", "Intelligent routing: routes calls based on customer need and agent fit, helping reduce avoidable handoffs.", "Queue and call handling: manages real-time demand, including callback patterns where configured.", "Agent Workspace: keeps voice work connected to tickets, customer context, and Zendesk workflows.", "AI support: live transcription, knowledge suggestions, and summaries can support agents during and after calls.", "After-call work: automation and AI assistance can reduce manual wrap-up effort and improve consistency.", "Reporting and quality: turns interactions into operational insights for service improvement."] },
  { t: "Buyer lenses and discovery questions", body: "Starter questions to open the conversation.", list: ["Customer experience leaders: broken handoffs, channel inconsistency, slow resolution, and AI trust concerns.", "Contact center operations: call volume, routing friction, high handle time, manual wrap-up, and agent capacity issues.", "IT leaders: vendor sprawl, integration complexity, legacy infrastructure, and reliability requirements.", "Executive and financial leaders: cost-to-serve, software spend, and scaling without adding headcount at the same rate.", "Do customers contact you by phone today, and when is voice most critical?", "How do agents handle a call when the customer started in self-service or chat?", "How much time do agents spend updating records and logging notes after calls?", "How many systems or vendors run voice and customer support today?", "How do complex calls reach the right expert without repeated handoffs?"] },
  { t: "Early qualification and specialist handoff", body: "Listen for the \u201cgravity\u201d of the voice channel: whether voice is a major channel, where escalations happen, whether an outage would be business-critical, and whether basic voice tools no longer fit. A strong handoff includes the customer's environment, current voice stack, urgency, target outcomes, and known scale or routing complexity.", list: ["Confirm voice is a real, relevant channel.", "Understand scale and operational complexity without relying only on seat count.", "Identify the current voice platform and buying context.", "Connect the customer's pain to measurable outcomes.", "Bring in Contact Center specialists when there is meaningful fit and a real project."] },
  { t: "Positioning and competitive conversations", body: "Lead with outcomes rather than a feature checklist: a more unified voice and digital experience, better agent context, fewer disconnected tools, and a platform that can improve service over time. When a competitor comes up, acknowledge it and ask what is driving change, then choose the relevant story instead of guessing.", list: ["Three-beat pitch: what it is (enterprise-grade voice in Zendesk), why it matters (voice remains critical and fragmented tools create friction), and why now (AI and consolidation make unified service more valuable)."] },
  { t: "Commercial model and expectation setting", body: "Pricing may include per-user licensing, minute blocks, and additional usage charges. Implementation is typically paid, and support expectations depend on the purchase path. Confirm current packaging, pricing, services, and support requirements with a Contact Center specialist before quoting.", list: ["Zendesk Contact Center bundle: Zendesk Contact Center and Amazon Connect together under a Zendesk contract.", "Contact Center License: a bring-your-own-Amazon path for customers with an AWS relationship or preference.", "Contact Center Team: a lighter-weight option for customers who do not need the full Suite path."] },
  { t: "Objection handling and key terms", body: "Acknowledge the concern, ask one clarifying question, reconnect the discussion to outcomes, and involve specialists when technical detail is needed.", list: ["FCR: First Contact Resolution, the share of issues resolved during the first interaction.", "AHT: Average Handle Time, including talk, hold, and wrap-up time.", "Deflection: resolving an inquiry through automation or self-service before it reaches a live agent.", "Skills-based routing: routing calls toward agents suited to the customer's topic or urgency.", "CCaaS: Contact Center as a Service, a cloud-delivered contact center platform."] },
];
