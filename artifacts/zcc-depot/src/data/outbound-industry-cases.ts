import type { DialMode } from "@/lib/outbound-dialer";

export interface OutboundUseCase {
  name: string;
  objective: string;
  mode: DialMode;
  segment: string;
  compliance: string;
  journey: string[];
  outcome: string;
  config: string[];
}

/** Illustrative architecture choices, not promises of results or regulatory exemptions. */
export const INDUSTRY_CASES: Record<string, OutboundUseCase[]> = {
  fin: [
    {
      name: "Payment reminders", mode: "agentless",
      objective: "Help customers acknowledge an upcoming payment before its due date.",
      segment: "Consenting account holders with a payment due in seven days",
      compliance: "Validate prerecorded-call consent, number ownership, frequency and any debt-collection obligations with counsel.",
      journey: ["Eligible payment cohort", "SMS reminder", "No response", "Agentless voice", "Confirm or request help"],
      outcome: "Potentially fewer missed payments and avoidable servicing calls.",
      config: ["Agentless flow with input", "Consent integration", "Attempt limits and local windows"],
    },
    {
      name: "Account servicing", mode: "predictive",
      objective: "Work a large queue of routine account-maintenance conversations.",
      segment: "Active accounts with unresolved administrative servicing tasks",
      compliance: "Separate servicing from marketing; review automated dialing, wireless consent, DNC and abandonment requirements.",
      journey: ["Service-task segment", "Eligibility gate", "Predictive pacing", "Human answer", "Servicing agent", "Task disposition"],
      outcome: "Potentially more useful conversations per staffed agent hour.",
      config: ["Predictive capacity", "Short classification-to-queue path", "Abandonment monitoring"],
    },
    {
      name: "Fraud follow-up", mode: "preview",
      objective: "Let a specialist review a case before discussing potentially sensitive activity.",
      segment: "Open fraud-review cases approved for a follow-up call",
      compliance: "A fraud-related purpose is not a blanket exemption. Validate consent and safe identity-verification procedures.",
      journey: ["Approved fraud case", "Specialist preview", "Review safe context", "Agent dials", "Verify identity", "Record case outcome"],
      outcome: "Potentially better-prepared conversations without disclosing sensitive details in a message.",
      config: ["Preview timer", "Classification disabled", "Restricted profile fields", "Custom case association"],
    },
  ],
  hc: [
    {
      name: "Appointment reminders", mode: "agentless",
      objective: "Confirm attendance or capture a request to reschedule.",
      segment: "Opted-in patients with appointments in the next 48 hours",
      compliance: "Review privacy, consent and message content. Do not expose health details in voicemail or assume a healthcare exemption.",
      journey: ["Appointment cohort", "Approved reminder", "Agentless call", "Confirm / reschedule", "Update scheduling system"],
      outcome: "Potentially fewer missed appointments and less manual reminder work.",
      config: ["Approved message template", "IVR confirmation", "Custom scheduling update", "Staffed transfer option"],
    },
    {
      name: "Care coordination", mode: "preview",
      objective: "Give coordinators relevant discharge context before a personal conversation.",
      segment: "Patients discharged in the last seven days with an approved outreach task",
      compliance: "Limit health information to authorized users; validate consent scope, revocation and applicable privacy rules.",
      journey: ["Discharge task", "Coordinator preview", "Review care notes", "Agent dials", "Care conversation", "Follow-up plan"],
      outcome: "Potentially more informed follow-up and clearer next steps for patients.",
      config: ["Preview timer", "Classification disabled", "Transfer to queue", "Custom care-record linkage"],
    },
    {
      name: "Preventive outreach", mode: "progressive",
      objective: "Invite eligible patients to discuss a preventive-care opportunity.",
      segment: "Consenting patients with a documented care gap and no recent outreach",
      compliance: "Validate program purpose, consent and privacy protections; apply frequency and suppression policies.",
      journey: ["Care-gap segment", "Consent and window", "Available coordinator", "Progressive call", "Offer appointment", "Record preference"],
      outcome: "Potentially better care-gap engagement with controlled staffing demand.",
      config: ["Dedicated coordinator queue", "Progressive allocation", "Frequency limits", "Consent source integration"],
    },
  ],
  ins: [
    {
      name: "Policy renewals", mode: "progressive",
      objective: "Discuss expiring policies while keeping specialists available.",
      segment: "Policies renewing within 120 days, sorted by renewal date",
      compliance: "Renewal offers may be telemarketing. Validate consent, DNC, state requirements and calling windows.",
      journey: ["Renewal cohort", "Email notice", "Wait for response", "Available agent", "Progressive call", "Renewal disposition"],
      outcome: "Potentially more timely renewal conversations with lower over-dial risk.",
      config: ["Progressive allocation", "Exclusive routing profile", "Voice-only sorted segment"],
    },
    {
      name: "Claims follow-up", mode: "preview",
      objective: "Review a claim and its outstanding documents before contacting the customer.",
      segment: "Open claims awaiting a customer action, excluding resolved and suppressed cases",
      compliance: "Restrict claim information, confirm identity and validate consent; do not assume servicing calls are exempt.",
      journey: ["Outstanding claim", "Adjuster preview", "Review missing items", "Agent dials", "Explain next action", "Update claim task"],
      outcome: "Potentially fewer repeat calls and clearer claim-resolution steps.",
      config: ["Preview mode", "Classification disabled", "Claim attributes", "Custom claims-system update"],
    },
    {
      name: "Coverage notifications", mode: "agentless",
      objective: "Notify eligible customers of an important policy-service update.",
      segment: "Policyholders affected by a specific approved coverage-service notice",
      compliance: "Review content for marketing versus servicing, prerecorded consent, delivery evidence and privacy.",
      journey: ["Affected policies", "Approved email", "Delivery check", "Agentless fallback", "Acknowledge or request agent"],
      outcome: "Potentially more consistent notice delivery and a clear response path.",
      config: ["Message templates", "Agentless IVR", "Delivery outcomes", "Staffed queue when transferring"],
    },
  ],
  travel: [
    {
      name: "Schedule changes", mode: "agentless",
      objective: "Tell affected travellers about a schedule change promptly.",
      segment: "Passengers booked on the changed itinerary with eligible contact channels",
      compliance: "Validate consent, international destination restrictions and local times; informational purpose is not an automatic exemption.",
      journey: ["Changed itinerary", "WhatsApp notice", "Delivery check", "Agentless fallback", "Confirm or transfer"],
      outcome: "Potentially fewer surprise disruptions and inbound contact spikes.",
      config: ["WhatsApp opt-in and approved template", "Agentless fallback", "Multi-contact time-zone inference"],
    },
    {
      name: "Reservation notifications", mode: "agentless",
      objective: "Confirm reservation details without requiring a staffed call.",
      segment: "New reservations awaiting confirmation and not already acknowledged",
      compliance: "Minimize personal data, respect channel opt-outs and validate automated-message consent.",
      journey: ["New reservation", "Email confirmation", "Wait for acknowledgement", "Voice reminder", "Customer confirms"],
      outcome: "Potentially fewer unconfirmed reservations and manual follow-up tasks.",
      config: ["Email templates", "Agentless confirmation flow", "Cross-channel frequency limits"],
    },
    {
      name: "Service recovery", mode: "preview",
      objective: "Give a specialist disruption history before discussing a recovery option.",
      segment: "Unresolved high-impact travel disruptions assigned for personal follow-up",
      compliance: "Keep servicing and promotional offers separate; validate consent, identity and sensitive travel data handling.",
      journey: ["Recovery task", "Specialist preview", "Review disruption", "Agent dials", "Agree recovery", "Record follow-up"],
      outcome: "Potentially more relevant recovery conversations and less repetition.",
      config: ["Preview mode", "Classification disabled", "Case context", "Custom resolution association"],
    },
  ],
  util: [
    {
      name: "Maintenance notifications", mode: "agentless",
      objective: "Notify affected households about planned maintenance.",
      segment: "Consenting accounts in the affected grid or service area",
      compliance: "Validate notification purpose, prerecorded-call rules, consent and state-specific restrictions with counsel.",
      journey: ["Maintenance area", "Eligibility gate", "Agentless notice", "Voicemail or human", "Acknowledge", "Complete"],
      outcome: "Potentially broader notice coverage with less manual calling.",
      config: ["Agentless capacity", "Voicemail branch", "Calling windows", "Bounded retry strategy"],
    },
    {
      name: "Service appointments", mode: "progressive",
      objective: "Coordinate an appointment with a customer when a scheduler is ready.",
      segment: "Service orders requiring a visit and lacking a confirmed slot",
      compliance: "Confirm service-call consent, local time, suppression status and safe disclosure of address information.",
      journey: ["Unscheduled order", "SMS scheduling link", "No response", "Available scheduler", "Progressive call", "Confirm slot"],
      outcome: "Potentially fewer failed visits and more confirmed appointments.",
      config: ["Scheduler queue", "Progressive allocation", "Message template", "Custom scheduling integration"],
    },
    {
      name: "Billing reminders", mode: "preview",
      objective: "Let a billing specialist review an account before discussing assistance.",
      segment: "Accounts needing billing follow-up and eligible for the chosen contact purpose",
      compliance: "Validate debt-collection and consumer-protection obligations, consent, frequency and any sensitive-account restrictions.",
      journey: ["Billing follow-up", "Specialist preview", "Review account", "Agent dials", "Discuss options", "Record agreement"],
      outcome: "Potentially more appropriate assistance conversations and clearer account actions.",
      config: ["Preview timer", "Classification disabled", "Restricted account context", "Custom outcome writeback"],
    },
  ],
  tel: [
    {
      name: "Installation scheduling", mode: "progressive",
      objective: "Confirm installation appointments with an available scheduler.",
      segment: "New orders awaiting installation and a confirmed customer time",
      compliance: "Validate consent and channel preferences; apply frequency and local-time controls.",
      journey: ["Unscheduled install", "SMS invitation", "No response", "Progressive call", "Confirm appointment", "Update order"],
      outcome: "Potentially faster scheduling and fewer missed installations.",
      config: ["Scheduling queue", "Progressive allocation", "Customer profile attributes", "Custom order update"],
    },
    {
      name: "Service updates", mode: "agentless",
      objective: "Provide an approved update to customers affected by a service event.",
      segment: "Affected service accounts eligible for the specific notice",
      compliance: "Review notification purpose and consent; do not assume emergency or service-related exemptions apply.",
      journey: ["Affected service area", "Email or SMS notice", "Delivery check", "Agentless update", "Acknowledge or request help"],
      outcome: "Potentially more consistent service communications and fewer status enquiries.",
      config: ["Approved templates", "Agentless flow", "Delivery outcomes", "Cross-channel suppression"],
    },
    {
      name: "Customer retention", mode: "preview",
      objective: "Review the customer relationship before discussing a retention offer.",
      segment: "At-risk customers eligible for a reviewed retention program",
      compliance: "Retention offers may be telemarketing; validate DNC, consent scope, contact frequency and state rules.",
      journey: ["At-risk segment", "Retention preview", "Review service history", "Agent dials", "Discuss options", "Record preference"],
      outcome: "Potentially more relevant retention discussions without assuming guaranteed churn reduction.",
      config: ["Preview mode", "Classification disabled", "Custom account context", "Suppression integration"],
    },
  ],
  retail: [
    {
      name: "Order notifications", mode: "agentless",
      objective: "Keep customers informed about a material order-status change.",
      segment: "Orders with a new service update and an eligible communication preference",
      compliance: "Keep service notices distinct from marketing; validate automated-message consent and avoid sensitive payment details.",
      journey: ["Order update", "Email notification", "Delivery check", "Agentless fallback", "Confirm receipt"],
      outcome: "Potentially fewer order-status enquiries and more consistent updates.",
      config: ["Order-event integration", "Approved templates", "Agentless flow", "Attempt limits"],
    },
    {
      name: "Delivery coordination", mode: "progressive",
      objective: "Reach customers who need to agree a delivery time or resolve access details.",
      segment: "Deliveries requiring coordination and not already confirmed",
      compliance: "Respect consent, local times, address privacy and customer opt-outs across channels.",
      journey: ["Delivery exception", "SMS coordination link", "No response", "Available coordinator", "Progressive call", "Confirm delivery"],
      outcome: "Potentially fewer failed deliveries and less repeated coordination.",
      config: ["Coordinator queue", "Progressive allocation", "Custom logistics update", "Cross-channel frequency limits"],
    },
    {
      name: "Customer service follow-up", mode: "preview",
      objective: "Review an unresolved service case before a personal follow-up.",
      segment: "Open service-recovery tasks with approved consent and no recent contact",
      compliance: "Validate the purpose and consent scope; adding promotions can change the applicable requirements.",
      journey: ["Unresolved service case", "Agent preview", "Review previous interactions", "Agent dials", "Agree resolution", "Associate outcome"],
      outcome: "Potentially better-prepared service recovery and fewer repeated explanations.",
      config: ["Preview timer", "Classification disabled", "Customer history", "Custom Zendesk association"],
    },
  ],
};
