# Paper-first publishing

## Destinations

Paper: https://app.paper.design/file/01M65Y0HWJVJCC52EYZRET51GG/p-1-0
GitHub: https://github.com/rishicharan11/Flash

This is an agent-managed workflow using Paper's connected tools and Git.
No background watcher, webhook, or automatic arbitrary-file mirror is installed.

## Every change batch

1. Assign a batch ID and create the proposal in Paper before local drafts.
2. List affected paths and show the proposed design, document, or file change.
3. Prepare local drafts and run the checks appropriate to the change.
4. Compare the local diff with the Paper review, including removals and assets.
5. Request explicit approval for that batch and intended GitHub destination.
6. Wait for the user's approval. Silence or approval of another batch does
   not authorize a push.
7. Recheck Paper for edits and confirm the approved scope. Stage only the
   reviewed files and commit them after approval.
8. Record the approved commit ID and full destination ref in the private
   approval file, then push. The hook checks those exact values.
9. After success, add the published commit ID and status to Paper.

If scope or content changes, update Paper and obtain fresh approval.
Changing the commit ID requires a new approval record after verifying scope.
Do not push additional local history that was outside the approved batch.

## What belongs in Paper

- Designs: editable artboards, including the reviewed states.
- Documentation: readable text with the intended repository path.
- Code/configuration: behavior summary, affected paths, and source/diff preview.
- Assets/binaries: supported visual previews, purpose, path, and change summary.

Paper reviews are not a lossless archive of arbitrary source or binary files.
Preserve original files locally and publish their approved versions to Git.
Do not put credentials, private keys, or other secrets on the canvas or in Git.

## Husky push guard

Install development dependencies in each checkout:

```sh
npm ci
```

The package prepare script runs Husky and installs its generated hooks under
.husky/_. To reinstall hooks after setup, run npm run prepare.

The tracked .husky/pre-push entrypoint runs the existing .githooks/pre-push
approval guard first, then npm run build. A rejected approval or failed build
stops the push. Husky forwards the remote arguments and Git ref updates to
the guard. Keep generated .husky/_ files untracked.

Husky documentation: https://typicode.github.io/husky/how-to.html

After explicit user approval and the matching commit, the publishing agent
writes one line to the path returned by:

```sh
git rev-parse --git-path paper-approval
```

The line contains the full commit ID, one space, and the destination ref
(for example, refs/heads/main), ending with a newline. The record is local
Git metadata and is never part of a commit. Do not create it in advance.

The hook rejects a missing/invalid record, a different commit, a different
destination ref, deletion, tags, multiple ref updates, or another repository.
HTTPS and SSH URLs for rishicharan11/Flash are accepted.

The hook trusts the local approval record; it cannot authenticate a human
approval or check live Paper changes. Agents must do those checks themselves.
Local hooks can be bypassed and do not cover GitHub's UI or other checkouts.
This setup does not install GitHub branch protection.

## First review

Batch: setup-001
Paper artboard: Flash / Paper-first publishing
Status: approved for publication with inbox-c-001 and husky-001

Files in this batch:
- README.md
- AGENTS.md
- .paper/project.json
- docs/PAPER_WORKFLOW.md
- .githooks/pre-push

The original setup batch established the workflow. The first publication also
includes the Inbox C frontend and the requested Husky integration.
