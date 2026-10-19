# This repo's glossary moved to GLOSSARY.md

Since 2026-10-17 the general vocabulary of this repository lives in [`GLOSSARY.md`](./GLOSSARY.md). This file
is only a forwarding note and no longer holds entries.

**Why the name changed**: from upstream v1.3.0 on, the shipped skills recognise a project's domain document
as `GLOSSARY.md` / `GLOSSARY-MAP.md` and no longer accept the old names `CONTEXT.md` /
`CONTEXT-MAP.md` (the story is at the top of `tests/verify-1206-glossary-naming.ts`). The skills were
updated, but the repo's own documents ([AGENTS.md](./AGENTS.md) and
[`docs/agents/domain.md`](./docs/agents/domain.md)) still carried the old name, so an agent following the
skills could not find this glossary — this change renamed them together.

**Why this file still exists**: three hundred-odd places in the repository's history
(`docs/adr/`, `research/` and others) still use the old name. Those are the original records and stay as
they are, following this repo's rule that history is not rewritten; keeping this forwarding file means those
references still lead somewhere (about 348 places counted on 2026-10-17).

**To change the glossary, change `GLOSSARY.md`** — do not write entries back into this file.
