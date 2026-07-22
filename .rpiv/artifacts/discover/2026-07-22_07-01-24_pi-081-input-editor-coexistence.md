---
date: 2026-07-22T07:01:24+0800
author: Wan Afiq
commit: 9752d56
branch: main
repository: pi-cozy-ui
topic: "Pi 0.81 input-editor coexistence"
tags: [intent, frd, pi-081, input-editor, rpiv-pi]
status: ready
last_updated: 2026-07-22T07:01:24+0800
last_updated_by: Wan Afiq
---

# FRD: Pi 0.81 Input-Editor Coexistence

## Summary

Restore pi-cozy-ui's minimal left-bar input editor when it is loaded with rpiv-pi packages in Pi 0.81.x. The settled scope is a focused coexistence fix: preserve cozy-ui's editor through documented package load order, correct the conflicting installation guidance, and verify the real multi-package setup.

## Problem & Intent

The issue mostly on the input editor. In vaccuum, theres no issue acctually. But if i load this extensions with rpiv's packages. Theres a warning showed, and the input shows up as the typical to and bottom bar.

Success serves both extension users, who should again see the cozy left-bar input editor, and the package maintainer, who needs a reliable, documented Pi 0.81.x coexistence workflow.

## Goals

- Preserve pi-cozy-ui's minimal left-bar input editor when rpiv-pi is also loaded in Pi 0.81.x.
- Give users correct package-order guidance so pi-cozy-ui owns the editor UI surface.
- Verify the focused coexistence fix with repository checks and a manual Pi 0.81.x launch that loads rpiv-pi.

## Non-Goals

- Proactively update every Pi 0.81-sensitive API used by the input editor.
- Add a runtime mechanism that repeatedly reclaims the editor from other extensions.
- Fix rpiv-pi `models.json` unknown-stage warnings.

## Functional Requirements

1. The package SHALL document a load order that causes pi-cozy-ui's `ctx.ui.setEditorComponent()` registration to prevail when rpiv-pi is enabled.
2. The documented configuration SHALL restore the minimal left-bar input editor rather than Pi's default top-and-bottom bordered editor in a Pi 0.81.x session with rpiv-pi loaded.
3. The package SHALL retain its existing standalone input-editor behavior.

## Non-Functional Requirements

- **Performance**: No new polling, retries, or runtime editor-reclaim loop.
- **Security**: No specific constraint; the change must not introduce credentials, network access, or new command execution.
- **UX / Accessibility**: Installation guidance must clearly state the required package position; the restored editor must preserve the existing visual layout.
- **Reliability**: The solution must use Pi's established last-setter-wins UI behavior rather than relying on timing-sensitive re-registration.

## Constraints & Assumptions

- Pi's editor component setter is a last-setter-wins UI surface (`extensions/input-field.ts:254`).
- The current README directs users to move pi-cozy-ui to the top of the package list (`README.md:22-23`), which conflicts with retaining the final editor registration.
- The target environment is Pi 0.81.x with pi-cozy-ui and rpiv-pi enabled.
- The scope is limited to this repository; rpiv-pi configuration warnings are owned separately.

## Acceptance Criteria

- [ ] `pnpm check` exits with status 0.
- [ ] `pnpm test` exits with status 0.
- [ ] In a manual Pi 0.81.x launch with rpiv-pi and pi-cozy-ui enabled in the documented order, the prompt renders the pi-cozy-ui left bar (`┃`) and embedded status row instead of Pi's default top and bottom borders.
- [ ] The README's recommended-settings section explicitly gives the package order required for pi-cozy-ui to take precedence.

## Recommended Approach

Update the user-facing package-order guidance so pi-cozy-ui loads after competing editor customizations and therefore remains the final `setEditorComponent()` registration. Validate that configuration in a real Pi 0.81.x + rpiv-pi session, without adding a competing runtime reclaim mechanism.

## Decisions

### Retain cozy editor ownership

**Question**: From the probe I inferred that this package must retain ownership of the input editor when rpiv-pi is loaded, because `setEditorComponent()` is a last-setter-wins UI surface (`extensions/input-field.ts:254`). Keep that as the compatibility goal, or allow another package’s editor to win?
**Recommended**: Keep cozy editor.
**Chosen**: Keep cozy editor.
**Rationale**: The requested user-visible UI is the cozy left-bar editor; evidence: `extensions/input-field.ts:254` + confirmed.

### Correct install guidance

**Question**: From the probe I inferred that the README’s advice to move pi-cozy-ui to the top of the package list conflicts with last-setter-wins behavior (`README.md:22-23`, `extensions/input-field.ts:254`). Should compatibility work include correcting this guidance?
**Recommended**: Correct guidance.
**Chosen**: Correct guidance.
**Rationale**: Users need configuration that lets the cozy editor's registration prevail; evidence: `README.md:22-23`, `extensions/input-field.ts:254` + confirmed.

### Limit scope to coexistence

**Question**: Should this work target the rpiv-pi coexistence regression only, or also proactively update every Pi 0.81-sensitive API used by the input editor?
**Recommended**: Target coexistence.
**Chosen**: Target coexistence.
**Rationale**: A narrow, verifiable repair directly addresses the reported regression without speculative API changes.

### Use documented load order

**Question**: For editor ownership, should the package rely on documented load order or add a runtime mechanism that reclaims the editor after competing extensions? The tradeoff is predictability versus automatic coexistence.
**Recommended**: Document load order.
**Chosen**: Document load order.
**Rationale**: Pi's established last-setter-wins model provides a small, stable solution and avoids lifecycle conflicts.

### Require checks and manual validation

**Question**: What evidence should be required before calling the coexistence fix complete?
**Recommended**: Checks plus manual.
**Chosen**: Checks plus manual.
**Rationale**: Repository checks guard existing behavior, while a real multi-package Pi launch verifies the reported integration seam.

### Exclude rpiv-pi warnings

**Question**: The rpiv-pi `models.json` unknown-stage warnings are separate from editor ownership and originate outside this package. Should they be explicitly out of scope for this fix?
**Recommended**: Out of scope.
**Chosen**: Out of scope.
**Rationale**: Keeping the work in pi-cozy-ui avoids expanding into rpiv-pi configuration compatibility.

## Open Questions

None.

## Suggested Follow-ups

- Investigate rpiv-pi's `models.json` unknown keys for `stages.pr-triage`, `stages.revise`, and `stages.security-gate`; these startup warnings were observed in the reported Pi session and are outside pi-cozy-ui's editor-registration seam.

## References

- Skill input: Pi 0.81.0 upgrade breakage. This package broke since the Pi 0.81.0 upgrade. Please help me fix it
- `extensions/input-field.ts:163-257`
- `README.md:22-23`
- `package.json:28-37`
