# Demo Researcher

`/demos/brief` researches a company for an upcoming Zendesk Contact Center demo.
It uses Gemini through Replit AI Integrations with Google Search grounding.
There is no OpenAI dependency or user-supplied API key. Usage is billed to the
project owner's Replit credits.

## Use

1. Sign in, then open **Demos → 04 Demo Researcher**.
2. Enter the company name. The page attempts to identify its official website
   and retrieve an actual logo. Confirm or correct the website, especially for
   similarly named companies. If a logo is unavailable, research still works.
3. Complete region and audience/job role, then select **Generate report**.
4. Review the streaming draft. Only a completed, source-grounded report enables
   **Download PDF**. Canceled, failed, or truncated drafts cannot be exported.
5. Verify the cited findings before using them with a customer.

Reports have eight sections: executive snapshot, company context, technology,
support channels, use cases, demo focus, discovery questions, and sources.
They distinguish verified evidence, hypotheses, and unknowns rather than
inventing company pain points, vendors, metrics, or product capabilities.

## Operation and privacy

The existing portal authentication protects lookup, research, and logo bytes.
Company/demo inputs are sent to the approved Gemini integration for current
public-source research. Reports are not saved in a database; navigation/reload
clears the page, so download a completed report if it must be retained.
Normalized logos are held temporarily in bounded, user-isolated server memory.
No private customer data or credentials should be entered.

Server endpoints are documented in the OpenAPI specification. They impose
bounded request/response sizes, cancellation/timeouts, concurrent-request limits,
and per-user/global hourly usage limits. Limits are per running server instance,
not a durable billing quota. Website/logo fetches reject private addresses,
pin validated DNS answers, and revalidate redirects.

Both the API and web workflows must run. Managed Gemini configuration is
provisioned through Replit AI Integrations, not manually entered credentials.

Manual live probes under the API server's scripts perform billable calls; they
are not part of normal automated tests. API access/grounding/logo tests and
frontend stream/PDF tests use fixtures without paid generation.
