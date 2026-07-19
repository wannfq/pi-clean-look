/** Counts of Git working-tree changes from porcelain v1 status output. */
export interface GitStatusCounts {
	staged: number;
	modified: number;
	deleted: number;
	untracked: number;
	renamed: number;
	conflicted: number;
}

const EMPTY_STATUS: GitStatusCounts = {
	staged: 0,
	modified: 0,
	deleted: 0,
	untracked: 0,
	renamed: 0,
	conflicted: 0,
};

const UNMERGED_STATUSES = new Set(["DD", "AU", "UD", "UA", "DU", "AA", "UU"]);

const SPECIAL_STATUS_COUNTS: Record<string, keyof GitStatusCounts | undefined> =
	{
		"??": "untracked",
		"!!": undefined,
	};

function countSpecialStatus(counts: GitStatusCounts, status: string): boolean {
	const countKey = SPECIAL_STATUS_COUNTS[status];
	if (countKey) {
		counts[countKey]++;
		return true;
	}
	if (status === "!!") return true;
	if (!UNMERGED_STATUSES.has(status)) return false;

	counts.conflicted++;
	return true;
}

function countTrackedStatus(counts: GitStatusCounts, status: string): boolean {
	const [indexStatus, worktreeStatus] = status;
	const updates: Array<[boolean, keyof GitStatusCounts]> = [
		[indexStatus !== " ", "staged"],
		[worktreeStatus === "M", "modified"],
		[indexStatus === "D" || worktreeStatus === "D", "deleted"],
		[indexStatus === "R" || worktreeStatus === "R", "renamed"],
	];

	for (const [matches, countKey] of updates) {
		if (matches) counts[countKey]++;
	}

	// In -z porcelain output, rename/copy records include a second NUL-delimited
	// source path. It is not another status entry.
	return indexStatus === "R" || indexStatus === "C";
}

/** Parse `git status --porcelain=v1 -z` into displayable change counts. */
export function parseGitStatus(output: string): GitStatusCounts {
	const counts = { ...EMPTY_STATUS };
	const entries = output.split("\0");

	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i];
		if (entry.length < 3 || entry[2] !== " ") continue;

		const status = entry.slice(0, 2);
		if (countSpecialStatus(counts, status)) continue;
		if (countTrackedStatus(counts, status)) i++;
	}

	return counts;
}
