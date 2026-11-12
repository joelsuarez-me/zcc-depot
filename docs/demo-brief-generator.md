# Demo Researcher

This feature builds a company-specific research **prompt**, locally in the
website. It does not automatically browse the web, call an AI provider, or
produce researched company facts.

## Use it

1. Open **Demos → 04 Demo Researcher** (or search for “researcher”).
2. Enter the company name, public website, region/market, and demo audience.
3. Choose **Build prompt**, then copy the entire generated prompt.
4. Paste the prompt into Replit Agent and request the public web research.
5. Review the returned brief and verify the cited sources before a customer
   conversation. If browsing is unavailable, the instructions require the
   researcher to disclose that limitation instead of inventing facts.

The prompt asks for all eight requested sections, current research dates,
numbered clickable references, official Zendesk capability sources, and explicit
separation of verified facts, uncertain clues, and recommendations. The company
context section requests an official company logo with a cited source and
direct asset link, or an explicit unavailable notice if no logo can be verified.

## Setup and privacy

No API key, AI SDK, additional service, or database migration is required.
The page does not send or save the form values. They remain in page memory until
navigation or reload. Copying and pasting into a separate research conversation
is a deliberate user action; only enter public company information.

The page inherits the existing portal styling and compact hero.

## Run and verify

Use the existing `artifacts/zcc-depot: web` workflow, or run:

```sh
pnpm --filter @workspace/zcc-depot run dev
```

Open `/demos/brief` through the workspace Preview. Validation and prompt tests
can be run with the project's Node.js runtime:

```sh
node --test artifacts/zcc-depot/scripts/demo-brief-prompt.test.mjs
pnpm --filter @workspace/zcc-depot run typecheck
```
