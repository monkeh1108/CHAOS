# Draft: full kickoff and outside-zone rear-pile reproduction

Goal: Add a deterministic reproduction for a stationary ball carrier being pushed by 3+ defenders from behind without secured grips. The fixture must use live play update paths, not just direct tackle method calls.

Constraints: Diagnostic and regression tests only. Do not change gameplay behavior or adjust physics thresholds in this task. Capture contact, eligibility, dive recovery, active grip count, blocking state, and yards displaced. Explicitly differentiate kickoff and scrimmage plays.

Acceptance: Test demonstrates whether existing v0.36.4w behavior passes or fails. Summarize observed evidence; do not label bug fixed without evidence.

To approve: move this file into tasks/approved/ in a commit to the default branch. The coding agent handles at most one approved task per scheduled run.
