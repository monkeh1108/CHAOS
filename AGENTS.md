# CHAOS development rules

CHAOS is an independent browser football game; this repository starts at v0.36.4w.

- Approved tasks only. Do not expand scope or implement new gameplay mechanics unless requested.
- Make surgical changes; preserve established physics, controls, and blocking/pursuit systems.
- Diagnose first, reproduce the failure, then modify source.
- `src/` is authoritative. `index.html` is generated using `python build_standalone.py`.
- Do not modify deployment, CI, GitHub workflows, approved tasks, credentials, or agent instructions.
- All changes must pass `python build_standalone.py --check` and focused relevant Node QA scripts.
- Add a focused regression test for each actual bug when feasible. Explain what tests prove and what remains unverified.
- Never claim natural 22-player physics is proven correct by a synthetic fixture alone.
- Temporary notification labels are debugging aids; final football behavior should be readable through animation.
- The owner must personally merge PRs; never auto-merge or push to main.
