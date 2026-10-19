# Commit message convention

Every `git commit` message is written in **English**, in complete sentences that say what changed and why.

## Rules

1. **Title**: one complete description, at least 10 characters, with the ticket numbers it touches in
   parentheses at the end: one ticket `(#1136)`, several `(#1057, #1063)`, and a short qualifier when the
   relationship needs saying `(#1052 wrap-up)`. Write a ticket number as `#` plus digits, at the end of the
   line, in ascending order, separated by commas; never a bare number, never half-width brackets. A PR number
   is written `PR #977` so it cannot be confused with a ticket number.
2. **Body**: say what the change contains and why, plus one sentence about verification — which checks were
   run and how they came out; if nothing was verified, say so honestly.
3. **Ticket numbers must be real**: before committing, read that ticket once and confirm the number matches
   the topic.
4. **One commit carries one independently deliverable piece of work**; when several tickets are involved with
   different progress, describe them as separate paragraphs in the body.

## Example

```
Convert issueDetail from JavaScript to TypeScript with zero behaviour change (#1161)

Add the missing return type annotations on both entry points; the logic is untouched.
tsc and tests/verify-1053-issue-write pass; the smoke set is green.
```
