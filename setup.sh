#!/usr/bin/env bash
# Create the harness Python venv and install its dependencies.
#   - run_experiment (the driver) needs PyYAML
#   - analyze needs numpy + matplotlib
#   - metrics/impact-gate use lizard
# System Python is often PEP-668 "externally managed", so the harness runs under this venv:
#   .venv/bin/python -m harness.run_experiment --config config.yaml ...
#   .venv/bin/python -m harness.analyze        --config config.yaml ...
set -euo pipefail
cd "$(dirname "$0")"

python3 -m venv .venv
.venv/bin/pip install --quiet --upgrade pip
.venv/bin/pip install --quiet -r requirements.txt

echo "venv ready. Run the harness with:  .venv/bin/python -m harness.<module>"
