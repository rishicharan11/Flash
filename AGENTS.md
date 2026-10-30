# Flash project instructions

## Project destinations

- Paper file: https://app.paper.design/file/01M65Y0HWJVJCC52EYZRET51GG/p-1-0
- GitHub repository: https://github.com/rishicharan11/Flash
- Connection settings: .paper/project.json
- Workflow: docs/PAPER_WORKFLOW.md

## Paper first, approval before publication

This order applies to designs, documentation, source code, configuration,
assets, and other project files.

1. Read these instructions and inspect the target Paper file and Git state.
2. Create or update the proposal in Paper FIRST. Include a change batch ID,
   affected paths, proposed behavior/content, and review status.
   Designs belong on editable artboards. Documentation belongs in readable
   text. Code/configuration needs a review summary and source preview or diff.
   For binary files, show a preview when supported and describe the change;
   never claim the canvas contains the original binary.
3. Prepare corresponding local drafts only after the Paper proposal exists.
   Verify that they match the review. Use Paper JSX/styles for design exports.
4. Show the Paper link, exact file list, scope, and verification results.
   Ask the user to approve that concrete batch.
5. STOP before commit or push until the user explicitly approves publication.
   A request to design, implement, test, or prepare is not push approval.
6. After approval, verify that Paper and the local scope still match. Commit
   only that batch. Record the approved commit and target ref in the local
   Git approval file, then push to the configured repository.
7. Update Paper with the published commit and status after a successful push.
   If anything changes beyond the approved batch, repeat review and approval.

Never create an approval record yourself before explicit user approval.
Never disable, bypass, or silently remove the push guard. Approval records
belong under .git and must not be committed. Do not publish secrets.

## Connection boundaries

This is an agent-managed Paper/MCP handoff, not an automatic mirror.
Do not invent webhook, API, or background synchronization support.
If Paper access fails, stop publication and explain the blocked step.
Do not replace the specified Paper file with another design service.

The local hook checks a recorded commit and destination. It cannot verify
a chat approval or edits made in Paper. The agent must verify those first.
Hooks apply only to checkouts where enabled; they are not server protection.

## Parallel work

Use multiple subagents when useful, as requested by the user. Assign distinct
scopes and a single Paper writer per review batch to prevent conflicting edits.
No agent may push or approve a batch without explicit user authorization.
