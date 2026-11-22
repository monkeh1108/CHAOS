"""Shared launch and standalone HTML fixtures for browser QA."""
from contextlib import contextmanager
import os
from pathlib import Path
import shutil

import pytest


@pytest.fixture(scope="session")
def standalone_html():
    override = os.environ.get("CHAOS_TEST_HTML")
    path = Path(override) if override else Path(__file__).resolve().parents[2] / "index.html"
    html = path.read_text(encoding="utf-8")
    if override and "policies:Object.freeze" not in html and "policies: Object.freeze" not in html:
        # Expose the original standalone's lexical bindings to migrated browser tests.
        bridge = "\nGRIDIRON_DEBUG.policies = { AnimationPolicy, CoverageRoutePolicy, DefensiveMemory, ProtectionRead, InsideZoneIQ };\n"
        return html.replace("</script>", bridge + "</script>", 1)
    return html


@pytest.fixture(scope="session")
def browser_session():
    from playwright.sync_api import sync_playwright

    executable = os.environ.get("CHAOS_CHROMIUM") or shutil.which("chromium")
    with sync_playwright() as playwright:
        @contextmanager
        def launch(**options):
            browser = playwright.chromium.launch(executable_path=executable, **options)
            try:
                yield browser
            finally:
                if browser.is_connected():
                    browser.close()

        yield launch
