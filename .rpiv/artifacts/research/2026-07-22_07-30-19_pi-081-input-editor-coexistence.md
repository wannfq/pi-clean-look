---
date: 2026-07-22T07:30:19+0800
author: Wan Afiq
commit: 9752d56
branch: main
repository: pi-cozy-ui
topic: "Pi 0.81 input-editor coexistence"
tags: [research, codebase, pi-081, input-editor, extension-order]
status: ready
last_updated: 2026-07-22T07:30:19+0800
last_updated_by: Wan Afiq
---

# Research: Pi 0.81 Input-Editor Coexistence

## Research Question

Update the user-facing package-order guidance so pi-cozy-ui loads after competing editor customizations and therefore remains the final `setEditorComponent()` registration. Validate that configuration in a real Pi 0.81.x + rpiv-pi session, without adding a competing runtime reclaim mechanism.

## Summary

Pi emits extension event handlers in extension-array order, while `setEditorComponent()` stores a single factory by direct assignment. Therefore, the final `session_start` registration owns the editor. The README’s instruction to place pi-cozy-ui at the top of the package list is inverted for a competing editor extension; pi-cozy-ui must be last among enabled packages that customize the editor.

The repair is documentation-only. Automated commands cover TypeScript and pure layout helpers; a real Pi launch with both packages enabled through `pi config` is the only verification of cross-package editor ownership.

## Detailed Findings

### Extension order and editor ownership

- Pi merges CLI extension paths before enabled package paths and preserves first-seen order while deduplicating (`node_modules/@earendil-works/pi-coding-agent/dist/core/resource-loader.js:267-270`, `node_modules/@earendil-works/pi-coding-agent/dist/core/resource-loader.js:594-605`). The developer confirmed both affected packages are enabled through `pi config`, so package ordering is the relevant surface.
- Pi emits each extension’s handlers in sequence from its ordered extension array (`node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/runner.js:539-568`).
- The UI context delegates `setEditorComponent()` to `setCustomEditorComponent()` (`node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:1676-1677`). That method assigns `editorComponentFactory` directly, clears the editor container, and creates the replacement editor (`node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:1822-1829`). It does not compose the prior factory.
- pi-cozy-ui registers its factory from its `session_start` handler (`extensions/input-field.ts:163-175`, `extensions/input-field.ts:254-257`). A later extension that calls the same setter replaces it.
- The README currently recommends moving pi-cozy-ui to the top of the package list (`README.md:32-40`). That placement lets a later editor customization override `MinimalEditor`; the correct guidance is to put pi-cozy-ui at the bottom, after packages that customize the editor.

### Existing editor behavior to preserve

- `MinimalEditor.render()` derives from `CustomEditor`, calls `super.render(width)`, and builds the colored left bar, model/thinking/context/cost status, and cwd/Git footer before invoking the pure layout composer (`extensions/input-field.ts:177-250`).
- `composeEditorLayout()` removes the first editor row, replaces the last detected border with a blank bar and status row, preserves post-border autocomplete lines, truncates content with ANSI-aware width handling, and appends the footer row (`lib/editor-layout.ts:38-72`).
- Shared helpers implement full-width footer layout, status-line fitting, and ANSI-aware border detection (`lib/text-layout.ts:4-29`, `lib/text-layout.ts:41-64`, `lib/text-layout.ts:74-85`). No change is required to this rendering path for package-order guidance.

### Session state and lifecycle

- The input-field extension maintains per-session metrics and Git state: `turn_end` feeds accumulated cost, while `session_start` stops the prior Git tracker, creates fresh state, suppresses the built-in footer, and installs the editor (`extensions/input-field.ts:157-175`).
- The editor factory captures `tui.requestRender()` for Git-status refreshes (`extensions/input-field.ts:254-257`). These state and refresh paths do not participate in the editor-factory precedence decision.
- Pi can restore the default editor by calling `setCustomEditorComponent(undefined)` during extension UI reset (`node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:1490-1510`). On a rebind, extension registration order remains the determinant of the final factory.

### Verification boundary

- The manifest declares `input-field.ts` and `startup-screen.ts` as package extensions (`package.json:31-39`). Its development scripts pass `--no-extensions` and explicit `-e` files, so they intentionally bypass installed-package coexistence (`package.json:41-47`).
- `pnpm check` type-checks the extension and helper files, and `pnpm test` runs Vitest (`package.json:41-47`). Layout tests cover top-border removal, bottom-border replacement, autocomplete pass-through, fallback, and truncation (`lib/editor-layout.test.ts:14-62`); text-layout tests cover sizing and ANSI-related helpers (`lib/text-layout.test.ts:13-147`).
- Neither command starts Pi with rpiv-pi. Manual validation must use both enabled packages in `pi config`, with rpiv-pi before pi-cozy-ui, then confirm the `┃` prefix and embedded status row rather than the default top-and-bottom bordered editor (`extensions/input-field.ts:191-193`, `extensions/input-field.ts:243-250`). The developer requested explicit instructions for this manual check.

## Code References

