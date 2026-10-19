# Agent Instructions

This file gives an agent working in this repo the context it needs to operate well.

This repo is the personal fork `phucnd0604/dsh-mattpocock-skills-deck` of
`FeatherHunter/dsh-mattpocock-skills-deck`. Install steps, the upstream-sync (rebase/merge) steps and the
list of what the fork changes are in `docs/guides/fork-cap-nhat-tu-upstream.md`.

## Language: English everywhere

Everything written in this repository is written in **English** — conversation replies, code comments,
Markdown documents, issue titles and bodies, commit messages, anything. No Chinese, in any file, in any
commit message, anywhere. The upstream repo was written in Chinese; this fork is not, and the reason is
practical: agents copy the language of the instructions they read, so a single Chinese instruction file turns
every later answer Chinese. When you find Chinese text that is still in the repo, either translate it into
English or delete it — do not leave it and do not add more.

## Agent skills

### Issue tracker

Issues live as GitHub issues, driven through the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles (`needs-triage` / `needs-info` / `ready-for-agent` / `ready-for-human` /
`wontfix`) plus five wayfinder labels (`wayfinder:map` / `research` / `prototype` / `grilling` /
`task`). The **mandatory label set** is `bug` / `needs-triage` / `wayfinder:grilling`. See
`docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — root `GLOSSARY.md` plus `docs/adr/`. See `docs/agents/domain.md`.

### How to ask the human for a decision

When a human has to make a call, write the question in the body of the conversation instead of using a popup
question tool: a popup covers the explanation, so the person cannot see the whole reasoning behind the
question.

### Human-first wording

Every piece of text written while doing a task — conversation replies, issue titles and bodies, Markdown
documents, code comments, any file — is written so that **a human understands it on the first read**: use
words from `GLOSSARY.md` or words whose meaning was already established earlier in the conversation; when a
genuinely new concept has to be expressed, write it as a complete, plain description instead of inventing a
short name or a metaphor that needs its own explanation. Satisfy human readability first, machine convenience
second — an AI reads plain complete sentences fine, but it will happily invent shorthand that only the
current session understands and hand it to the reader.

**Before sending anything out, stop for one second and ask yourself:**

1. Can somebody who has not read the earlier conversation understand what this sentence says?
2. Did I use a name that only this conversation understands? If yes, replace it with plain words.
3. Did I explain anything new in one whole sentence, instead of throwing one word at the reader to guess?

### Commit messages

Every `git commit` message must be written in **English**, as complete, fluent sentences that say what this
change does and why it does it. The title is at least 10 characters — never just `fix` or `update`. See
`docs/agents/commit-convention.md`.

### Commit and push promptly

As soon as one independently deliverable piece of work is finished, commit it and push it to the remote, so
local work cannot be lost to a mistake or a machine change. Do not pile several pieces of work into one
commit.

Use only commands that cannot lose files and cannot rewrite history, for example `git status`,
`git diff`, `git log`, `git add`, `git commit`, `git push`, `git pull --ff-only`. Commit messages
follow the English rule above.

Never use a command that can lose files or rewrite history, for example `git reset --hard`,
`git checkout .`, `git clean -f`, `git push --force`, `git rebase`, `git filter-branch`. When you
are not sure whether a command can lose data, stop and ask the human instead of trying it.

One exception, recorded here because the fork needs it: this fork keeps exactly **one** commit on top of
`upstream/main`, so when that one commit has to be rewritten (amended) to carry new work, the push that
follows is `git push --force-with-lease` — and only after the human has agreed to it in the conversation.
`--force-with-lease` refuses to push when the remote moved since the last fetch, so it cannot silently drop
somebody else's commit.

### TypeScript first, migrate old JS as you touch it, end with TS only

The end goal is that this project contains no hand-written JavaScript — only TypeScript (generated `.js`
build products and derived files do not count). Whenever a requirement, a bug fix, planning or design work
touches hand-written code in this plugin, write it in TypeScript first; existing JavaScript is not rewritten
as a separate project — it is converted "wherever you touch it", until nothing is left. This carries over the
"touch one file, convert one file; no big-bang rewrite" rule from `tsconfig.client.json` and applies it to
the whole repo.

1. Work one file at a time, fix first and convert second, in two commits, and never add new hand-written JS:
   first commit a pure fix, then commit the conversion of that file to TypeScript with zero behaviour change.
   Only convert files this piece of work really touches; every new file is `.ts` (including `.mts` /
   `.d.ts`). Derived files (for example `scripts/generated/*`), the automatic checks themselves and temp
   directories are never converted. "Zero" means zero hand-written `.js`; build products do not count.
2. A conversion has to be wired into the build: register the file in the matching `tsconfig` `include` and
   in the `scripts/build.mts` list (an unregistered file is silently not compiled), keep `target ES2020`,
   `strict`, `noEmit` plus the `esbuild` transpile step, and only call the work done once `tsc -p`, the
   build, the related `tests/verify-*` and the smoke tests pass. Then remove the matching line from both
   ratchet lists (`tests/handwritten-js-baseline.json`: delete that one line; for a test file also re-record
   `tests/unmigrated-tests-baseline.json` with `node tests/verify-unmigrated-tests.ts --record-baseline`) —
   a path left in the list that no longer exists on the tree turns one of those two gates red, and the reason
   is written in each list's own `note` and error message.
3. A conversion also fills in the comments: public functions, types and the important branches get complete
   English sentences explaining why they exist, which convention must not change and what the counter-example
   is; do not restate the type name. For the house style see the top of
   `src/shared/label-color/src/colors.ts`.
4. A conversion also adds logging, following the "Logging discipline" section below: diagnosis first, log
   generously but never log garbage.

### How tests load `.ts` directly (the Node floor and the install-time guard)

The old tests and old sources were converted from `.js` to `.ts` unit by unit: after a file is renamed,
the places that import it still say `./x.js`. `scripts/ts-hook.mts` is the loader hook for exactly that —
it redirects those specifiers to the same-named `.ts` next to them, and when that `.ts` does not exist it
hands the specifier to Node unchanged, so unconverted files behave exactly as before. Use it by putting the
hook in front of the script you are running:

```
node --import ./scripts/ts-hook.mts tests/your-test.ts
```

`npm test` (through `scripts/verify-chain.ts`), `npm run verify:parallel` (through
`scripts/verify-parallel.mts`) and `node scripts/verify-all.mts` (what CI's
`.github/workflows/verify.yml` runs, every gate and then one summary) attach this hook by themselves, so
whoever writes a test does not add it; `npm run test:smoke` (the smoke set) has gone through
`scripts/verify-chain.ts` since #1178 too (`--script smoke` reads the `scripts.smoke` list in
`package.json`), and the hook decision follows that path. The same decision lives in those three places plus
the chain runner — change one, change all four: miss one entry point and the `.ts` migration inside it
behaves differently from everywhere else, with the classic symptom "green `npm test` on this machine, red
in CI".

**Where the Node floor comes from**: the hook uses the synchronous `module.registerHooks()`, which covers
both ESM `import` and CommonJS `require`; the asynchronous `module.register()` cannot see `require` and
is no substitute. The synchronous `registerHooks()` exists from Node 22.15, which is where this line starts —
but 22.15 is not enough to run: with the hook on, tests load `.ts` sources, and Node only strips TypeScript
types by default from 22.18, and above that a dependency draws its own hard line (`jsdom` declares
`^22.22.2 || ^24.15.0 || >=26.0.0`, and eight test cases use it). That is why the root `package.json`
`engines.node` says `"^22.22.2 || ^24.15.0 || >=26.0.0"`: on the 22 line, 22.22.2 or newer; on the 24
line, 24.15 or newer; 26 and above anything (23 and 25 are short-lived lines and are not supported on their
own). The range is copied from the strictest dependency; when that dependency is upgraded, review this range —
make it narrower and people get stuck on "the root project passes, the dependency refuses".

**There are two install-time guards, and missing one lets half the people through**: npm users are stopped by
`engine-strict=true` in `.npmrc`; pnpm users are stopped by `engineStrict: true` in
`pnpm-workspace.yaml` — measured behaviour is that pnpm ignores `engine-strict` in `.npmrc` (it prints a
warning, keeps installing, exits 0), and only the `pnpm-workspace.yaml` entry is a hard stop (exit 1). Both
check the whole dependency tree. The hook also does its own capability check: on a too-old Node it throws one
sentence that points somewhere, instead of a `TypeError` nobody can read.

**A known cost, not a failure**: while the hook loads `.ts`, Node prints one
`MODULE_TYPELESS_PACKAGE_JSON` warning suggesting `"type": "module"` in `package.json`. The same warning
appears today when loading `.js` products (same cause: the nearest `package.json` has no `type` field), so
the hook did not add a new kind of noise.

**"Same-named `.ts` wins" means tests load sources, not build products**: the `.js` in the 94 same-named
pairs under `src/client/views/**` are build products, and with the hook on the tests load the `.ts` source.
Whether the products kept up with the sources is the job of the `verify-*-freshness` gates, not of this
paragraph. (That number grows as the conversion advances: on 2026-10-18, #1251 and #1253 took it from 34
pairs to 94; update this line when you touch it again.)

**Test-side code may only use strippable TypeScript**: `enum` and constructor parameter properties
(`constructor(private x: T)`) need a real transform and make tests and chain scripts fail with
`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` — Node's strip mode deletes type annotations and performs no syntax
transform. The build side runs esbuild, which accepts those forms, so "the same source passes on both sides"
must not be assumed. The repo currently has no such form and no gate blocks it; this rule is what holds it.

**Child processes spawned by chain scripts do not carry the hook**: a dozen places under `tests/` start a
`node` process directly with `child_process` (five of them re-run gate scripts), and child processes do not
get the hook. When those scripts are converted to `.ts` themselves, either pass `--import` to the child too
or call the same code in-process.

### Logging discipline (read the master ticket #502 first: the logging system and its entry points)

Goal: when a flow that crosses an opaque boundary is done, the AI can tell from the local diagnostic log
alone which step it reached and where it stopped, without a human filling in the gaps. Log generously, but
only collect signal, never garbage.

1. Leave a whole-journey trail only at three kinds of boundary: process or module boundaries, persistence
   boundaries and time boundaries. Each journey carries the input summary at the start, the reason for the
   branch taken, the result and duration of each external call, the changes of state, and the conclusion at
   the end; an exception line says which step it happened in, the input summary, what was expected versus
   what happened, and the upstream cause. The older five-kind checklist is an example of these three. Tie one
   journey together with the keys that already exist (workspace short fingerprint, method name, time); when
   that is not enough, open a separate ticket for a real request ID.
2. Four kinds of garbage, never added: a heartbeat repeated when nothing changed, a result logged without
   its reason, a whole object dumped into the log, and a high-frequency line logged without a switch in
   front. Before adding a line ask one question: which failure does this line rule out, and where does it
   point next? If there is no answer, do not add it. Event names and field meanings are stable; changing a
   meaning means a new event.
3. Volume and content are two layers: the always-on layer stays minimal and sufficient, the on-demand layer
   can be relaxed; sampling, throttling and the outer switches follow chapter 3 of
   `docs/design/335-logging-contract.md`. There is exactly one hard red line: the raw text of a replayable
   credential never reaches disk (tokens, password key-values, authorization headers). Under the on-demand
   layer, a wrong path or title is relaxed until it can be located, but until the gates and tables are
   changed to per-layer strictness, log it the way the current whitelist says, and open a separate ticket to
   change the gate and the table.
4. Acceptance has levels: for a new flow or a core path, take the day's export bundle and locate the problem
   from the log alone — if that does not work, the instrumentation is missing; pure refactoring, comment and
   type migrations need no dry run. Before starting, make the related `tests/verify-log-*` pass; when adding
   or removing an event, update the table in chapter 1 of `research/489-appendix.md` at the same time — that
   appendix is the source of truth for the current count. When it turns red, add the log points first and
   talk about features after.

### Terminal discipline

Run commands by hand in DSH's own sidebar terminal (the "Terminal" tab on the right; name the tab title
`<ticket number>-<purpose>` so it can be found later). That terminal ships with DSH and has nothing to do
with better-sidebar — better-sidebar deleted its own terminal from version 0.21 on.

The AI side has no usable terminal tool (better-sidebar removed its `terminal_*` tools and the DSH-side
`dsh-tool-terminal` is not installed on this machine either), so the AI cannot open that sidebar terminal
and must run every command with the native `pwsh` tool instead; write in the conversation body what is being
run and why.

### Release

Publish `package` (the main plugin; skills ship inside it, never separately). `dsh-log` and
`dsh-plugin-update` now live in standalone repos and are only consumed from npm, never published from here
(#878, #892). Private package shells are skipped automatically.

Token unattended path (prefer it when a write-capable token exists — no human clicks needed): set
`$env:NODE_AUTH_TOKEN` (variable name only, never paste the token value) → run
`pwsh -NoProfile -File scripts\publish-token.ps1 -Probe` first (it must say PROBE-OK) → run
`pwsh -NoProfile -File scripts\publish-token.ps1` (gates → publish → one-pass sampling; add `-FullPost`
before announcing). Accepted is not the same as visible: `E409 previously-staged` means the registry
received the package, so wait a few minutes instead of republishing or bumping the version. The old
interactive flow (`scripts\publish-all-window.ps1` via schtasks) stays as fallback. Publishing ends the job;
installing is always done by the user (marketplace upgrade, in-app upgrade, or their own install command).
