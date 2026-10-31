# SinewSlim analysis plan: Spring versus OfficeFloor erosion

> **Status: DRAFT, not yet registered.** Registration is the commit of this file to this
> repository. It must happen **before** SinewSlim reads any `evolve/` branch of the runs named
> in *Data*. After that, any change is a dated amendment commit that says what had been seen
> when it was made.

## 1. Purpose

This plan measures whether a long method stays splittable as an application grows, on the
early-overload stream (`docs/EARLY_OVERLOAD_DESIGN.md`), comparing a Spring backend with an
OfficeFloor backend under the same front-end. The measure is SinewSlim's: a method of 26 code
lines or more is long (Sagenschneider, *What reviewers call a Long Method is a length*,
doi:10.5281/zenodo.23749773). A long method that cannot be brought under 25 by extracting
pieces is *not slimmable*. Such a method only gets harder to take apart as more is added, so
the number of not-slimmable methods is the erosion measure.

The design and the tools are in `~/OfficeFloorSlim` (`DESIGN.md`, *Empirical studies*) and
`~/SinewSlim`.

## 2. What was known when this was written

Honesty about what the author had already seen:

- **Seen.** The harness's existing measures (Lizard, ImpactGate, CK, Zero-Regression Rate) on
  **earlier** runs and earlier streams, some of them published on blog.officefloor.net.
- **Not seen.** Any SinewSlim measure on any run of this experiment. Any result of the runs
  named in *Data*: they were still in progress on another machine, and their branches had not
  been fetched to the machine where this plan was written.

So this is a registered analysis of data that exists but has not been looked at, not a
registration made before the data was collected. The write-up will say so.

## 3. Data

- **Stream.** The early-overload stream: 250 checkpoints, cadence of three additive to one
  mutative, the `keel` hub at cp9 and its redefinitions at cp9, 16, 32, 52, 60, 64, 100, 148,
  200 and 240.
- **Condition.** `just-solve` (ungated), agent `claude-opus-5-5`, 10 chains per stack.
- **Pairs (the confirmatory comparison).** Three Spring and OfficeFloor pairs that share a
  front-end:
  - `officehq-angular-spring` / `officehq-angular-officefloor`
  - `officehq-htmx-spring` / `officehq-htmx-officefloor`
  - `officehq-tanstack-spring` / `officehq-tanstack-officefloor`
- **Descriptive only.** `officehq-react-officefloor` and `officehq-tanstack-mixed` have no
  Spring partner. They are reported but take no part in the hypothesis tests.
- **Run IDs.** _To fill in before registration: one `run_id` per stack, the run of this stream
  and condition, with its chain branches `evolve/<run_id>/just-solve/chain<N>`._ If a stack has
  more than one qualifying run, the earliest complete one is used.
- **Which commit is measured.** At each checkpoint k, the `cpNN agent …` commit: the code as
  the agent left it. Test outcomes come from that checkpoint's capture,
  `evolve-results/capture/cpNN.json`, committed with the `cpNN reset …` commit.
- **Incomplete chains.** A chain that stops before cp250 contributes to the trajectories up to
  where it stopped. It is left out of the tests made at cp250 and listed, with the reason it
  stopped. If any stack has fewer than 6 chains that reach cp250, its pair is reported
  descriptively only.

## 4. Instrument

- **SinewSlim.** The commit is pinned and recorded here before the first scan: _to fill in_.
  The configuration is committed beside this plan as `docs/sinewslim-analysis.yml`, with the
  defaults: trigger 26, target 25, at most 5 inputs and 1 output per piece, no jumps leaving a
  piece except a trailing `return`, smallest piece 3 lines, records offered.
- **Scope.** Backend Java under `src/main/java`, as each stack's `stack.yaml` declares. Test
  sources are excluded. The harness-mandated `/__test__` seed endpoint is included in the
  primary measure; a sensitivity reading leaves it out.
- **The OfficeFloor column.** Until OfficeFloorSlim's own algorithm exists, the projection
  under function injection is SinewSlim's framework reading (`Params.framework()`), labelled
  as such. It is used only for the go/no-go bar (section 7), never for H1 to H4.
- **The same reading on both arms.** H1 to H3 use SinewSlim's conventional reading on the
  Spring arm **and** the OfficeFloor arm. OfficeFloor functions are priced as if their pieces
  had to be extracted conventionally, which is conservative towards OfficeFloor.
- **Wiring.** On the OfficeFloor arms, at each checkpoint: the non-blank lines and the number
  of files under each stack's OfficeFloor configuration (`src/main/resources/officefloor/**`),
  and whether the checkpoint's diff touched them. Spring's equivalent configuration is Java
  (annotations, configuration classes), so it is already inside the Java measures.
- **Lines.** SinewSlim's code lines (as in the paper), not Lizard's NLOC. The pilot reports
  the agreement between the two.
- **Unparseable code.** A file SinewSlim cannot parse is counted, listed and left out. If more
  than 1% of a stack's backend methods are unparseable at any checkpoint, that is reported
  beside every figure for the stack.

## 5. Measures

Per stack, chain and checkpoint k:

