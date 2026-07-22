---
date: 2026-07-22T07:42:13+0800
author: Wan Afiq
commit: 9752d56
branch: main
repository: pi-cozy-ui
topic: "Pi 0.81 input-editor coexistence"
tags: [plan, documentation, pi-081, input-editor, extension-order]
status: ready
parent: .rpiv/artifacts/research/2026-07-22_07-30-19_pi-081-input-editor-coexistence.md
phase_count: 1
phases:
  - { n: 1, title: Correct package-order guidance }
unresolved_phase_count: 1
last_updated: 2026-07-22T08:13:11+0800
last_updated_by: Wan Afiq
last_updated_note: "Clarified package order for competing input and startup UI"
---

# Pi 0.81 Input-Editor Coexistence Implementation Plan

## Overview

Correct the README’s package-order guidance so pi-cozy-ui loads after packages that customize its input or startup UI, without requiring it to be absolutely last. This documentation-only repair relies on Pi’s existing last-setter-wins behavior and introduces no runtime or test changes.

## Requirements

- State that pi-cozy-ui belongs after packages that customize Pi’s input or startup screen; placing it last remains a good default, not a requirement.
- Preserve the README’s existing concise Recommended settings format.
- Do not modify runtime extension code, test files, package scripts, or rpiv-pi configuration.
- Verify repository checks and manually verify a real Pi 0.81.x session with rpiv-pi enabled before pi-cozy-ui.

## Current State Analysis

### Key Discoveries

- `README.md:36-37` currently requires pi-cozy-ui to be at the bottom of the package list, which over-constrains it behind unrelated packages.
- `extensions/input-field.ts:163-175` registers UI state during `session_start`; `extensions/input-field.ts:254-257` registers the custom editor.
- Pi dispatches extension event handlers in array order (`node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/runner.js:539-568`) and replaces the active editor factory on each setter call (`node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:1822-1829`).
- `package.json:41-47` defines `pnpm check`, `pnpm test`, and standalone development commands that cannot test installed-package ordering.

## Desired End State

Users see the corrected guidance in the README:

```markdown
1. Move `pi-cozy-ui` after packages that customize Pi's input or startup screen
   in `pi config`. Placing it last is a good default, but isn't required.
```

With rpiv-pi and any other input or startup-screen customizations placed earlier, a Pi 0.81.x session renders the cozy input editor’s `┃` left bar and embedded status row plus the cozy startup header rather than competing input or startup UI.

## What We're NOT Doing

- Changing `extensions/input-field.ts` or Pi editor-registration lifecycle behavior.
- Adding retries, a runtime reclaim mechanism, or a multi-package integration test harness.
- Adding a manual-validation checklist to the README.
- Requiring pi-cozy-ui to be absolutely last behind unrelated packages.
- Fixing rpiv-pi `models.json` unknown-stage warnings.
- Updating unrelated Pi 0.81 API usage.

## Decisions

### Documentation-only repair

The change modifies only `README.md`. Pi already dispatches handlers in order and replaces the custom editor factory directly (`node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/runner.js:539-568`, `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:1822-1829`); runtime changes would exceed the confirmed scope.

### Relevant-UI ordering rule

Replace the over-broad bottom-of-list instruction at `README.md:36-37` with guidance to load pi-cozy-ui after packages that customize Pi’s input or startup screen. The wording applies generally rather than naming rpiv-pi; placing pi-cozy-ui last is a good default, but unrelated packages need not delay its UI.

### Manual verification outside README

Keep README scope to the corrected order sentence. The developer chose not to add a checklist; manual validation remains a phase success criterion because `package.json:41-47` runs standalone development commands only.

## Phase 1: Correct Package-Order Guidance

### Overview

Update the existing Recommended settings instruction. Depends on no prior phase; this is the sole documentation slice.

### Changes Required

#### 1. README.md:36-37

**File**: `README.md`
**Changes**: MODIFY — recommend loading after input or startup-screen customizations without requiring absolute-last position.

