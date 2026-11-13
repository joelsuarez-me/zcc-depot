---
name: Demo research prompts
description: Approved live company research using Gemini, without restoring OpenAI.
---

Keep OpenAI out of Demo Researcher. The user originally requested a local prompt
builder, then explicitly requested live on-page company research and PDF export
and approved “Use Gemini through Replit (recommended).”

**Why:** The user approved Gemini through Replit AI Integrations after being told
that no personal API key is required and usage is billed to Replit credits.
The later request supersedes the earlier local-only scope, not the removal of OpenAI.

**How to apply:** Use live search grounding for company reports. Distinguish drafts,
verified evidence, hypotheses, and unknowns; never present model memory as current
research. Generate only on explicit submission, not each field edit. A completed
report can be downloaded as a PDF. The user later requested saved-report history
and conversion to Demo Agenda. Do not reintroduce OpenAI or a personal API-key requirement.

Converting research from Demo Agenda must open an unsaved draft in Edit mode, with an explicit save after review.

**Why:** The user specifically required the ability to edit the converted agenda before saving.

**How to apply:** Preparing or canceling the conversion must not persist a new agenda or change the saved research. Protect any current unsaved agenda before replacing it.

Load the PDF exporter with the research route rather than deferring its module until the download click. Do not automatically reload a tab containing an unsaved report to recover from an asset error.

**Why:** A published version replaced the hashed export asset while an older research tab was still open; clicking Download then fetched missing JavaScript and failed. Reloading can discard unsaved research.

**How to apply:** Keep export dependencies available once the report page has loaded. If recovery requires a refresh, first let users save the report.

Research reports are customer-conversation agendas, not general company dossiers:
match Demo Agenda in both the on-screen report and its PDF.

**Why:** The user explicitly confirmed matching both the agenda's layout and its
sections, rather than applying the visual treatment to the previous research outline.

**How to apply:** Organize grounded research around the upcoming demo conversation,
retain an explicit cited evidence trail, and keep speculative fit separate from
verified facts. Do not copy customer facts from a sample agenda into new reports.
