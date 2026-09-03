---
name: Portable npm lockfiles
description: Keep npm lockfiles portable when package installation runs through Replit's security proxy.
---

Generate npm lockfiles from scratch against the public npm registry when repository portability is required; updating an existing lockfile can preserve internal proxy URLs.

**Why:** Replit's package security proxy can become embedded in resolved tarball URLs, and npm may retain those URLs even when a later command specifies the public registry.

**How to apply:** After dependency changes, verify every resolved URL host. If internal hosts remain, perform a fresh metadata-only lock generation against the public registry, then use the normal secured installation path.