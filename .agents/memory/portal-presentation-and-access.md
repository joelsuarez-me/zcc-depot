---
name: Portal presentation and access
description: User requirements for hero density and internal sales-guide access.
---

Keep page heroes compact, including the landing-page Overview. Preserve its own Overview navigation link, but do not force it to occupy the browser viewport.

**Why:** The user repeatedly requested less vertical space for titles, subtitles, and shaded headers, aiming to see useful content in one browser viewport at 90% zoom. After trying an enlarged Overview, they requested a shorter hero with better-proportioned text and art.

**How to apply:** Keep the landing title and description close together and the illustration proportionate. Its decorative animation should run continuously by default, not only on hover, with a pause control and reduced-motion support. Keep the always-visible section arrows on the left by default on desktop, including before the first content section. On phones, keep arrows in the header across all routes, including signed-in pages, so they never obscure reading content. Preserve the wider collapsed-menu header treatment for Architecture and Demos.

Keep the gap between each main hero and its first content section compact too; do not recreate a large blank area through first-section padding.

**Why:** The user found the large headers excessive, requested another roughly 50% reduction after the first compacting pass, and identified the blank gap below the landing-page hero as wasted space.

**How to apply:** Preserve compact headers when adding pages; do not reintroduce forced full-screen hero heights.

Do not display numerical prefixes before section names, including navigation labels.

**Why:** The user explicitly requested unnumbered section names after earlier numbering passes.

**How to apply:** Keep new section headings and menu names unnumbered. This does not mean removing meaningful prices, statistics, or playback step counts.

The user supplied a Zendesk reference with an inset, rounded dark-green banner
on a white surround, approximately 150px tall on desktop, and requested this
treatment across the interior pages with animation in the background fill. Overview keeps the same branding.

**Why:** This refines their repeated requirement to reduce header height.

**How to apply:** Keep navigation spacing outside the banner; preserve a compact
title/subtitle area. Use the shared rounded-banner treatment on new pages, and
respect reduced-motion settings.

Every content section needs a direct URL.

**Why:** The user explicitly asked for direct section links.

**How to apply:** Preserve stable fragment IDs and visible permalink controls when adding or moving sections. Keep saved-agenda identifiers in shared URLs, and redirect old section links when content moves.

The Sell Sheet, its source PDF, and the full Pricing guide require sign-in.

**Why:** The PDF is marked Internal Only. The Pricing guide combines public prices with internal packaging guidance and an internal source link. The user explicitly selected signed-in access for both guides.

**How to apply:** Protect content and document bytes on the server, not merely by hiding the page. Public search may link to the sign-in gate but must not include the confidential guide text.

Saved demo research reports are shared with all signed-in portal users.

**Why:** The user selected shared signed-in access for the saved-report library.

**How to apply:** Keep report storage, loading and conversion into agendas behind server-side sign-in checks; do not make saved reports public or owner-only.