- `README.md:32-40` — Recommended-settings package-order guidance to correct.
- `package.json:31-47` — Pi package manifest plus isolated development, check, and test scripts.
- `extensions/input-field.ts:157-175` — Event registration, session setup, and built-in-footer suppression.
- `extensions/input-field.ts:177-257` — `MinimalEditor` rendering and factory registration.
- `lib/editor-layout.ts:38-72` — Pure transformation from default editor rows to the minimal layout.
- `lib/text-layout.ts:4-29` — ANSI-aware full-width footer row construction.
- `lib/text-layout.ts:41-85` — Status-line sizing and border-line detection.
- `lib/editor-layout.test.ts:14-62` — Pure editor-layout behavior coverage.
- `lib/text-layout.test.ts:13-147` — Text-layout helper coverage.
- `node_modules/@earendil-works/pi-coding-agent/dist/core/resource-loader.js:267-270` — CLI and enabled-package extension-path merge.
- `node_modules/@earendil-works/pi-coding-agent/dist/core/resource-loader.js:594-605` — Stable first-occurrence path deduplication.
- `node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/runner.js:539-568` — Ordered extension event dispatch.
- `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:1676-1677` — UI-context editor setter wiring.
- `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:1822-1872` — Replacement editor factory lifecycle.

## Integration Points

### Inbound References

- `package.json:31-39` — Pi discovers the package’s two extension modules through the `pi.extensions` manifest.
- `node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/runner.js:539-568` — Pi invokes each registered `session_start` listener in extension-array order.

### Outbound Dependencies

- `extensions/input-field.ts:1-11` — The editor extension depends on Pi’s coding-agent API, Pi TUI types, and pure local layout/Git helpers.
- `extensions/input-field.ts:243-250` — The rendering subclass delegates visual composition to `composeEditorLayout`, `statusLine`, and `buildFullWidthRow`.

### Infrastructure Wiring

- `node_modules/@earendil-works/pi-coding-agent/dist/core/resource-loader.js:267-270` — Enabled packages feed the extension path list after CLI extensions.
- `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:1822-1829` — A UI editor factory assignment creates the active editor and displaces the previous one.
- `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:1490-1510` — Extension UI reset clears editor ownership before extensions are rebound.

## Architecture Insights

- UI component setters are replacement seams, not compositional extension points. Editor precedence is controlled by lifecycle order rather than by an explicit priority API.
- The custom editor is deliberately thin: it preserves Pi’s editing behavior through `super.render(width)` and applies a pure row transformation afterward.
- The repository separates deterministic layout behavior into testable `lib/` modules; package loading and UI ownership remain runtime integration concerns.
- The existing development scripts are intentionally standalone and cannot act as a substitute for a multi-package Pi validation.

## Precedents & Lessons

1 similar documentation change analyzed.

### Precedent: Package-order guidance added with editor-layout rename

**Commit(s)**: `4e20ea9` — "feat: rename editor layout and cozy themes" (2026-07-19)
**Blast radius**: 8 files across documentation, extension, layout, tests, manifest, and themes.

**Follow-up fixes**:

- None identified; the incorrect top-of-list guidance remains in the current README.

**Takeaway**: The known regression was introduced in documentation, so correcting the guidance without modifying the runtime editor lifecycle matches the established scope.

### Composite Lessons

- The final `setEditorComponent()` call wins; documentation must describe pi-cozy-ui as last among competing editor packages.
- Keep rpiv-pi warning remediation out of this repository and out of the coexistence change.
- Retain manual validation because the repository has no multi-package integration harness.

## Historical Context (from `.rpiv/artifacts/`)

- `.rpiv/artifacts/discover/2026-07-22_07-01-24_pi-081-input-editor-coexistence.md` — feature requirements document for this coexistence repair.

## Developer Context

**Q (discover: Retain cozy editor ownership): From the probe I inferred that this package must retain ownership of the input editor when rpiv-pi is loaded, because `setEditorComponent()` is a last-setter-wins UI surface (`extensions/input-field.ts:254`). Keep that as the compatibility goal, or allow another package’s editor to win?**
A: Keep cozy editor.

**Q (discover: Correct install guidance): From the probe I inferred that the README’s advice to move pi-cozy-ui to the top of the package list conflicts with last-setter-wins behavior (`README.md:22-23`, `extensions/input-field.ts:254`). Should compatibility work include correcting this guidance?**
A: Correct guidance.

**Q (discover: Limit scope to coexistence): Should this work target the rpiv-pi coexistence regression only, or also proactively update every Pi 0.81-sensitive API used by the input editor?**
A: Target coexistence.

**Q (discover: Use documented load order): For editor ownership, should the package rely on documented load order or add a runtime mechanism that reclaims the editor after competing extensions? The tradeoff is predictability versus automatic coexistence.**
A: Document load order.

**Q (discover: Require checks and manual validation): What evidence should be required before calling the coexistence fix complete?**
A: Checks plus manual.

**Q (discover: Exclude rpiv-pi warnings): The rpiv-pi `models.json` unknown-stage warnings are separate from editor ownership and originate outside this package. Should they be explicitly out of scope for this fix?**
A: Out of scope.

**Q (`node_modules/@earendil-works/pi-coding-agent/dist/core/resource-loader.js:267-270`): Are both packages enabled through `pi config`, or is either loaded through a CLI mechanism?**
A: Both are packages.

**Q (`node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js:1822-1828`): Should corrected guidance name rpiv-pi or state the general rule?**
A: State the general rule.

**Q (`package.json:41-42`, `extensions/input-field.ts:191-193`): Can you manually validate with both enabled packages, and what validation support is needed?**
A: Need instructions.

## Related Research

- None.

## Open Questions

None.
