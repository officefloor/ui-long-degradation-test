# Act authoring brief (II–V) — the locked contract

You are authoring one Act of the arbitrary-people degradation suite. Act I (cp01–60) is the locked
gold standard; read a few of its specs under `acceptance/specs/cp0*.spec.ts` and the contract in
`acceptance/support/README.md`. Match their style exactly.

## The world (unchanged across all acts)
People with arbitrary names carry arbitrary raw attribute values. Named CONCEPTS are computed from
raw values and from other concepts, shown per person and as worksheet rollups, and show the literal
`n/a` when an input is missing. Relationships link people and migrate cardinality over the run. No
real-world domain meaning anywhere. One worksheet screen (`nav-worksheet`); each test uses a fresh
worksheet (seed data via `resetAndSeed`); state persists per sheet id.

## Hard rules (follow every one)
1. CADENCE: through Act V, every checkpoint whose number is divisible by 4 is `mutative`; all others
   `additive` (Act I's A-A-A-M rhythm: cp64, cp68, ... are mutative). Act VI (cp251+) tightens to 1:1:
   every even checkpoint is mutative. The lint enforces this via `--tighten-after`/`--tighten-period`.
2. `mutates` is a RIPPLE CLOSURE: list every prior checkpoint whose asserted values change, not just
   the direct target. If you change a formula that feeds three downstream concepts, list all whose
   specs assert affected values. Only mutate checkpoints WITHIN YOUR OWN ACT (never Act I or another
   act's).
3. For each id in a mutative's `mutates`, ship an UPDATED COPY of that prior spec under
   `acceptance/specs/cp<NN>/<same-basename>.spec.ts` (NN = the mutative's number). The copy uses
   `../../support/...` imports and carries corrected expected values.
4. AREA: put `area:` inline on every checkpoint. At least 75% of your act's checkpoints must be
   `calc` (the concept-pipeline spine). Other areas: `entity`, `relation`, `persist`, `status`.
5. Specs bind ONLY to `data-testid`. Per person: `person-row-<id>`, raw `person-<attr>`, concept
   `concept-<name>`. Rollups: `rollup-<name>` (or a keyed `<name>-<key>` like `band-count-A`). Tests
   tag `@core` / `@functionality` / `@error`. Import `resetAndSeed` from the right relative depth
   (`../support/seed` top-level, `../../support/seed` in a `cpNN/` subdir); import `auditLines` from
   `../support/audit` when asserting the audit file.
6. HAND-VERIFY every oracle with SMALL INTEGERS so arithmetic is exact. Put the computation in a
   comment above each seed. Avoid floating point; use floor/truncation and state it. A concept with a
   missing input shows `n/a`.
7. `request` is plain English as a non-technical user would type it. No checkpoint numbers, no jargon,
   self-contained. The spec is also shown to the agent, so it fixes the exact testids and values.
8. Do NOT reuse any concept name or data-testid from Act I or from another act. Use only names from
   YOUR act's reserved vocabulary (given in your task).
9. Build ONLY on Act I concepts (below) plus your own new concepts. Do not reference another act's
   concepts.

## The Act I concept chain (final definitions — your read-only base)
- thrust = alpha*beta ; drift = gamma-alpha ; momentum = thrust + 3*drift
- tier: SINK (<0), STEADY (0..199), SURGE (>=200)
- patron: MANY-TO-MANY, seeded `patrons:[{personId,patronId}]`; person-patrons lists names sorted.
  backing = sum of patrons' thrust (n/a if none). net = momentum + backing (backing 0 if none).
- rank: momentum desc, ties by higher alpha. percentile = (N-rank)/(N-1)*100 (one person = 100).
  rollup-leader = rank-1 name.
- grade in {LOW,MID,HIGH} -> weight {1,3,5}. load = momentum*weight. rollup-total-load (skip n/a).
- onset date, sheet-level `anchor` date. age = complete 7-day weeks onset->anchor (truncate toward
  zero). decay = momentum - age.
- active boolean. effective = active ? net : floor(net/2). rollup-active-count, rollup-total-effective.
- clout = AVERAGE (sum/count, floor) of patrons' effective (0 if none). influence = effective + clout.
  rollup-top-influence (ties by name asc).
- region: child entity, seeded `regions:[{personId,region}]`; person-region lists sorted. multiplier
  by first letter N=2,S=3,else=1. reach = sum over the person's regions of momentum*multiplier.
  region-count-<REGION>.
- allies: DIRECTED follows, seeded `follows:[{from,to}]`; person-allies = followed names sorted,
  person-ally-count. synergy = sum of followed people's thrust (0 none). combined = influence+synergy.
- score (single int). concept-note-sum = score (0 none). quality = score (n/a none).
  adjusted = combined + quality (quality 0 if none).
- band from adjusted: E (<0), D (0..99), C (100..249), B (250..499), A (>=500). multiplier A4 B3 C2
  D1 E0. scaled = adjusted * multiplier. band-count-<X>.
- norm = scaled - median(scaled over computable people; lower of two middles for even count).
  outlier = |norm|>100 (yes/no). rollup-outlier-count.
- state in DRAFT->REVIEW->FINAL with REWORK (FINAL<->REWORK). person-advance-<id>, person-demote-<id>
  (blocked from FINAL -> person-state-error), person-rework-<id>. audit `STATE_CHANGED id=.. from=..
  to=..`. rollup-final-total = sum of scaled over FINAL people.

## Seed shapes available (extend as needed, keep generic)
`{ people:[{id,name,alpha,beta,gamma,grade,onset,active,region,score,state,<your new raw attrs>}],
   patrons:[{personId,patronId}], regions:[{personId,region}], follows:[{from,to}], notes:[...],
   anchor:'YYYY-MM-DD', sheets:[{id, people, ...}], <your new relation lists> }`
A missing raw value is `null`. All people `active:true` unless the test is about activeness, so that
effective=net and the spine stays easy to compute.

## Output (do NOT edit checkpoints.yaml)
- Write your spec files under `acceptance/specs/` for YOUR id range only (plus `cpNN/` subdirs for
  updated priors). Disjoint from other acts, so no collisions.
- Write your checkpoints.yaml block (the `  - id:` list entries, 2-space indented, ready to slot
  under `checkpoints:`) to `fragments/act<N>.yaml` (create the `fragments/` dir).

## Self-check before you finish (run from the repo root)
```
python3 - <<'PY'
import yaml,os,re
cps=yaml.safe_load(open('fragments/act<N>.yaml'))  # a bare list
num=lambda i:int(re.match(r'cp0*(\d+)',i).group(1))
bn=lambda c:os.path.basename(c['test'])
by={num(c['id']):c for c in cps}
bad=[]
for c in cps:
    if (num(c['id'])%4==0) != (c['type']=='mutative'): bad.append(f"cadence {c['id']}")
    if not os.path.exists(c['test']): bad.append(f"missing {c['test']}")
    if c['type']=='mutative':
        for m in c['mutates']:
            w=f"acceptance/specs/cp{num(c['id']):02d}/{bn(by[m])}" if m in by else None
            if not w or not os.path.exists(w): bad.append(f"missing prior {w} for {c['id']}->{m}")
calc=sum(1 for c in cps if c['area']=='calc')
print("n",len(cps),"calc%",round(100*calc/len(cps)),"mut",sum(1 for c in cps if c['type']=='mutative'))
print("PROBLEMS:",bad or "none")
PY
```
Your fragment must be a bare YAML list (each item `- id: ...`) for this check; in `fragments/act<N>.yaml`
you may keep the 2-space indent and the self-check will still parse it as a list.
