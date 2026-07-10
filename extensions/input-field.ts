import {
  CustomEditor,
  type ExtensionAPI,
  type KeybindingsManager,
} from "@earendil-works/pi-coding-agent";
import type { Component, EditorTheme, TUI } from "@earendil-works/pi-tui";
import { composeChrome } from "../lib/chrome-layout.js";
import {
  buildFullWidthRow,
  formatCost,
  formatCwd,
  statusLine,
} from "../lib/text-layout.js";

/**
 * input-field.ts — a minimal look for pi's input/prompt box.
 *
 * Layout (inspired by opencode's TUI prompt, packages/tui/src/component/prompt):
 *   - A single LEFT vertical bar `┃` down the left side (no top/right/bottom
 *     enclosing border), tinted to the thinking level (pi's indicator).
 *   - Input text inset by 2 spaces.
 *   - A status row below the input INSIDE the bar: `provider/model:thinking`
 *     (left) and `${ctx %}/${ctxK} $cost` (right), all muted. Cost is
 *     cumulative for the session, tracked via `turn_end` events.
 *   - Bottom row OUTSIDE the box: cwd (left, 1-space pad) and branch name
 *     (right) — auto-detects git or jujutsu, cached and refreshed every 10s.
 *
 * Implementation notes:
 *   - We must NOT string-slice pi's editor output: lines contain the
 *     CURSOR_MARKER (`\x1b_pi:c\x07`) inside text and ANSI styling everywhere.
 *     Slicing by byte offset corrupts the marker → width overflow + dead input.
 *   - Instead we prefix content lines with `┃  ` (3 visible cols) and reclaim
 *     that room using the ANSI-aware `truncateToWidth(line, width - 3)` which
 *     drops trailing padding spaces and never touches the cursor marker.
 *   - `setEditorComponent`'s { paddingX } option is not reliably honored, so
 *     we treat pi's lines as if they fill the full `width` (no side padding).
 *   - Autocomplete dropdown lines are passed through untouched (no bar).
 *
 * After editing, run `/reload` inside pi to apply changes live.
 */

/** A footer that renders nothing — hides pi's default status footer. */
const emptyFooter: Component = {
  render: () => [],
  invalidate: () => {},
};

const BRANCH_FETCH_INTERVAL = 10_000; // 10s

/** Per-session cost accumulator fed by `turn_end` events. */
export interface SessionMetrics {
  onTurnEnd(event: unknown): void;
  /** Formatted cumulative cost for display (e.g. "$0.12"). */
  readonly costStr: string;
}

/** Create a session-scoped cost accumulator. */
function createMetrics(): SessionMetrics {
  let cost = 0;
  return {
    onTurnEnd(event: unknown) {
      const msg = event as {
        message?: { usage?: { cost?: { total: number } } };
      };
      const total = msg.message?.usage?.cost?.total;
      if (total != null) cost += total;
    },
    get costStr() {
      return formatCost(cost);
    },
  };
}

/** Async VCS branch tracker: auto-detects git or jj, cached and refreshed every 10s. */
export interface VcsTracker {
  /** Current cached branch name, or null if not yet fetched / unavailable. */
  readonly branch: string | null;
  /** Stop the refresh interval. */
  stop(): void;
}

/** Create and auto-start a VCS branch tracker for the given cwd. */
function createVcsTracker(
  exec: ExtensionAPI["exec"],
  cwd: string,
): VcsTracker {
  let cachedBranch: string | null = null;
  let inFlight = false;
  const intervalId = setInterval(() => void refresh(), BRANCH_FETCH_INTERVAL);

  async function refresh(): Promise<void> {
    if (inFlight) return;
    inFlight = true;
    try {
      const gitResult = await exec("git", ["branch", "--show-current"], {
        cwd,
        timeout: 3000,
      });
      if (gitResult.code === 0) {
        cachedBranch = gitResult.stdout.trim() || null;
        return;
      }
      const jjResult = await exec(
        "jj",
        ["log", "-r", "@", "-T", "bookmarks", "--no-graph"],
        { cwd, timeout: 3000 },
      );
      if (jjResult.code === 0) {
        cachedBranch = jjResult.stdout.trim() || null;
        return;
      }
      cachedBranch = null;
    } catch {
      cachedBranch = null;
    } finally {
      inFlight = false;
    }
  }

  // Kick off the first fetch immediately.
  void refresh();

  return {
    get branch() {
      return cachedBranch;
    },
    stop() {
      clearInterval(intervalId);
    },
  };
}

/** Active session state — created on each `session_start`, torn down on the next. */
interface SessionState {
  metrics: SessionMetrics;
  vcs: VcsTracker;
}

let session: SessionState | null = null;

export default function (pi: ExtensionAPI) {
  // Track cumulative session cost on each turn_end.
  pi.on("turn_end", (event) => {
    session?.metrics.onTurnEnd(event);
  });

  pi.on("session_start", (_event, ctx) => {
    // Tear down the previous session's VCS tracker.
    session?.vcs.stop();

    // Create fresh per-session state.
    const metrics = createMetrics();
    const vcs = createVcsTracker(pi.exec, ctx.cwd);
    session = { metrics, vcs };

    // Hide pi's default footer — its cwd / context-window / model row is now
    // redundant with the status line drawn inside our minimal input box.
    ctx.ui.setFooter(() => emptyFooter);

    class MinimalEditor extends CustomEditor {
      constructor(
        tui: TUI,
        theme: EditorTheme,
        keybindings: KeybindingsManager,
      ) {
        super(tui, theme, keybindings, { paddingX: 0 });
      }

      render(width: number): string[] {
        const lines = super.render(width);
        if (lines.length === 0) return lines;

        const thm = ctx.ui.theme;
        const bar = (text: string) => this.borderColor(text);
        const prefix = bar("┃") + " ";
        const blankBar = bar("┃") + " ".repeat(Math.max(0, width - 1));

        const model = ctx.model
          ? `${ctx.model.provider}/${ctx.model.id}`
          : "no model";
        const usage = ctx.getContextUsage();
        const ctxPct =
          usage?.percent != null ? `${Math.round(usage.percent)}%` : "?";
        const contextWindow =
          usage?.contextWindow ?? ctx.model?.contextWindow;
        const ctxK = contextWindow
          ? `${(contextWindow / 1000).toFixed(0)}k`
          : "?";

        const statusLeft = thm.fg(
          "muted",
          `${model}:${pi.getThinkingLevel()} `,
        );
        const statusRight = thm.fg(
          "muted",
          `${ctxPct}/${ctxK} ${metrics.costStr} `,
        );

        const cwdStr = thm.fg("text", formatCwd(ctx.cwd));
        const branchStr = vcs.branch ? thm.fg("text", vcs.branch) : null;

        return composeChrome({
          editorLines: lines,
          width,
          prefix,
          blankBar,
          top: blankBar,
          status: statusLine(prefix, statusLeft, statusRight, width),
          branchRow: branchStr
            ? buildFullWidthRow(cwdStr, branchStr, width)
            : " " + cwdStr,
        });
      }
    }

    ctx.ui.setEditorComponent(
      (tui, theme, keybindings) => new MinimalEditor(tui, theme, keybindings),
    );
  });
}


