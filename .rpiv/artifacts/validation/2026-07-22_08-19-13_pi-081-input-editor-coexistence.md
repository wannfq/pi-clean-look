---
template_version: 1
date: 2026-07-22T08:19:13+0800
author: Wan Afiq
commit: 9752d56
branch: main
repository: pi-cozy-ui
topic: "Validation of Pi 0.81 input-editor coexistence"
status: ready
verdict: pass
parent: ".rpiv/artifacts/plans/2026-07-22_07-42-13_pi-081-input-editor-coexistence.md"
tags: [validation, plan, documentation, pi-081, input-editor, extension-order]
last_updated: 2026-07-22T08:19:13+0800
---

## Validation Report: Pi 0.81 Input-Editor Coexistence

### Implementation Status

- ✓ Phase 1: Correct package-order guidance — Fully implemented. `README.md:36-37` exactly matches the revised plan wording.

### Automated Verification Results

- ✓ Type check: `pnpm check` — exited 0.
- ✓ Unit tests: `pnpm test` — 3 test files and 33 tests passed.
- ✓ Documentation assertion: `grep -F "after packages that customize Pi's input or startup screen" README.md` — matched the revised guidance.
- ✓ No regressions detected by the phase’s automated checks.

### Code Review Findings

#### Matches Plan

- `README.md:32-40` — preserves the concise three-item Recommended settings list.
- `README.md:36-37` — directs users to place pi-cozy-ui after packages that customize Pi’s input or startup screen, while retaining absolute-last as a non-required default.
- `extensions/input-field.ts:163-175` and `extensions/input-field.ts:254-257` — the existing `session_start` editor registration remains unchanged and is correctly covered by the input-order guidance.
- `extensions/startup-screen.ts:57-62` — the existing TUI-only header registration remains unchanged and is correctly covered by the startup-screen-order guidance.

#### Deviations from Plan

None. Implementation is a faithful realization of the revised plan.

#### Pattern Conformance

- ✓ `README.md:32-40` retains the existing heading, lead-in, numbered-list structure, indentation, and unchanged theme/startup items.

### Manual Testing Required

1. Pi 0.81.x coexistence:
   - [ ] In `pi config`, place rpiv-pi and any packages that customize Pi’s input or startup screen before pi-cozy-ui; leave an unrelated package after pi-cozy-ui if available.
   - [ ] Start Pi 0.81.x and confirm the cozy `┃` input bar, embedded status row, and startup header appear instead of competing input or startup UI.

### Recommendations

- Ready to commit — the revised implementation is complete and automated validation passed.
- Perform the documented manual Pi 0.81.x coexistence check before release.
- This report supersedes the earlier validation artifact, whose grep assertion covered the prior bottom-of-list wording.
- The working tree contains pre-existing unrelated changes in `package.json`, `pnpm-lock.yaml`, and other README content; no baseline file was provided, so they were not treated as part of this phase’s implementation.
