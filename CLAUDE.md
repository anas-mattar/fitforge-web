@AGENTS.md

# Governance lives in the parent repository

This is a **code** repository inside the FitForge governance repository. The law you work
under is `../CLAUDE.md` and `../.specify/memory/constitution.md`, plus:

- `../docs/rulebooks/frontend-rules.md` — this tier's MUST / MUST NOT rules
- `../docs/rulebooks/integration-rules.md` — the BFF boundary
- `../modules/training/training-invariants.md` — constitutional force, outranks everything here

If you cannot see those files, you have cloned this repository on its own. Stop: clone the
nested layout instead (`../docs/sdlc/repository-strategy.md`). Working here without the
governance tree above you is working without the rules.

**Territory** for a phase is declared in the governance repository's
`specs/NNN-name/tasks.md`, repo-prefixed — `fitforge-web/src/app/...` — and is graded by
`scripts/scope-check-repos.ps1` from the governance root.
