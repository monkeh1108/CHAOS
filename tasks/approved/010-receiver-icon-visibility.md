# CHAOS — Task 010: Receiver Icon Visibility & Possession-Aware UI

## Priority: HIGH — Gameplay UI Bug

## Background

Human playtesting revealed that receiver-button icons (A, B, X, Y) appear when they should not.

### Observed bugs

**Bug 1 — Defensive play calling**

When the human player is controlling the defense, receiver-button icons appear over CPU offensive players.

This occurs before the snap and during passing plays.

It allows the human player to distinguish CPU passing plays from running plays, revealing information that should not be available.

**Bug 2 — Kickoff returns**

During kickoffs, receiver-button icons appear over players on the return team's front line while the football is airborne.

The icons disappear after the returner catches the ball.

These icons have no purpose during kickoff coverage or returns.

## Objective

Ensure receiver-button icons appear only when the human player is controlling the offense and the icons are relevant to an available passing interaction.

Do not change the actual passing mechanics.

## Required Behavior

### 1. Human-Controlled Passing Offense

When the human player controls the offensive quarterback during a valid passing play:

- Display the correct receiver-button icons.
- Preserve all existing receiver assignments.
- Update icons when player eligibility changes.
- Remove icons when they are no longer relevant.
- Preserve the established passing controls and button mappings.

### 2. Human-Controlled Defense

When the human player controls the defense:

- Never display offensive receiver-button icons.
- Do not reveal CPU passing or running plays through the UI.
- Apply this rule before and after the snap.
- Preserve defensive player indicators, tackling controls, and pass-defense controls.

### 3. Special Teams

Hide receiver-button icons during:

- Kickoffs.
- Kickoff returns.
- Punts.
- Punt returns.
- Other special-teams phases where receiver passing controls are unavailable.

### 4. Possession and Game-State Transitions

Verify correct icon behavior during:

- Handoffs.
- Quarterback scrambles.
- Pass releases.
- Interceptions.
- Fumbles and possession changes.
- Touchdowns.
- Dead-ball situations.
- Changes between offense and defense.

Receiver-button icons must not persist after the relevant passing interaction ends.

### 5. Rendering Consistency

Check both 2D and 3D rendering paths.

Use a shared eligibility rule where practical rather than implementing conflicting conditions in separate renderers.

Avoid unnecessary UI redesigns.

## Required Investigation

Identify the existing code responsible for receiver-button icon visibility.

Determine whether it incorrectly relies on:

- The current play type.
- The existence of eligible receivers.
- The current ball carrier.
- The possession team.
- The user-controlled team.
- The current game phase.

Correct the underlying visibility conditions.

Do not simply hide icons globally.

## Mandatory Regression Tests

Create focused tests confirming that:

1. Human-controlled passing plays display the correct receiver icons.
2. Human-controlled defensive plays never display CPU receiver icons.
3. CPU offensive play selection is not leaked through receiver icons.
4. Kickoff and kickoff-return phases display no receiver icons.
5. Punt and punt-return phases display no receiver icons.
6. Icons disappear after a completed handoff.
7. Icons disappear when a quarterback becomes a committed runner.
8. Icons disappear after a pass release when no passing input remains available.
9. Interceptions and possession changes do not leave stale icons.
10. Both 2D and 3D rendering follow the same visibility rules.
11. Existing passing controls continue working.

Where practical, test the actual live gameplay state and rendering eligibility rather than only checking isolated helper functions.

## Engineering Restrictions

- Read AGENTS.md before changing code.
- Make surgical, task-scoped modifications.
- Preserve receiver-button assignments and passing controls.
- Do not modify defensive AI, movement physics, tackling, or player ratings.
- Do not rewrite the entire rendering system.
- Do not modify GitHub Actions, agent permissions, or task approval policies.
- Rebuild the standalone HTML from maintained source.
- Run relevant regression tests.
- Document the cause, changes, test results, and known limitations.
- Open a review-only pull request.
- Do not merge automatically.

## Success Criteria

Receiver-button icons are visible only when the human player has a legitimate passing interaction available.

They must never appear over the CPU offense while the human is defending, and must never appear during kickoff or punt gameplay.

The fix must preserve existing offensive passing controls and work consistently in 2D and 3D.

**CHAOS principle: The interface should provide information relevant to the player's own controls without revealing the opponent's hidden play selection.**