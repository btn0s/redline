# @btn0s/redline

Markdown review in the browser. Open any `.md` file, select text, leave anchored comment threads, and save everything back to disk.

```bash
npx @btn0s/redline ./path/to/file.md
```

Redline starts a local server on port `4700` and opens the review UI in your browser.

## Install

```bash
npm i -g @btn0s/redline
```

Or run it directly with `npx` / `pnpm dlx` — no install required.

## Usage

```bash
redline <file.md>
```

- Select any passage of text to start a comment thread
- Comments are anchored to the exact text selection
- All comments persist to disk alongside the markdown

## Agent skill

Redline ships an agent skill so AI assistants (Cursor, Claude Code, Codex, etc.) can launch the review UI on your behalf when a plan or spec needs human feedback.

```bash
npx skills add btn0s/redline --skill redline
```

## Development

```bash
pnpm install
pnpm dev
```

## License

MIT
