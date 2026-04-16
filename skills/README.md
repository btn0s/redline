# Agent skills in this repo

The **`redline`** skill lives in [`redline/SKILL.md`](redline/SKILL.md). It tells coding agents to **run** `npx @btn0s/redline <filepath>` so the user gets the browser review UI.

## Install (Skills CLI)

Requires [Node.js](https://nodejs.org/) and a public Git clone URL:

```bash
npx skills add btn0s/redline --skill redline
```

From a local checkout:

```bash
npx skills add . --skill redline
```

List skills in this repo without installing:

```bash
npx skills add . --list
```

## skills.sh “publishing”

[skills.sh](https://skills.sh) is the public directory / leaderboard for the same ecosystem. Per [skills.sh documentation](https://skills.sh/docs), **ranking uses anonymous telemetry** from the open-source [`npx skills`](https://github.com/vercel-labs/skills) CLI when people install skills—there is **no separate upload or approval queue** documented for listing a new repo.

**Practical checklist:**

1. **Push** this repository to **public** GitHub (e.g. `github.com/btn0s/redline`).
2. **Confirm discovery:** `npx skills add btn0s/redline --list` shows `redline`.
3. **Usage:** installs contribute to leaderboard visibility; share the install command in README or docs so others can add the skill.
4. **Search:** `npx skills find redline` may lag until the registry indexes your repo.

For evolving official guidance on manual listing vs. indexing only, see [vercel-labs/skills#880](https://github.com/vercel-labs/skills/issues/880).
