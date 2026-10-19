# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues.

## How to work with tickets (read this section first)

**Read and write this repo's tickets with the plugin's own tools, not by typing tracker commands by hand.**
Those tools sit on top of the plugin's contract layer: they do the work the current backend needs and read the
result back to check it; the same tool still works when the backend is not GitHub, which is why this document
does not spell out commands.

**Each tool hands back three parts**: a plain-language summary, a "this call" hint section (the tool's honest
warning about how complete the answer is, present only when something degraded — for example when a section
heading restricted the body to one section), and a detail block marked "detail (JSON)". The detail block holds
what was really fetched — ticket body, comments, labels, sub-issues, the map's five sections, and for an edge
the column that edge landed in, each on demand. When the total exceeds a limit, the tail entries are dropped
and the place says "N more items were not returned", so a missing part is never mistaken for a complete one.
For a smaller but complete slice, use that tool's own parameters (how many comments of one ticket, how many
rows to list, frontier sub-issues only) instead of waiting for more.

- Create a ticket → `deck_issue_create`
- Read one ticket → `deck_issue_get`
- See which maps and which open tickets exist → `deck_context`
- See a map's sub-issues and progress → `deck_map_snapshot`
- List thin rows by state, label and assignee → `deck_issue_list`
- Build a whole map in one call (the map itself + sub-issues + the edges between them) → `deck_map_plan_create`
- Add one edge (parent-child or blocking) → `deck_map_link`
- Change one ticket (comment / labels / assignee / close / body) → `deck_issue_patch`

Only two things are outside the tools' reach, and both happen outside the tracker:

- **Login**: run `gh auth login`, finish the browser authorization it asks for, then confirm with
  `gh auth status`.
- **Create a repository**: create the remote repository with `gh repo create` and push to it. The panel's
  "create and publish" wizard does this one for you, so normally you do not type it by hand.

Apart from those two, no `gh` command appears anywhere in this document.

### One rule for writing a body

Write the body into a file first (with real line breaks: each `## section` on its own line, one blank line
between paragraphs) and hand the file to the tool — do not paste the body into a command line, do not write
line breaks as the two literal characters `\n`, and do not let the body start with an invisible character
(a BOM). Read it back after writing and check it. This rule holds for all three backends, it is not
GitHub-specific.

### The fallback when a native capability is missing

The tools prefer the backend's own native capability (on GitHub that is native sub-issues and native
dependency edges). Only when that is genuinely unavailable do they fall back to a `Blocked by: #n` line in
the first line of the sub-ticket's body (several blocking numbers separated by commas). That line is the
shared fallback of all three backends and must not be used as the default way.

## Mandatory label set

This repo uses a mandatory label set — the three labels below must exist in the tracker, and every new issue
carries at least one of them (missing = invalid, per the deck's convention):

- `bug` — something is broken; drives the deck's fix action and BUG filter
- `needs-triage` — unexamined issue awaiting diagnosis; drives the deck's diagnose action and TRIAGE filter
- `wayfinder:grilling` — an open decision/discussion ticket; drives the deck's discuss action

When creating a ticket, `deck_issue_create` adds the required labels for you; change labels with
`deck_issue_patch`.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests;
`/triage` reads this flag.)_

Once this is `yes`, pull requests and issues follow the same labels and state transitions, and a PR is read
and written the way the current backend does it (on this backend: swap the issue family of subcommands for
the PR family). GitHub numbers issues and PRs in one sequence, so `#42` in a body alone does not say which
one it is — when you meet such a number, look up both, or ask the user which one it is.

## When a skill says "publish to the issue tracker"

Create one ticket with `deck_issue_create`.

## When a skill says "fetch the relevant ticket"

Read that ticket with `deck_issue_get` (together with its comments and labels).

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets. Everything below goes
through the tools; nothing here is typed as a command.

- **Map**: one ticket carrying the `wayfinder:map` label, with Notes / Decisions-so-far / Fog in its body.
  Create it with `deck_map_plan_create` (it writes the destination, the Notes and the plan as one map).
- **Child ticket**: a sub-ticket hanging under that map. Create the parent-child edge with `deck_map_link`
  by passing `parentKey`; the tool lands it the way the current backend can and reports honestly in which
  column the edge landed (a native edge, or the fallback of a task list plus a `Part of #<map>` line in the
  first line of the body). The label is `wayfinder:<kind>` (`research` / `prototype` / `grilling` /
  `task`). Once a ticket is claimed, the assignee is the developer driving it (claim with
  `deck_issue_patch`).
- **Blocking**: a blocking relationship is landed as the backend's own native dependency edge (on GitHub,
  native issue dependencies, visible in the interface). Pass `blockedBy` to `deck_map_link`; the tool
  decides whether a native edge can be landed, falls back to a `Blocked by: #n` line in the first line of
  the body when it cannot, and tells you which column it landed in. A ticket is unblocked only once every
  ticket blocking it is closed.
- **Frontier query**: read the map's open sub-issues with `deck_map_snapshot`, drop the ones that can still
  be blocked (a dependency edge points at a ticket that is not closed, or the body's `Blocked by` line still
  names an open ticket) and the ones already claimed; of what remains, take the first in the map's own order.
- **Claim**: point the ticket at the current user with `deck_issue_patch` — this is the session's first write.
- **Resolve**: with `deck_issue_patch`, post one comment that writes down the conclusion, then close the
  ticket; then add one pointer line to the map's Decisions-so-far (a one-sentence conclusion plus a link).
