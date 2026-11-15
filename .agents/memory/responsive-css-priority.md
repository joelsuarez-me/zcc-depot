---
name: Responsive CSS priority
description: Cascade-layer, containing-block and fullscreen focus pitfalls in responsive overlays.
---

Unlayered component CSS outranks Tailwind's layered utilities, even when a responsive utility appears later in the class list. If a component class sets `display`, do not assume `hidden sm:grid` will control its visibility; use the component's own responsive rule or place its styles in an appropriate cascade layer.

**Why:** Phone verification revealed supposedly desktop-only controls still occupying the feature dialog's title row. The title became extremely narrow despite the visibility utilities.

**How to apply:** Check the computed cascade when mixing custom component styles with Tailwind visibility classes. In height-constrained flex dialogs, also prevent the header and footer from shrinking; leave scrolling to the middle content area so category chips and controls are not clipped.

Native fullscreen is not a reliable keyboard-modal boundary. Both native and fallback presentation need explicit background isolation, Tab/Shift+Tab containment and focus restoration. A fixed fallback inside a transformed ancestor is also constrained by that ancestor rather than necessarily filling the browser.

**Why:** A presentation filled the viewport visually while Tab still reached the page's skip link and background controls. The fallback had a separate transformed-dialog containing-block risk that a screenshot alone could not establish.

**How to apply:** Verify native and rejected-fullscreen paths separately with keyboard navigation. Resolve transformed containing blocks or portal placement without bypassing the parent dialog's focus behavior. Tailwind's independent CSS `translate` can survive `transform: none`; check both properties. Do not treat successful fullscreen dimensions as proof of focus containment.
