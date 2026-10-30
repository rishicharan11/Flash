# Flash

Designs and documentation are reviewed in Paper before publication to GitHub.

- Paper: https://app.paper.design/file/01M65Y0HWJVJCC52EYZRET51GG/p-1-0
- GitHub: https://github.com/rishicharan11/Flash

## Working order

1. Create or update the proposed design, document, or file review in Paper.
2. Prepare the matching local files and verify them.
3. Ask Rishi to approve the specific change batch.
4. Commit and push only after that approval.

Changed scope needs another Paper review and approval. Silence is not approval.

This is an agent-managed workflow. There is no background file synchronization.
Paper holds designs and readable reviews; Git holds the approved source files.

Read AGENTS.md and docs/PAPER_WORKFLOW.md before making changes.
Install development dependencies and Husky hooks after cloning:

```sh
npm ci
```

Husky runs .husky/pre-push before a Git push. It checks the existing approval
guard in .githooks/pre-push, then runs the production build. To reinstall the
hooks in an existing checkout, run npm run prepare.

## Preview the screen

```sh
npm run dev
```

Read docs/INBOX_C.md for the screen behavior, source references and UI tests.