| Code | Measure |
|---|---|
| **M1** | Not-slimmable backend methods (the primary measure) |
| M1n | M1 divided by the tests passing at k in the full gate (from the capture) |
| M2 | Long backend methods (26 code lines or more) |
| M3 | M1 by reason: outputs, inputs, both, jumps, one long statement, length |
| M4 | Slim cost (worst seam) of each slimmable long method: median and maximum |
| M5 | *Locked* (god method) warnings |
| M6 | Lines added to existing methods at checkpoint k, against lines in new methods |
| W1 | Wiring lines; W2 wiring files; W3 whether k touched the wiring (OfficeFloor arms) |

Every ratio is pooled (sum over sum), never averaged over checkpoints, as the harness already
does.

## 6. Hypotheses and how each is decided

Statistics: a percentile bootstrap over chains (the chain is the unit of replication), 10,000
resamples, seed 20261031, 95% intervals. Where pairs are pooled, chains are resampled within
each stack.

**H1, the headline.** The Spring arm ends with more not-slimmable methods per passing test than
the OfficeFloor arm of the same front-end.

- Estimand: at cp250, the mean M1n over Spring chains minus the mean M1n over OfficeFloor
  chains, for each pair and pooled over the three pairs.
- **Supported:** the pooled interval's lower bound is above 0 **and** at least two of the three
  pairs point the same way. **Reversed:** the pooled upper bound is below 0. **Otherwise:** no
  difference resolved.
- Second reading, reported but not decisive: the same difference in the area under the M1n
  trajectory (summed over cp1 to cp250).

**H2, the mechanism.** On the Spring arm, the not-slimmable methods are mostly blocked by
jumps or by multiple outputs, the signature of behaviour added inside existing methods.

- Estimand: at cp250, pooled over the Spring chains, the share of M1 whose reason is jumps,
  outputs, or both.
- **Supported:** the interval lies above 50%.

**H3, the shocks.** The `keel` redefinitions push the Spring arm's M1 up by more than the
OfficeFloor arm's.

- Estimand: a difference in differences. For each chain, take the mean increase in M1 across
  the ten redefinition checkpoints minus the mean increase across the other mutative
  checkpoints. Then take Spring minus OfficeFloor, pooled over the pairs.
- **Supported:** the lower bound is above 0.

**H4, the cost OfficeFloor could be hiding.** The OfficeFloor arm's wiring grows in proportion
to behaviour and does not concentrate.

- Estimands, on the OfficeFloor chains: (a) the slope of W1 per passing test against k over the
  run; (b) at cp250, the share of W1 held by the largest wiring file.
- **Fails** if the interval for (a) lies above 0 (wiring grows faster than behaviour), or if
  (b) is above 50% (one file holds most of the wiring). If H4 fails, the write-up says the
  erosion moved from Java into the wiring, whatever H1 shows.

**Reported in every case:** every method where the OfficeFloor arm comes out worse; the
Lizard-based series beside the SinewSlim ones; and every hypothesis, whatever its outcome.

## 7. The go/no-go bar for OfficeFloorSlim (not a hypothesis)

A product decision, fixed here so it cannot move after the data is seen. *Category 3* means a
method that is not slimmable conventionally but is slimmable under the OfficeFloor column
(section 4). Pooled over every chain of the three Spring arms at cp250, OfficeFloorSlim's
Phases 4 to 6 go ahead only if:

1. category 3 is at least a quarter of M1; and
2. there are at least 30 category 3 methods.

If the Spring arms have too few long methods for the bar to be read, that is reported as a
finding, and the scan of OfficeFloor's own code decides on the same two numbers.

## 8. Exploratory, labelled as such

These analyses decide nothing.

- **The agent's limit.** At each checkpoint, does the agent's own spec pass at the first gate?
  This is set against the longest method and the largest slim cost among the methods the
  agent's diff touched. The question is whether the agent's failures go with length or with
  the sinew. The answer is descriptive: rates by band, and a logistic fit with both
  predictors, not a test.
- The descriptive stacks (`react-officefloor`, `tanstack-mixed`), and the front-end layer,
  which SinewSlim does not read.

## 9. Before the first scan of these runs

1. **Pilot.** Run the scan driver on an old run of an earlier stream, for example
   `officehq-angular-spring`, `evolve/202610112340/just-solve/chain1`. Check that each
   checkpoint's commit is found, that the capture's passing tests are read, and how SinewSlim's
   lines agree with Lizard's NLOC. The pilot's figures are not part of the results.
2. Fill in the run IDs (section 3) and the SinewSlim commit (section 4), and commit
   `docs/sinewslim-analysis.yml`.
3. Commit this file. Only then fetch the runs' branches and scan.

## 10. Threats

- **One agent, one stream, one condition.** The result is about this agent growing this kind
  of application ungated. It does not show that every Spring codebase erodes this way.
- **Three pairs.** The across-pair claim rests on three front-ends. Each pair is reported on
  its own.
- **The wiring is measured more coarsely than the Java.** Lines and files of YAML are not a
  seam cost. H4 guards against the obvious failure, not every one.
- **Conflict of interest.** The author created OfficeFloor. This is why the measure is the
  neutral conventional one on both arms, why the decision rules are fixed here, and why every
  case where OfficeFloor comes out worse is reported.
- **Seen before.** The author has seen the harness's earlier Lizard and ImpactGate results on
  earlier streams (section 2), which may have shaped these hypotheses.
