---
name: Responsive CSS priority
description: Tailwind cascade-layer and flex-shrinking pitfalls in responsive component overlays.
---

Unlayered component CSS outranks Tailwind's layered utilities, even when a responsive utility appears later in the class list. If a component class sets `display`, do not assume `hidden sm:grid` will control its visibility; use the component's own responsive rule or place its styles in an appropriate cascade layer.

**Why:** Phone verification revealed supposedly desktop-only controls still occupying the feature dialog's title row. The title became extremely narrow despite the visibility utilities.

**How to apply:** Check the computed cascade when mixing custom component styles with Tailwind visibility classes. In height-constrained flex dialogs, also prevent the header and footer from shrinking; leave scrolling to the middle content area so category chips and controls are not clipped.
