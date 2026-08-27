---
name: code-review
description: >-
  Reviews a branch, pull request, or local diff against this repo's standards.
  Use when the user asks to review code, conduct a review, review a PR,
  провести ревью, сделать ревью, посмотреть PR, or check a pull request.
---

# Code Review

Review only. Do not implement, commit, push, merge, or enable auto-merge.
Do not use Bugbot or the security-review subagent.

If this chat also implemented the change, warn once that a fresh Agent chat is more reliable, then review the diff anyway — not the conversation memory.

## Scope

1. Prefer an explicit target: PR URL/number, branch name, or “uncommitted only”.
2. If the target is unclear, ask once. Default: `origin/main...HEAD` including staged and unstaged files.
3. If given a PR or branch that is not checked out, inspect it with `gh` (`gh pr diff`, `gh pr view`). Do not stash or force-checkout unless the user confirms.

```bash
git fetch origin main
git diff origin/main...HEAD
git status --short
```

Read the diff, plus tests and callers that share the changed state. Do not scan the whole repo.

## Checklist

- Change matches the request; no extra files or drive-by refactors.
- `GET /health` still returns JSON `{ ok: true }` if HTTP/app bootstrap changed.
- Logic and edge cases (empty input, missing rows, HTMX vs full-page).
- Tests cover the new behavior; `pnpm test` / `pnpm lint` are expected, not a substitute for reading the diff.
- Prisma: both sides of relations, `createdAt`/`updatedAt`, no Prisma 7 APIs. Migrations committed if the schema changed.
- No secrets (`.env`, credentials). `.env.example` is fine.
- Branch is not `main`; PR targets `main` and must not merge itself.

## Output

Lead with a one-line verdict: **Approve**, **Request changes**, or **Comment**.

Then a table, highest severity first:

| Severity | Location | Finding |
| --- | --- | --- |
| Critical / Suggestion / Nit | `file:line` | What is wrong and what to do |

- **Critical**: must fix before merge (bugs, data loss, broken contract, secrets).
- **Suggestion**: should fix; not a blocker if the author disagrees with a reason.
- **Nit**: style or naming; optional.

If there are no findings, say so in one sentence and **Approve**.
Do not patch the code unless the user then asks to apply the review.