```markdown
1. Move `pi-cozy-ui` after packages that customize Pi's input or startup screen
   in `pi config`. Placing it last is a good default, but isn't required.
```

### Success Criteria

#### Automated Verification

- [x] `pnpm check` exits with status 0.
- [x] `pnpm test` exits with status 0.
- [x] `grep -F "after packages that customize Pi's input or startup screen" README.md` finds the corrected guidance.

#### Manual Verification

- [ ] In `pi config`, place rpiv-pi and any package that customizes Pi’s input or startup screen before pi-cozy-ui; unrelated packages may appear after it.
- [ ] Start Pi 0.81.x and confirm the prompt shows the cozy `┃` left bar, embedded status row, and cozy startup header rather than competing input or startup UI.

## Ordering Constraints

- Phase 1 is independent and is the only phase.
- Run automated checks after the README update; run the real Pi coexistence check against installed packages rather than `pnpm dev`.

## Verification Notes

- Run `pnpm check` to retain the repository’s TypeScript baseline.
- Run `pnpm test` to retain pure-layout regression coverage.
- In `pi config`, place rpiv-pi and packages that customize the input or startup screen before pi-cozy-ui; unrelated packages may appear after it. Start Pi 0.81.x and confirm the input has the `┃` left bar and embedded status row from `extensions/input-field.ts:191-193` and `extensions/input-field.ts:243-250`, plus the startup header from `extensions/startup-screen.ts:57-62`.
- Confirm the README says pi-cozy-ui follows relevant UI customizations without requiring an absolute-last package position and contains no new runtime claims.

## Performance Considerations

No runtime code or load path changes. The guidance avoids placing pi-cozy-ui after unrelated packages, preventing unnecessary UI-registration delay.

## Migration Notes

Not applicable. Existing users must move pi-cozy-ui after packages that customize Pi’s input or startup screen; placing it last remains a safe default.

## Pattern References

- `README.md:32-40` — concise numbered Recommended settings list to preserve.
- `extensions/input-field.ts:254-257` — editor registration whose final call must prevail over competing input customizations.
- `extensions/startup-screen.ts:57-62` — header registration whose final call must prevail over competing startup-screen customizations.
- `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:1822-1829` — direct editor-factory replacement semantics supporting input-order guidance.

## Developer Context

- Inherited: retain the cozy editor; correct install guidance; target coexistence only; rely on documented load order; require checks plus manual validation; exclude rpiv-pi warnings.
- Inherited: both packages are enabled through `pi config`; use a general rule rather than naming rpiv-pi.
- **Q (`README.md:32-40`, `package.json:41-47`): Should the README add a concise manual coexistence-validation checklist, or only correct the package-order sentence?**
  - A: Order sentence only.
- **Q (decomposition): Should the documentation-only change remain one vertical slice?**
  - A: Approved one slice.
- **Q (revision, 2026-07-22T08:13:11+0800): Should pi-cozy-ui be required to load absolutely last?**
  - A: No. It must follow packages that customize Pi’s input or splash/startup screen; absolute-last remains a good default only.

## Plan History

- Phase 1: Correct package-order guidance — revised: relevant input/startup UI order replaces absolute-last guidance

## Plan Review (Step 8)

_Independent post-finalization review by artifact-code-reviewer and artifact-coverage-reviewer subagents. Findings triaged at Step 9._

_No findings — both reviewers cleared the artifact before this revision._

## Follow-up 2026-07-22T08:13:11+0800

Clarified package order: pi-cozy-ui must follow packages that customize Pi’s input or splash/startup screen, while absolute-last is only a safe default. Phase 1’s documentation assertion was reopened for implementation.

## References

- `.rpiv/artifacts/research/2026-07-22_07-30-19_pi-081-input-editor-coexistence.md`
- `.rpiv/artifacts/discover/2026-07-22_07-01-24_pi-081-input-editor-coexistence.md`
