<!-- BEGIN SPEKY v:3 profile:full hash:3014517b -->
## SPEKY

This project uses SPEKY for spec-driven development. Changes live in `.speky/specs/` and
`.speky/stories/`; current behaviour lives in `.speky/capabilities/`. SPEKY holds state and rules;
you do the work through the `speky` CLI (every `--json` command prints one JSON document).

- Start with `speky prime` (where to pick up + workflow), then `speky next --json`, and follow the
  action and skill it names. Skills (in this tool's skills folder): `speky` (hub), `speky-init`,
  `speky-propose`, `speky-validate`, `speky-plan`, `speky-implement`, `speky-test`, `speky-verify`,
  `speky-import`, `speky-design`, `speky-migrate`.
- Write learnings down when you learn them (`speky remember --topic`); hand off at the end of a session
  or milestone (`speky handoff --file <notes.md>`).
- Size work first: a quick, clear fix needs no item; anything that changes behaviour gets
  `speky new spec|story "<title>"`.
- Requirements are `### R1: ...` with WHEN/THEN scenarios. Record evidence per requirement
  (`speky evidence <id> R1 --status met --evidence "<test id>"`), then `speky verify <id>`.
  No completion claims without fresh evidence.
- Validation converges: `speky check <id>`; record only verified findings; stop when it says converged.
- Discovered work: `speky new story "..." --discovered-from <id>`. Decisions: `speky decide`.
- Human gates (stack, design, scope, merge) are the user's call: stop and ask.
<!-- END SPEKY v:3 -->
