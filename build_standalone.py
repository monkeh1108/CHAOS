"""Build/check a self-contained browser HTML from the one maintained engine.

Usage: python build_standalone.py [--check]
--check is read-only: exit 1 if index.html is stale.
"""
from pathlib import Path
import argparse
import hashlib

ROOT = Path(__file__).resolve().parent
TEMPLATE = ROOT / 'src/browser_template.html'
ENGINE = ROOT / 'src/engine.js'
RENDERER = ROOT / 'src/renderer3d.js'
SPECIAL_TEAMS = ROOT / 'src/special_teams.js'
DEFENSE_CONTROLS = ROOT / 'src/defensive_controls.js'
CPU_QB_POLICY = ROOT / 'src/cpu_qb_policy.js'
RUSH_AWARENESS = ROOT / 'src/rush_awareness.js'
PLAYBOOK_NAV = ROOT / 'src/playbook_navigation.js'
COVERAGE_ROUTE = ROOT / 'src/coverage_route_policy.js'
DEFENSIVE_MEMORY = ROOT / 'src/defensive_memory.js'
RUN_PURSUIT = ROOT / 'src/run_pursuit_policy.js'
PURSUIT_REACTION = ROOT / 'src/pursuit_reaction.js'
CONTACT_FEEDBACK = ROOT / 'src/contact_feedback_policy.js'
DEFENSIVE_PRESNAP = ROOT / 'src/defensive_presnap.js'
ANIMATION_POLICY = ROOT / 'src/animation_policy.js'
PROTECTION_READ = ROOT / 'src/protection_read.js'
BLOCKING_POLICY = ROOT / 'src/blocking_policy.js'
AIR_CONTEST_POLICY = ROOT / 'src/air_contest_policy.js'
INSIDE_ZONE_IQ = ROOT / 'src/inside_zone_iq.js'
DIVE_REACH = ROOT / 'src/dive_reach.js'
ANATOMY_HITBOXES = ROOT / 'src/anatomy_hitboxes.js'
CONTACT_EVIDENCE = ROOT / 'src/contact_evidence.js'
CONTACT_OUTCOMES = ROOT / 'src/contact_outcomes.js'
GRIP_ATTACHMENT = ROOT / 'src/grip_attachment.js'
CONTACT_LAB = ROOT / 'src/contact_lab.js'
BODY_CONSTRAINT = ROOT / 'src/body_constraint.js'
TACKLE_STRUGGLE = ROOT / 'src/tackle_struggle.js'
TACKLE_ESCAPE = ROOT / 'src/tackle_escape.js'
TACKLE_REENGAGEMENT = ROOT / 'src/tackle_reengagement.js'
ESCAPE_REACTIONS = ROOT / 'src/escape_reactions.js'
SQUARE_CONTACT = ROOT / 'src/square_contact.js'
DIVE_COLLISION = ROOT / 'src/dive_collision.js'
LOW_CONTACT = ROOT / 'src/low_contact.js'
TACKLE_INTELLIGENCE = ROOT / 'src/tackle_intelligence.js'
OUTPUT = ROOT / 'index.html'
MARKER = '<!-- GRIDIRON_ENGINE -->'


def render() -> str:
    template = TEMPLATE.read_text(encoding='utf-8')
    engine = ('\n'.join(p.read_text(encoding='utf-8') for p in [SPECIAL_TEAMS, DEFENSE_CONTROLS, CPU_QB_POLICY, RUSH_AWARENESS, PLAYBOOK_NAV, COVERAGE_ROUTE, DEFENSIVE_MEMORY, RUN_PURSUIT, PURSUIT_REACTION, CONTACT_FEEDBACK, DEFENSIVE_PRESNAP, ANIMATION_POLICY, PROTECTION_READ, BLOCKING_POLICY, AIR_CONTEST_POLICY, INSIDE_ZONE_IQ, DIVE_REACH, ANATOMY_HITBOXES, CONTACT_EVIDENCE, CONTACT_OUTCOMES, GRIP_ATTACHMENT, BODY_CONSTRAINT, TACKLE_STRUGGLE, TACKLE_ESCAPE, TACKLE_REENGAGEMENT, ESCAPE_REACTIONS, SQUARE_CONTACT, DIVE_COLLISION, LOW_CONTACT, TACKLE_INTELLIGENCE]) + '\n' +
              RENDERER.read_text(encoding='utf-8') + '\n' +
              ENGINE.read_text(encoding='utf-8') + '\n' + CONTACT_LAB.read_text(encoding='utf-8'))
    if template.count(MARKER) != 1:
        raise ValueError('Template must contain exactly one engine placeholder')
    if '<script>' in engine or '</script>' in engine.lower():
        # A closing script tag in engine source would terminate the inline JS.
        raise ValueError('Engine includes an HTML script tag, unsafe to inline')
    return template.replace(MARKER, '<script>\n' + engine + '\n</script>')


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Verify standalone HTML matches the source; do not change files')
    args = parser.parse_args()
    expected = render()
    current = OUTPUT.read_text(encoding='utf-8') if OUTPUT.exists() else None
    digest = hashlib.sha256(expected.encode('utf-8')).hexdigest()[:16]
    if args.check:
        if expected != current:
            print('FAIL: standalone index.html is out of date. Run python build_standalone.py')
            return 1
        print(f'PASS: standalone matches the sole maintained engine (sha256 {digest})')
        return 0
    if expected != current:
        OUTPUT.write_text(expected, encoding='utf-8')
        print(f'Built standalone index.html (sha256 {digest})')
    else:
        print(f'Already up to date (sha256 {digest})')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
