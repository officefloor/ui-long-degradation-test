"""ui-long-degradation-test harness.

The UI arm of the long-degradation study. See DESIGN.md for the full design.

Module map (DESIGN.md §13 — repository & code-sharing strategy):

  VENDORED verbatim from spring-petclinic-rest-long-degradation-test @ 63d5281
  (generic spine — a copy, not a shared library; extract to a shared core at N=3):
    agent.py      headless `claude -p`, fresh session per checkpoint, config isolation
    landlock.py   filesystem confinement that makes the blind view airtight
    capture.py    raw-capture-not-derive layer  (ADJUST: tool_versions / result shape)

  REWRITTEN for UI (kept signature-compatible with the REST arm at the seams so a
  future shared-core extraction is a lift, not a re-plumb):
    correctness.py  build + serve + Playwright oracle; three-way regression classifier
    metrics.py      Lizard/ImpactGate over TS (file-scope container) + boundary-violation
    run_experiment.py  driver: blind two-commit checkpoint walk, rewired to the UI oracle
    analyze.py      slopes / bootstrap CIs / EvoScore / Zero-Regression Rate (lift stats)
    impact_gate.py  impact-gate CLI wrapper (needs a TS seed distribution)
"""
