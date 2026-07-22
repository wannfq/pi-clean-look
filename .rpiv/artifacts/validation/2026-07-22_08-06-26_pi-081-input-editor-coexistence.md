---
template_version: 1
date: 2026-07-22T08:06:26+0800
author: Wan Afiq
commit: 9752d56
branch: main
repository: pi-cozy-ui
topic: "Validation of Pi 0.81 input-editor coexistence"
status: ready
verdict: pass
parent: ".rpiv/artifacts/plans/2026-07-22_07-42-13_pi-081-input-editor-coexistence.md"
tags: [validation, plan, documentation, pi-081, input-editor, extension-order]
last_updated: 2026-07-22T08:06:26+0800
---

## Validation Report: Pi 0.81 Input-Editor Coexistence

### Implementation Status

- ✓ Phase 1: Correct package-order guidance — Fully implemented. `README.md:36-37` now places pi-cozy-ui at the bottom of the package list.

### Automated Verification Results

- ✓ Type check: `pnpm check` — exited 0.
- ✓ Unit tests: `pnpm test` — 3 test files and 33 tests passed.
- ✓ Documentation assertion: `grep -F "bottom of Pi's package list" README.md` — matched the corrected Recommended settings entry.
- ✓ No regressions detected by the phase’s automated checks.

### Code Review Findings

#### Matches Plan

- `README.md:32-40` — preserves the existing concise three-item Recommended settings list while changing the package position from top to bottom.
- `README.md:36-37` — uses the confirmed general rule without naming rpiv-pi.
- `extensions/input-field.ts:163-175` and `extensions/input-field.ts:254-257` — remain unchanged; the documentation-only implementation leaves the editor lifecycle intact.
- `node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/runner.js:539-568` and `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:1822-1829` — support the documented ordering: handlers run in order and the final editor factory replaces the previous one.

#### Deviations from Plan

None. Implementation is a faithful realization of the plan.

#### Pattern Conformance

- ✓ `README.md:32-40` retains the existing numbered-list wording, wrapping, and indentation convention; only the required package-order direction changed.

### Manual Testing Required

1. Pi 0.81.x coexistence:
   - [ ] In `pi config`, place rpiv-pi before pi-cozy-ui in the enabled package list.
   - [ ] Start Pi 0.81.x and confirm the prompt shows the cozy `┃` left bar and embedded status row instead of the default top-and-bottom bordered editor.

### Recommendations

- Ready to commit — the implementation is complete and automated validation passed.
- Perform the documented Pi 0.81.x + rpiv-pi manual check before release.
- The working tree contains pre-existing unrelated changes in `package.json`, `pnpm-lock.yaml`, and other README content; no baseline file was provided, so they were not treated as part of this phase’s implementation.
