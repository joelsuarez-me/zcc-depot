---
name: Keyboard test limitations
description: Distinguishing malformed browser automation input from native checkbox defects.
---

Check whether the automated browser delivered a valid Space keydown before changing a native checkbox that fails a keyboard test.

**Why:** The testing browser produced empty key and code values on Space keydown, followed by a valid Space keyup. This prevented a meaningful keyboard-toggle check even though focus and pointer toggling worked.

**How to apply:** Inspect the event payload. If the tool cannot deliver a well-formed keydown, report the verification limitation rather than adding custom keyboard handlers to compensate for automation. A failed automation attempt alone does not establish an application defect.
