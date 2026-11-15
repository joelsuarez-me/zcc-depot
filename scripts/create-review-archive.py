"""Export application sources for review without environment or runtime data."""
from pathlib import Path
import hashlib
import json
import re
import zipfile
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "generated-artifacts/site-review"
OUT.mkdir(parents=True, exist_ok=True)
stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
target = OUT / f"ZCC-Depot-Source-Review-{stamp}.zip"
roots = ["artifacts/zcc-depot", "artifacts/api-server", "lib", "scripts", "docs"]
top_files = ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml",
             "tsconfig.json", "tsconfig.base.json", ".gitignore", ".replitignore"]
allowed = {".ts", ".tsx", ".js", ".mjs", ".cjs", ".css", ".json", ".yaml", ".yml",
           ".md", ".html", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".avif",
           ".gif", ".ico", ".ttf", ".woff", ".woff2", ".toml", ".sh", ".py", ".txt"}
blocked_dirs = {"node_modules", "dist", ".git", ".cache", "coverage", "playwright-report",
                "test-results", "uploads", ".local", ".agents", "generated-artifacts"}
blocked_names = {"profile.md", ".env", ".npmrc", "credentials.json", "token.json"}
patterns = [
    re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(rb"\bsk_[A-Za-z0-9]{32,}\b"),
    re.compile(rb"\bAIza[A-Za-z0-9_-]{30,}\b"),
    re.compile(rb"\bAKIA[A-Z0-9]{16}\b"),
    re.compile(rb"postgres(?:ql)?://[^:\s/]+:[^@\s]+@"),
]
files = [ROOT / name for name in top_files]
for name in roots:
    files.extend((ROOT / name).rglob("*"))
selected = []
for path in sorted(set(files)):
    rel = path.relative_to(ROOT)
    if path.is_symlink() or not path.is_file():
        continue
    if any(part in blocked_dirs for part in rel.parts):
        continue
    if (path.name in blocked_names or path.name.startswith(".env")
            or path.name.endswith(".tsbuildinfo") or path.suffix in {".log", ".map"}):
        continue
    if path.suffix not in allowed and str(rel) not in top_files:
        continue
    data = path.read_bytes()
    if any(pattern.search(data) for pattern in patterns):
        raise SystemExit(f"Archive blocked: credential-like content in {rel}; inspect privately.")
    selected.append((str(rel), data))

readme = f"""# ZCC Depot — source review package

Snapshot date (UTC): {stamp}

## Confidentiality
This package includes internal product, competitive and Presenter-only guidance.
Upload only to an organization-approved AI workspace. Runtime API credentials,
environment files, database records, saved customer agendas/research, sessions,
original user uploads, Git history and agent memory are excluded.
An automated credential-pattern screen was applied; this is not a formal security audit.

## Scope
Current development source, not a capture of the published production version.
Frontend: artifacts/zcc-depot. Backend: artifacts/api-server.
Shared contracts, generated clients, schema source: lib.
Source images/fonts: artifacts/zcc-depot/public.
The unrelated design sandbox and dependency/build folders are excluded.
Externally hosted assets and stored customer files are not bundled.
This is a source-review package, not a one-click offline backup.

## Latest changes
The Capabilities explorer contains 33 capabilities, retaining 14 original topics.
The site map now lists all 33 as searchable, direct-linked sections.
Feature links follow /?feature=<stable-id>#features.
Site-map totals: 28 pages, 208 sections across six navigation areas.
Latest checks: 474 site-map route/search/access-label/UI assertions and project
TypeScript checks passed. Phone preview checked at 390 x 844.
Earlier feature-work checks and limitations are described below; no new full-site
browser or accuracy audit was performed for this export.

## Start review here
1. artifacts/zcc-depot/src/data/navigation.ts — shared navigation.
2. artifacts/zcc-depot/src/App.tsx — routes.
3. artifacts/zcc-depot/src/data/site-map.ts and search.ts — discovery.
4. artifacts/zcc-depot/src/data/feature-registry.ts — all capabilities and sources.
5. artifacts/zcc-depot/src/components/features — exploration and simulated playback.
6. artifacts/api-server/src/routes/presenter.ts and lib/feature-presenter.ts —
   protected guidance and access boundaries.
7. docs — existing implementation and technical-claim notes.

## Suggested ChatGPT request
Review this source package for final sanity and consistency. Do not assume the
published site matches this snapshot. Trace routes, navigation, site-map entries,
search, section anchors and feature deep links. Compare wording, feature names,
classification, source attribution and availability qualifications across pages.
Review responsive layout, accessibility, playback state transitions, source-only
versus signed-in material, PDF export controls and formatting.
Distinguish native Zendesk Contact Center, separately licensed Zendesk add-ons,
optional Amazon Connect/AWS services, third-party integrations and custom work.
Flag stale/unsupported claims without inventing verification. Simulations must
not imply real customer deployments, live integrations or entitlement.
Return prioritized findings with exact file references and suggested fixes.
Separate confirmed defects, risks needing runtime verification and cosmetic ideas.

## Verification limits
The previous feature upgrade passed desktop/phone public browser checks, builds,
type checks and automated component/HTTP authorization checks. Actual signed-in
Presenter browser verification was blocked by the test-login service; it remains
unverified end-to-end. Normal login configuration was restored.
Documentation review dates are not human approval or deployment validation.
No production publication was performed for this site-map update.

## Running checks in an appropriately configured environment
Use pnpm; dependency versions are in pnpm-lock.yaml.
- pnpm install --frozen-lockfile
- pnpm run typecheck
- node artifacts/zcc-depot/scripts/check-site-map.mjs
- node artifacts/zcc-depot/scripts/check-home-features.mjs
Full runtime requires separately provisioned authentication, database, storage and
provider configuration. Never paste credentials into ChatGPT or this package.
"""
manifest = [{"path": name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
            for name, data in selected]
with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    archive.writestr("ZCC-Depot/START-HERE.md", readme)
    archive.writestr("ZCC-Depot/FILE-MANIFEST.json", json.dumps(manifest, indent=2))
    for name, data in selected:
        archive.writestr("ZCC-Depot/" + name, data)
    screenshot = OUT / "site-map-phone.jpg"
    if screenshot.exists():
        archive.write(screenshot, "ZCC-Depot/review-evidence/site-map-phone.jpg")
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
    assert any("src/data/site-map.ts" in name for name in archive.namelist())
print(json.dumps({"file": str(target.relative_to(ROOT)), "source_files": len(selected),
                  "bytes": target.stat().st_size, "integrity": "passed"}))
