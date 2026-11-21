# CHAOS AI development agent — setup guide

This package starts with the **real v0.36.4w source**, not an empty demo.

## Before it can run
1. Create a **private** GitHub repository named `chaos-football`, without auto-initializing files. Upload this ZIP's extracted contents to the repository (including `.github/`). GitHub Desktop makes this easier than browser uploads.
2. Go to **Settings → Secrets and variables → Actions → Secrets** and add `OPENAI_API_KEY` from your own OpenAI API account. ChatGPT subscription fees do not cover separate API usage; set an API budget/usage alert.
3. Under **Settings → Actions → General**, allow actions and allow GitHub Actions to create pull requests. Review organization/repository policy if unavailable.
4. Set **Settings → Branches / Rulesets** protections for `main`: pull request required before merges, CI required, no force pushes, and no bypasses you don't explicitly trust. On some free private-repository plans certain branch protection/ruleset capabilities may be limited.
5. Under **Settings → Secrets and variables → Actions → Variables**, add `CHAOS_AGENT_ENABLED` with value `true` **only when ready**. Until then the automated workflow exits without coding. If no approved tasks exist, it also does nothing.
6. Move exactly one task from `tasks/drafts/` to `tasks/approved/` via a reviewed change on `main`. Presence in `tasks/approved/` is the approval; editing a draft is not approval.
7. Use **Actions → CHAOS approved-task coding agent → Run workflow** for the first test. Thereafter it checks for tasks daily (~07:17 UTC), subject to GitHub scheduling delays. It will not repeat a task if a PR for its branch already exists.
8. Check the **Pull requests** tab. Review code and test results. Merge manually only after you play the build and approve it. Remove the completed approved task file before expecting another run for the same task.

## How this works
- A task is **not** executed unless it is in `tasks/approved/` on the default branch.
- Codex works in its sandbox on one task per run, then the workflow builds `index.html`, checks paths, runs focused QA and proposes a PR. It does **not** merge.
- A PR can fail or need refinement; opening a PR is not proof that an in-game bug is fixed.
- New task approvals and changes to workflows must come from trusted repo writers. Keep those privileges restricted.

## Playable builds
- `index.html` is the standalone desktop/browser build. You can open it directly after downloading a PR artifact or source.
- A permanent hosted URL is a separate optional phase. GitHub Pages is often public even for private source repos; **do not publish a private prototype until you decide how to control access**.

## Costs and limitations
- OpenAI API requests cost money independently of ChatGPT Plus/Pro. GitHub Actions runners may also count against plan quotas.
- A once-daily schedule is not 24/7 computation: it performs bounded work when approved tasks are available. Increase cadence cautiously after observing costs and quality.
- Never store API keys in source files, issues, task documents, HTML, or ChatGPT messages. Keep them in GitHub Actions Secrets.
- Recommended security improvements before expanded use: pin third-party actions to audited commit SHAs, enforce code-owner approval, and periodically rotate credentials.
