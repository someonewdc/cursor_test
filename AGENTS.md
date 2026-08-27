# Agent instructions

## Tests

```bash
pnpm install
pnpm test
pnpm lint
```

## Git

Before starting any work, fetch the latest `main` and branch from it:

```bash
git fetch origin main
git checkout -b feat/your-change origin/main
```

Never commit to `main`. Always work on a separate branch created from up-to-date `main`.
Open every new PR against `main`.

## Definition of Done

- Local tests are green.
- PR is opened with `gh pr create` against `main`.
- PR description includes what changed and how to verify.
- Do not merge.

## After implementing

Always run the project's test and lint commands.

## CI

If CI fails, fix on the same branch and push.

## Review

Review is done by a human or a separate Agent chat, not Bugbot.
