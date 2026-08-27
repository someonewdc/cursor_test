---
name: ship-pr
description: Implement a feature on a new branch, run tests, open a GitHub PR with gh, and stop before merge. Use when the user asks to ship, open a PR, or implement a feature for review.
---
# Ship PR
1. Before starting work, fetch the latest main (`git fetch origin main`) and create a new branch from `origin/main`. Never start from a stale local branch. Never commit to main. Every new PR must target main.
2. Implement only the requested change.
3. Add or update tests for the new behavior.
4. Run the project's test (and lint) commands. Do not open a PR if they fail.
5. Commit with a conventional message.
6. Push and `gh pr create` against main. PR body: summary, test plan, how to verify.
7. Reply with the PR URL and "READY FOR REVIEW".
8. Do not merge. Do not enable auto-merge.
9. If the user pastes CI failure logs or review notes, fix on the same branch and push.
