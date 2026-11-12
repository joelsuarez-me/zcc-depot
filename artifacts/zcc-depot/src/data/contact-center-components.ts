/** Concise explanations derived from Zendesk's linked component guide. */
export const COMPONENT_GUIDE_URL = "https://support.zendesk.com/hc/en-us/articles/9829206009242-Understanding-Contact-Center-components";
export const APP_GUIDE_URL = "https://support.zendesk.com/hc/en-us/articles/9696121449114";

export type ContactComponentId = "identity" | "connect" | "app";
export const CONTACT_COMPONENTS = [
  {
    id: "identity" as const,
    title: "Zendesk Identity Provider",
    category: "Identity & access",
    summary: "One corporate sign-in, then access to the AWS services that power Contact Center.",
    description: "Agents first sign in to Zendesk using the corporate identity provider. Zendesk then acts as a SAML 2.0 identity provider for IdP-initiated SSO to Amazon Connect, Amazon Cognito and the AWS Management Console.",
    points: [
      "Keep Okta, Entra ID or Google Workspace as the corporate identity provider.",
      "MFA and access policies remain in the corporate identity provider.",
      "No separate SSO integrations are needed for these Contact Center AWS services.",
    ],
    boundary: "Purpose-built for Contact Center AWS services, not a general SAML broker for arbitrary third-party service providers.",
  },
  {
    id: "connect" as const,
    title: "Amazon Connect",
    category: "Telephony & routing",
    summary: "The contact-routing engine inside the customer's AWS environment.",
    description: "Amazon Connect handles telephony, calls, chat conversations, queues and contact flows. Each Contact Center environment is paired with exactly one Connect instance in the customer's AWS account.",
    points: [
      "Receive customer calls and chat conversations.",
      "Use queues and contact flows to route interactions.",
      "Connect the customer interaction to the Contact Center agent experience.",
    ],
    boundary: "One Contact Center environment ↔ one Connect instance. Multiple instances cannot share a single environment, or vice versa.",
  },
  {
    id: "app" as const,
    title: "Contact Center app",
    category: "Agent experience",
    summary: "A Zendesk-built interface that brings the agent's work together.",
    description: "Agents use the Contact Center web app to handle calls and messages delivered through their Connect instance. The app adds an omnichannel inbox, AI-powered tools and dashboards to the Connect experience.",
    points: [
      "Work across customer conversations in an omnichannel inbox.",
      "Use AI tools and dashboards alongside agent workflows.",
      "Use supporting AWS services deployed through CloudFormation.",
    ],
    boundary: "The app and its supporting components are deployed in the customer's AWS environment.",
  },
] as const;

export const SIGN_IN_STEPS = [
  {
    id: "corporate",
    title: "Corporate identity provider",
    subtitle: "Okta · Entra ID · Google Workspace",
    description: "The agent signs in to Zendesk through the corporate IdP. Existing MFA and access policies continue to apply there.",
  },
  {
    id: "zendesk",
    title: "Zendesk SAML 2.0 IdP",
    subtitle: "IdP-initiated single sign-on",
    description: "After corporate sign-in, Zendesk acts as a SAML 2.0 identity provider for the AWS services that power Contact Center.",
  },
  {
    id: "aws",
    title: "Contact Center AWS services",
    subtitle: "Amazon Connect · Cognito · AWS Management Console",
    description: "Zendesk enables SSO to these AWS services. Separate SSO integrations for each are not required. This is not a general broker for unrelated service providers.",
  },
] as const;

export function nextSignInStep(current: number) {
  const safe = Number.isFinite(current) ? Math.floor(current) : 0;
  return Math.min(SIGN_IN_STEPS.length - 1, Math.max(0, safe + 1));
}

export function componentConnections(id: ContactComponentId) {
  return {
    identityConnect: id === "identity" || id === "connect",
    connectApp: id === "connect" || id === "app",
    customerConnect: id === "connect",
    agentApp: id === "app",
  };
}
