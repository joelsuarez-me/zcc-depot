---
name: Seismic PDF rendering
description: Poppler can omit gradient backgrounds and white text from Seismic-exported slides.
---

Use MuPDF to render uploaded Seismic-exported pitch-deck slides when Poppler
reports missing or invalid shading coordinates. Inspect rendered slides before
embedding them in the portal.

**Why:** Poppler rendered the supplied deck's white text on a blank white
background, hiding most of each slide; MuPDF preserved the gradient backgrounds,
text, and artwork.

**How to apply:** Prefer original source-page images for faithful slide clones.
Do not compensate for a renderer failure by rewriting the source content.
