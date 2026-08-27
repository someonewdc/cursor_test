# Agent instructions

## Tests

```bash
pnpm install
pnpm test
pnpm lint
```

## Git

Never commit to `main`. Always work on a separate branch.

## Definition of Done

- Local tests are green.
- PR is opened with `gh pr create`.
- PR description includes what changed and how to verify.
- Do not merge.

## After implementing

Always run the project's test and lint commands.

## CI

If CI fails, fix on the same branch and push.

## Review

Review is done by a human or a separate Agent chat, not Bugbot.
