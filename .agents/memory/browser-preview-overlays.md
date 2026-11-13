---
name: Browser preview overlays
description: Why top-level development browser geometry can differ from the embedded app preview.
---

Before treating a covered fixed header as an application regression, inspect whether the development preview notice is the covering element.

**Why:** The development banner appears on top-level development-domain pages but not inside the embedded preview. It can cover the entire phone header while the same app looks correct in the preview screenshot.

**How to apply:** Dismiss the notice through its own close control before measuring application geometry. Do not change application positioning or weaken hit-target checks to compensate for this development-only overlay. Keep app overlap checks active after dismissal.
