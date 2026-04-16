# @btn0s/redline

Local **markdown review** in the browser: open a `.md` file, leave anchored comment threads, save back to disk.

```bash
npx @btn0s/redline ./path/to/file.md
```

## Agent skill (Cursor, Claude Code, Codex, …)

This repo includes an installable **Agent Skill** so assistants know to launch Redline when you want a human to review a plan or doc:

```bash
npx skills add btn0s/redline --skill redline
```

How this relates to [**skills.sh**](https://skills.sh) (directory / leaderboard) is documented in skills/README.md.

---

## App stack

This is a Vite project with React, TypeScript, and shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `src/components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button"
```