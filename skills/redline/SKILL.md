---
name: redline
description: Use when a markdown plan, spec, or doc should be opened in the Redline review UI for the user. The agent launches the CLI; do not only paste instructions for the user to run manually.
---

# Redline — launch the review UI

## What you must do

When you want the **user** to review a **`.md`** file (plan, spec, README, etc.) in the Redline experience, **you run the CLI yourself** in a terminal. That starts the local server and (on macOS) opens the browser.

```bash
npx @btn0s/redline <filepath>
```

- **`<filepath>`** — use a path that resolves from the shell’s cwd (prefer **absolute** or clear **repo-relative** after `cd` to the project root).
- **Long-running:** the process blocks until stopped. Run it **in the background** so you can keep helping the user (same idea as a dev server).

If the project uses pnpm:

```bash
pnpm dlx @btn0s/redline <filepath>
```

## After you start it

- Tell the user the review session is up and they can use the editor in the browser (select text, add comment threads, etc.). If the browser did not open, point them to `http://localhost:4700`.
- **Port:** Redline serves on **4700** by default. If something else is bound there, fix the conflict or ask the user before changing tooling.

## When to use this skill

- Right after you write or materially update a doc you want **reviewed or redlined**, not only read in chat.
- When passage-level feedback matters more than a single block of chat text.

## What you should not do

- **Do not** only give the user a command to copy-paste if you can run it—**running the CLI is your job** when this skill applies.
- Do not document internal APIs or storage; opening the app is enough.
