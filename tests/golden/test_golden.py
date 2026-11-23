"""Capture and compare seeded plays in a real headless Chromium browser."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SCENARIOS = ("run", "pass", "kickoff", "contact_lab")


def capture(browser, html, scenario):
    # Disable the frame loop so only explicit debug ticks advance the game.
    # Match bootstrap uses Math.random before the in-engine RNG can be seeded.
    setup = f"""<script>
window.goldenPageErrors = [];
window.addEventListener('error', event => goldenPageErrors.push(event.message));
window.goldenScenario = {json.dumps(scenario)};
window.goldenOriginalRandom = Math.random;
Math.random = () => 431 / 4294967296;
window.requestAnimationFrame = () => 0;
</script>"""
    replay = (HERE / "match_replay.js").read_text(encoding="utf-8")
    driver = replay + "\n" + (HERE / "scenarios.js").read_text(encoding="utf-8")
    if "<script>" not in html or "</body>" not in html:
        raise ValueError("Expected the standalone CHAOS HTML")
    page = html.replace("<script>", setup + "<script>", 1)
    page = page.replace("</body>", f"<script>{driver}</script></body>", 1)
    # Windows browser helpers can briefly retain an open profile log after exit.
    with TemporaryDirectory(prefix="chaos-golden-", ignore_cleanup_errors=os.name == "nt") as directory:
        path = Path(directory) / "scenario.html"
        path.write_text(page, encoding="utf-8")
        profile = Path(directory) / "profile"
        flags = ["--headless=new", "--disable-gpu", "--no-first-run",
                 "--virtual-time-budget=1500", "--window-size=1120,800"]
        # The disposable Linux Actions worker blocks Chromium's user namespaces.
        # Match the Playwright QA launch there, retaining Chromium defaults locally.
        if sys.platform.startswith("linux") and os.environ.get("GITHUB_ACTIONS") == "true":
            flags.append("--no-sandbox")
        stdout = Path(directory) / "stdout"
        stderr = Path(directory) / "stderr"
        if os.name == "nt":
            # Launch Windows GUI executables hidden with file redirection.
            env = dict(os.environ, CHAOS_GOLDEN_BROWSER=browser, CHAOS_GOLDEN_DIR=directory,
                       CHAOS_GOLDEN_URI=path.as_uri(), CHAOS_GOLDEN_FLAGS=" ".join(flags))
            command = [
                "powershell.exe", "-NoProfile", "-NonInteractive", "-Command",
                r"""
$dir = $env:CHAOS_GOLDEN_DIR
$arguments = $env:CHAOS_GOLDEN_FLAGS + ' --user-data-dir="' + $dir + '\profile" --dump-dom ' + $env:CHAOS_GOLDEN_URI
$browser = Start-Process -FilePath $env:CHAOS_GOLDEN_BROWSER -ArgumentList $arguments -WindowStyle Hidden -PassThru -RedirectStandardOutput "$dir\stdout" -RedirectStandardError "$dir\stderr"
if (!$browser.WaitForExit(25000)) { Stop-Process -Id $browser.Id; exit 124 }
exit $browser.ExitCode
""",
            ]
            process = subprocess.run(command, env=env, timeout=30)
        else:
            with stdout.open("wb") as output_file, stderr.open("wb") as error_file:
                process = subprocess.run(
                    [browser, *flags, f"--user-data-dir={profile}", "--dump-dom", path.as_uri()],
                    stdout=output_file, stderr=error_file, timeout=30,
                )
        output = stdout.read_text(encoding="utf-8", errors="replace")
        errors = stderr.read_text(encoding="utf-8", errors="replace")
        match = re.search(
            r'<script id="chaos-golden-result" type="application/json">(.*?)</script>',
            output, re.DOTALL,
        )
        if process.returncode or not match:
            raise RuntimeError(f"{scenario}: browser returned {process.returncode}\n{errors[-2500:]}")
        payload = json.loads(match[1])
        if "error" in payload:
            raise RuntimeError(f"{scenario}: {payload['error']}")
        return payload["snapshots"]


def canonical(data):
    return json.dumps(data, ensure_ascii=False, sort_keys=True, indent=2, allow_nan=False) + "\n"


def capture_repeatable(browser, html, scenario, label):
    first = canonical(capture(browser, html, scenario))
    second = canonical(capture(browser, html, scenario))
    if first != second:
        raise AssertionError(f"{scenario}: two fresh {label} runs produced different snapshots")
    return first


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--browser", default=os.environ.get("CHAOS_CHROMIUM"),
                        help="Path to Chromium, Chrome, or Edge (or set CHAOS_CHROMIUM)")
    parser.add_argument("--html", type=Path, default=ROOT / "index.html")
    parser.add_argument("--reference-html", type=Path, default=os.environ.get("CHAOS_GOLDEN_REFERENCE"),
                        help="Compare against a fixed baseline build in the same browser")
    parser.add_argument("--record", action="store_true", help="Explicitly write the reference snapshots")
    args = parser.parse_args()
    if args.record and args.reference_html:
        parser.error("--record and --reference-html cannot be combined")
    browser = args.browser
    if not browser:
        browser = next((path for name in ("chromium", "chromium-browser", "google-chrome", "msedge")
                        if (path := shutil.which(name))), None)
    if not browser and os.name == "nt":
        edge = Path(os.environ.get("ProgramFiles(x86)", "C:/Program Files (x86)"))
        edge = edge / "Microsoft/Edge/Application/msedge.exe"
        if edge.is_file():
            browser = str(edge)
    if not browser:
        parser.error("Install a Chromium-family browser or provide --browser or CHAOS_CHROMIUM.")
    html = args.html.read_text(encoding="utf-8")
    reference = args.reference_html.read_text(encoding="utf-8") if args.reference_html else None
    actual = {
        scenario: capture_repeatable(browser, html, scenario, "current build")
        for scenario in SCENARIOS
    }

    fixtures = HERE / "fixtures"
    if args.record:
        fixtures.mkdir(exist_ok=True)
    failures = []
    for scenario, snapshot in actual.items():
        path = fixtures / f"{scenario}.json"
        if args.record:
            path.write_text(snapshot, encoding="utf-8", newline="\n")
        else:
            expected = (capture_repeatable(browser, reference, scenario, "baseline")
                        if reference is not None else path.read_text(encoding="utf-8"))
            if snapshot != expected:
                failures.append(scenario)
                continue
        digest = hashlib.sha256(snapshot.encode("utf-8")).hexdigest()[:12]
        label = "exact match to two baseline runs" if reference is not None else "two identical runs"
        print(f"PASS {scenario}: {label} ({digest})")
    if failures:
        raise AssertionError(f"Golden snapshot mismatch: {', '.join(failures)}")


if __name__ == "__main__":
    main()
