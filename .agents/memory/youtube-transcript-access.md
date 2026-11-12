---
name: YouTube transcript access
description: Distinguishing missing captions from failed caption retrieval.
---

An empty successful HTTP response from YouTube's caption endpoint is not proof that a video has no captions.

**Why:** The watch page can advertise an available caption track while direct caption requests return an empty body because of the platform's request-token requirements.

**How to apply:** Treat this as a retrieval failure. Use a reliable caption-retrieval source or user-uploaded captions before extracting highlights. Do not substitute the video's description for its spoken content.
