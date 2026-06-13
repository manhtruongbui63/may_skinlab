#!/usr/bin/env node
/**
 * Consumer project — pull design-system source into bks/ds-system-sdk (no npm).
 *
 * Copy this file to your consumer repo:
 *   scripts/pull-ds-sdk.mjs
 *
 * package.json:
 *   "pull:ds": "node scripts/pull-ds-sdk.mjs --force"
 *
 * Run from consumer root:
 *   pnpm run pull:ds
 *   node scripts/pull-ds-sdk.mjs --force
 */

import { execSync } from "node:child_process"
import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"

const DEFAULT_REPO =
  process.env.BKS_DS_REPO ??
  "ssh://git@gitv2.bekisoft.com:2225/pj0805-fe-base/design-system.git"
const DEFAULT_REF = process.env.BKS_DS_REF ?? "v0.1.18"
const DEFAULT_DEST = process.env.BKS_SDK_DEST ?? "bks/ds-system-sdk"

function parseArgs(argv) {
  let ref = DEFAULT_REF
  let repo = DEFAULT_REPO
  let dest = resolve(process.cwd(), DEFAULT_DEST)
  let force = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--force" || arg === "-f") {
      force = true
      continue
    }
    if (arg === "--ref") {
      ref = argv[++i]
      continue
    }
    if (arg === "--repo") {
      repo = argv[++i]
      continue
    }
    if (arg === "--dest" || arg === "-d") {
      dest = resolve(process.cwd(), argv[++i])
      continue
    }
    if (arg === "--help" || arg === "-h") {
      printHelp()
      process.exit(0)
    }
  }

  return { ref, repo, dest, force }
}

function printHelp() {
  console.log(`
pull-ds-sdk — copy design-system source into consumer (Git only, no npm)

Options:
  --force, -f       Overwrite bks/ds-system-sdk
  --ref <tag>       Git tag/branch (default BKS_DS_REF or v0.1.17)
  --repo <url>      Git URL (default BKS_DS_REPO)
  --dest, -d <path> Output folder (default: bks/ds-system-sdk)

Env:
  BKS_DS_REF, BKS_DS_REPO, BKS_SDK_DEST

Examples:
  node scripts/pull-ds-sdk.mjs --force
  BKS_DS_REF=v0.1.17 pnpm run pull:ds
`)
}

function run(cmd, cwd = process.cwd()) {
  execSync(cmd, { stdio: "inherit", cwd })
}

function main() {
  const { ref, repo, dest, force } = parseArgs(process.argv.slice(2))
  const temp = mkdtempSync(join(tmpdir(), "bks-ds-pull-"))

  console.log(`→ Design system @ ${ref}`)
  console.log(`→ Target: ${dest}`)

  try {
    run(`git clone --depth 1 --branch "${ref}" "${repo}" "${temp}"`)
    const syncScript = join(temp, "scripts/sync-vendor.mjs")
    if (!existsSync(syncScript)) {
      throw new Error(`Tag ${ref} has no scripts/sync-vendor.mjs — use ref >= v0.1.16`)
    }
    const forceFlag = force ? " --force" : ""
    run(`node "${syncScript}" --dest "${dest}"${forceFlag}`)
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }

  console.log(`
✓ Done. Next steps:
  - tsconfig paths: "@bks/ds-system-sdk" -> ["./bks/ds-system-sdk/index.ts"]
  - import "@bks/ds-system-sdk/styles.css" in app entry
  - pnpm add @base-ui/react class-variance-authority clsx tailwind-merge lucide-react
`)
}

main()
