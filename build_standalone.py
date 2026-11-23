"""Compatibility entry point for the npm standalone build."""
import subprocess
import sys
from pathlib import Path


def main():
    script = Path(__file__).resolve().parent / "tools" / "build_standalone.mjs"
    return subprocess.call(["node", str(script), *sys.argv[1:]])


if __name__ == "__main__":
    raise SystemExit(main())
