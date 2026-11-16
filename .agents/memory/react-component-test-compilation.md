---
name: React component test compilation
description: Keep React external when compiling JSX tests so Node tests can finish cleanly.
---
When compiling React component tests with esbuild for Node, use automatic JSX and leave React and its test renderer external to the bundle.

**Why:** Vite handles the automatic JSX transform, but a standalone esbuild bundle otherwise produced a classic transform with an undefined React global. Bundling React itself also broke its Node task-scheduler detection: awaited `act` calls used MessagePorts that kept the test process alive after every assertion passed.

**How to apply:** Compile JSX explicitly with the automatic transform. Put disposable output beneath ignored package dependency storage so external packages resolve correctly, and remove it after the run. Do not use forced process exit to hide application timer or observer leaks; assert their cleanup.

Async component harnesses need an ESM output or an explicit async wrapper for CommonJS. When emitting ESM, leave CommonJS React consumers such as `lucide-react` external as well.

**Why:** Bundling a CommonJS icon dependency into an ESM test can leave a dynamic `require("react")` shim that fails before the assertions run. That is a harness failure, not a browser application defect.

**How to apply:** Keep third-party runtime boundaries intact when testing page interactions; choose the output format to match top-level `await`, and externalize React-consuming CommonJS packages.
