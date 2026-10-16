# Early-overload restructure — design notes

**Branch `early-overload-250`.** This branch restructures the canonical stream so the architecture is
**overloaded early** and then copes for the rest of the run, in the canonical vocabulary. Act VI is
removed, leaving **250 checkpoints**. The back-loaded canonical 300-stream is unchanged on `main`.

## Why

The old stream laid a spine first and only concentrated near the end (god-forming ripples past
cp250). A ripple is only as wide as there are priors to ripple into, so wide ripples are inherently
late — but the *structural overload* (the hub every concept reads, and the "applies to everything"
rules) can be present from the start. This stream puts it there, so cp17–250 measure how an already
overloaded system copes.

## Shape (reference model `harness/oracle/overload.py`, cadence 3:1)

- **Compressed spine (cp2–6):** `thrust = alpha·beta`; `momentum = thrust + 3·(gamma−alpha)`;
  `scaled = momentum·2`; `norm = scaled − mean(scaled)`. Laid fast so the hub can stand up early.
- **Hub `keel` at cp9** (`scaled + momentum`), read directly by ~40 concepts — a god-sized hub from
  the first act. It is **redefined ten times** (cp9/16/32/52/60/64/100/148/200/240); each redefinition
  ripples the whole reader battery that exists by then, so the ripples start early and widen:
  mean `mutates` width by 50-block runs ≈ 4 → 23 → (mixed) → 25 → 21, with the cp240 redef touching
  **203 priors**.
- **Cross-cutting rules front-loaded to the overload core**, not cp73–252: trim every total's highest
  *and* lowest from **cp4**, round every divide to nearest from **cp8**, a held person leaves every
  figure from **cp12**, a SINK person (keel<0) leaves every count from **cp16**, a missing raw counts
  as zero from **cp20**.
- **`patrons` relationship** migrates directed → mutual at **cp40**.
- **cp61–250 coping tail:** sustained load on the overloaded core — bounded reader tweaks on the
  mutatives, periodic keel redefinitions (the wide shocks above), and a growing battery of sheet-wide
  figures (total / top / spread / even-count / mean per reader) that each re-enter the early rules.

## Reading probe

Cold-reader comprehension probe at `[16, 32, 64, 100, 148, 200, 250]` — overload complete, early
coping, the four keel-redef shocks, and the finale. Recall ground-truth is generated from
`overload.py` (concept/figure names live at each boundary, 21 → 190). The signal is the
comprehension-cost trajectory (`probe_cache_read_tokens`) as the hub concentrates, and the gap
between stacks at the same boundary.

## Status

Oracle, 250 own specs and all ripple-closure copies are machine-generated from the oracle and
verified: `harness.spec_check` reports 3408/3408 assertions, 0 mismatches through cp250, and
`harness.checkpoint_lint` passes. Not yet run against a real stack.
