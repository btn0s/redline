import { execSync } from "child_process"

execSync(
  'npx esbuild cli/index.ts --bundle --platform=node --format=esm --outfile=dist/cli/index.js --banner:js="#!/usr/bin/env node"',
  { stdio: "inherit" },
)
