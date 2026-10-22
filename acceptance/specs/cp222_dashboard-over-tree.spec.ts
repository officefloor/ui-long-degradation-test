import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("dashboard over tree", () => {
  test("dashboard over tree", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.loadSheet(pg_uma, `${sheet}-c1`);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "20.00"})).toBe(true);
    const p_cy = ui.must(await ui.addPerson(pg_uma, {"name": "Cy", "grade": "A"}));
    const p_di = ui.must(await ui.addPerson(pg_uma, {"name": "Di", "grade": "B"}));
    const c_cy_0 = ui.must(await ui.addClaim(pg_uma, p_cy, {"amount": "10.00"}));
    const c_di_0 = ui.must(await ui.addClaim(pg_uma, p_di, {"amount": "20.00"}));
    expect(await ui.claimAction(pg_uma, c_cy_0, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_di_0, "open")).toBe(true);
    await ui.loadSheet(pg_uma, sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.00"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    await ui.loadSheet(pg_uma, `${sheet}-c1`);
    await ui.setSetting(pg_uma, "parent", `${sheet}`);
    await ui.loadSheet(pg_uma, sheet);
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "clerk-limit", "1.50");
    await ui.setSetting(pg_uma, "review-threshold", "3.00");
    await ui.setSetting(pg_uma, "terms", "5");
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "40.00"}));
    expect(await ui.claimAction(pg_uma, c_ada_1, "open")).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.claimAction(pg_wes, c_ada_0, "settle")).toBe(true);
    await ui.loadSheet(pg_wes, `${sheet}-c1`);
    await ui.refresh(pg_uma);
    await ui.loadSheet(pg_uma, `${sheet}-c1`);
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "clerk-limit", "1.50");
    await ui.setSetting(pg_uma, "review-threshold", "3.00");
    await ui.setSetting(pg_uma, "terms", "5");
    const c_cy_1 = ui.must(await ui.addClaim(pg_uma, p_cy, {"amount": "40.00"}));
    expect(await ui.claimAction(pg_uma, c_cy_1, "open")).toBe(true);
    await ui.refresh(pg_wes);
    await ui.loadSheet(pg_wes, `${sheet}-c1`);
    expect(await ui.claimAction(pg_wes, c_cy_0, "settle")).toBe(false);
    await ui.setToday(pg_wes, "2026-03-20");
    await ui.loadSheet(pg_wes, sheet);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("dash-pending-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("dash-review-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("dash-overdue-count")).toHaveText("0");
    await ui.loadSheet(pg_vic, `${sheet}-c1`);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("dash-pending-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("dash-review-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("dash-overdue-count")).toHaveText("0");
    await ui.expectAudit(`${sheet}-c1`, [
      `RATE_SET sheet=${sheet}-c1 by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet}-c1 by=uma grade=B rate=20.00`,
      `PERSON_ADDED sheet=${sheet}-c1 by=uma name=Cy grade=A`,
      `ROLLUP sheet=${sheet}-c1 by=uma person=Cy claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet}-c1 by=uma name=Di grade=B`,
      `ROLLUP sheet=${sheet}-c1 by=uma person=Di claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet}-c1 by=uma person=Cy amount=10.00 date=2026-03-10`,
      `CLAIM_ADDED sheet=${sheet}-c1 by=uma person=Di amount=20.00 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet}-c1 by=uma person=Cy amount=10.00 date=2026-03-10`,
      `ROLLUP sheet=${sheet}-c1 by=uma person=Cy claimed=10.00 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet}-c1 by=uma claimed-total=10.00 due-total=1.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet}-c1 by=uma person=Di amount=20.00 date=2026-03-10`,
      `ROLLUP sheet=${sheet}-c1 by=uma person=Di claimed=20.00 due-total=4.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet}-c1 by=uma claimed-total=30.00 due-total=5.00 overdue-total=0.00`,
      `SETTING_CHANGED sheet=${sheet}-c1 by=uma key=parent value=${sheet}`,
      `ROLE_SET sheet=${sheet}-c1 by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet}-c1 by=uma key=clerk-limit value=1.50`,
      `SETTING_CHANGED sheet=${sheet}-c1 by=uma key=review-threshold value=3.00`,
      `SETTING_CHANGED sheet=${sheet}-c1 by=uma key=terms value=5`,
      `CLAIM_ADDED sheet=${sheet}-c1 by=uma person=Cy amount=40.00 date=2026-03-10`,
      `CLAIM_REVIEW sheet=${sheet}-c1 by=uma person=Cy amount=40.00 date=2026-03-10`,
      `SNAPSHOT sheet=${sheet}-c1 by=uma name=Cy due-total=1.00`,
      `SNAPSHOT sheet=${sheet}-c1 by=uma name=Di due-total=4.00`
    ]);
  });
  test("dashboard over tree scenario 1", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "terms", "30");
    await ui.setSetting(pg_uma, "late-pct", "5.00");
    await ui.setSetting(pg_uma, "period-numbering-from", "2026-03-01");
    await ui.setSetting(pg_uma, "terms-B", "20");
    await ui.setSetting(pg_uma, "entry-date", "2026-03-01");
    expect(await ui.addVoidReason(pg_uma, "error")).toBe(true);
    await ui.setSetting(pg_uma, "alert-threshold", "1.00");
    expect(await ui.setSettingDated(pg_uma, "rounding", "half-up", "2026-03-10", "half-up")).toBe(true);
    await ui.setSetting(pg_uma, "max-open", "3");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "20.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "12.50", "from": "2026-03-16", "to": "2026-03-25"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P2", "from": "2026-03-16", "to": "2026-03-31"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C", "terms": "3", "contact": "ben@x"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "A", "contact": "ADA@X", "tags": "b, a"}));
    expect(await ui.addPool(pg_uma, "P1")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ada", "share": "33.33", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ben", "share": "33.33"})).toBe(true);
    expect(await ui.addPool(pg_uma, "P2")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P2", {"member": "Ada", "share": "100.00"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "pool:P2", "share": "10.00"})).toBe(true);
    const pl_ada_1 = ui.must(await ui.addPlan(pg_uma, p_ada, {"amount": "25.00", "start": "2026-03-09", "end": "2026-04-30", "day": "1"}));
    expect(await ui.generatePlans(pg_uma)).toBe(0);
    const c_ben_0 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "12.50", "date": "2026-03-15", "ref": "R-1"}));
    expect(await ui.statement(pg_uma, p_ben)).toBe(true);
    const c_ben_1 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "7.77", "note": "n", "tags": "a, B"}));
    expect(await ui.addProof(pg_uma, c_ben_1)).toBe(true);
    expect(await ui.addProof(pg_uma, c_ben_0, "receipt")).toBe(true);
    expect(await ui.watch(pg_uma, p_ben, true)).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("1.25");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("watched-due-total")).toHaveText("0.00");
    await ui.expectAuditView(pg_uma, "Ben", [
      `PERSON_WATCHED sheet=${sheet} by=uma name=Ben`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=uma person=Ben amount=12.50 date=2026-03-15 proofs=1 kind=receipt`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=uma person=Ben amount=7.77 date=2026-03-01 proofs=1`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=7.77 date=2026-03-01 tags=a,b`,
      `STATEMENT sheet=${sheet} by=uma name=Ben due-total=0.00 claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=12.50 date=2026-03-15 ref=R-1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ben share=33.33`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A contact=ada@x`
    ]);
    await ui.setToday(pg_uma, "2026-04-02");
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.merge(pg_vic, p_ben, "Ada")).toBe(true);
    const c_ada_0 = await ui.claimAt(pg_vic, p_ada, 0);
    const c_ada_1 = await ui.claimAt(pg_vic, p_ada, 1);
    expect(await ui.claimAction(pg_vic, c_ada_0, "void")).toBe(false);
    await ui.refresh(pg_uma);
    expect(await ui.claimAction(pg_uma, c_ada_1, "open")).toBe(true);
    await ui.refresh(pg_vic);
    expect(await ui.redate(pg_vic, c_ada_1, "2026-03-09")).toBe(true);
    expect(await ui.hold(pg_vic, p_ada, {"from": "2026-03-20", "to": "2026-03-28"})).toBe(true);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("7.77");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("2.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("7.77");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-0-30")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("watched-due-total")).toHaveText("0.00");
    expect(await ui.watch(pg_vic, p_ada, true)).toBe(true);
    expect(await ui.claimAction(pg_vic, c_ada_1, "settle")).toBe(true);
    expect(await ui.addClaim(pg_vic, p_ada, {"amount": "-10.25", "corrects": "X-1"})).toBeNull();
    await ui.setAsOf(pg_vic, "2026-03-09");
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("2026-03-09");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-status-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("watched-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-01")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-02")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-03")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-04")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-05")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-06")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-07")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-08")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-09")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-10")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-11")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-12")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-B-2026-01")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-B-2026-02")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-B-2026-03")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-B-2026-04")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-B-2026-05")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-B-2026-06")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-B-2026-07")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-B-2026-08")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-B-2026-09")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-B-2026-10")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-B-2026-11")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-B-2026-12")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-C-2026-01")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-C-2026-02")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-C-2026-03")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-C-2026-04")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-C-2026-05")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-C-2026-06")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-C-2026-07")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-C-2026-08")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-C-2026-09")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-C-2026-10")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-C-2026-11")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-C-2026-12")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_vic.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_vic.getByTestId("dash-overdue-count")).toHaveText("");
    await expect(pg_vic.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=30`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-B value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-01`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=rounding value=half-up from=2026-03-10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=max-open value=3`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50 from=2026-03-16 to=2026-03-25`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C terms=3 contact=ben@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=33.33 from=2026-03-01 to=2026-03-15`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ben share=33.33`,
      `POOL_ADDED sheet=${sheet} by=uma name=P2`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P2 name=Ada share=100.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=P2 share=10.00`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Ada amount=25.00 start=2026-03-09 day=1 end=2026-04-30`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=12.50 date=2026-03-15 ref=R-1`,
      `STATEMENT sheet=${sheet} by=uma name=Ben due-total=0.00 claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=7.77 date=2026-03-01 tags=a,b`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=uma person=Ben amount=7.77 date=2026-03-01 proofs=1`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=uma person=Ben amount=12.50 date=2026-03-15 proofs=1 kind=receipt`,
      `PERSON_WATCHED sheet=${sheet} by=uma name=Ben`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=0.00`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=n/a overdue-total=0.00`,
      `PERSON_MERGED sheet=${sheet} by=vic from=Ben into=Ada`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-01`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=7.77 due-total=1.55 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=7.77 due-total=1.55 overdue-total=0.00`,
      `ALERT sheet=${sheet} by=uma name=Ada due-total=1.55`,
      `CLAIM_REDATED sheet=${sheet} by=vic person=Ada amount=7.77 date=2026-03-09 old=2026-03-01 new=2026-03-09`,
      `PERSON_HELD sheet=${sheet} by=vic name=Ada from=2026-03-20`,
      `PERSON_WATCHED sheet=${sheet} by=vic name=Ada`,
      `CLAIM_SETTLED sheet=${sheet} by=vic person=Ada amount=7.77 date=2026-03-09 number=X-1 due=1.55`,
      `NOTIFY sheet=${sheet} by=vic user=vic person=Ada number=X-1`
    ]);
    await ui.clearAsOf(pg_vic);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-C-due-total")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("consolidated-status-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("consolidated-status-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-SETTLED-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (C)");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("7.77");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("2026-03-10");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("yes");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("yes");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("ben@x");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("Ben");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText(["2026-03-10 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-approver")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-score")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-band")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-P2-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("7.77");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-03-09");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("X-1");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due-by")).toHaveText("2026-04-10");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=1.00", "OPEN by uma on 2026-04-02 due=1.55", "SETTLED by vic on 2026-04-02 due=1.55"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs")).toHaveText("1");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-tags")).toHaveText("a, b");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-shares")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-review-assigned")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-03-15");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("2.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-04-24");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=1.25"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("1");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("R-1");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-shares")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-review-assigned")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("7.77");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("watched-due-total")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_vic.getByTestId("summary-period-P2-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-status-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-SETTLED-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-void-error-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-due-total")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("tag-a-due-total")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("tag-b-due-total")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("month-2026-03-due-total")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("no");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-share")).toHaveText("66.66");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut-P1")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut-P2")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-share")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-cut")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-cut-P1")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-cut-P2")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-row-P2").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-row-P2").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_vic.getByTestId("pool-member-P2-" + p_ada).getByTestId("pool-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-member-P2-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-member-P2-" + p_ada).getByTestId("pool-cut-P1")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-member-P2-" + p_ada).getByTestId("pool-cut-P2")).toHaveText("");
    await expect(pg_vic.getByTestId("rate-month-A-2026-01")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-02")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-03")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-04")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-05")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-06")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-07")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-08")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-09")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-10")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-11")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-A-2026-12")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-B-2026-01")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-02")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-03")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-04")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-05")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-06")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-07")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-08")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-09")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-10")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-11")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-12")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-01")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-02")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-03")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-04")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-05")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-06")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-07")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-08")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-09")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-10")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-11")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-12")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("dash-pending-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("dash-review-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("dash-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("note-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("plan-row-" + pl_ada_1).getByTestId("plan-generated")).toHaveText("0");
    await expect(pg_vic.getByTestId("plan-row-" + pl_ada_1).getByTestId("plan-next-dates")).toHaveText("");
    await expect(pg_vic.getByTestId("plan-row-" + pl_ada_1).getByTestId("plan-paused")).toHaveText("no");
    await expect(pg_vic.getByTestId("plan-row-" + pl_ada_1).getByTestId("plan-change-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=30`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-B value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-01`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=rounding value=half-up from=2026-03-10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=max-open value=3`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50 from=2026-03-16 to=2026-03-25`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C terms=3 contact=ben@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=33.33 from=2026-03-01 to=2026-03-15`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ben share=33.33`,
      `POOL_ADDED sheet=${sheet} by=uma name=P2`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P2 name=Ada share=100.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=P2 share=10.00`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Ada amount=25.00 start=2026-03-09 day=1 end=2026-04-30`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=12.50 date=2026-03-15 ref=R-1`,
      `STATEMENT sheet=${sheet} by=uma name=Ben due-total=0.00 claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=7.77 date=2026-03-01 tags=a,b`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=uma person=Ben amount=7.77 date=2026-03-01 proofs=1`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=uma person=Ben amount=12.50 date=2026-03-15 proofs=1 kind=receipt`,
      `PERSON_WATCHED sheet=${sheet} by=uma name=Ben`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=0.00`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=n/a overdue-total=0.00`,
      `PERSON_MERGED sheet=${sheet} by=vic from=Ben into=Ada`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-01`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=7.77 due-total=1.55 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=7.77 due-total=1.55 overdue-total=0.00`,
      `ALERT sheet=${sheet} by=uma name=Ada due-total=1.55`,
      `CLAIM_REDATED sheet=${sheet} by=vic person=Ada amount=7.77 date=2026-03-09 old=2026-03-01 new=2026-03-09`,
      `PERSON_HELD sheet=${sheet} by=vic name=Ada from=2026-03-20`,
      `PERSON_WATCHED sheet=${sheet} by=vic name=Ada`,
      `CLAIM_SETTLED sheet=${sheet} by=vic person=Ada amount=7.77 date=2026-03-09 number=X-1 due=1.55`,
      `NOTIFY sheet=${sheet} by=vic user=vic person=Ada number=X-1`
    ]);
  });
  test("dashboard over tree scenario 2", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    await ui.setSetting(pg_uma, "clerk-limit", "3.00");
    await ui.setSetting(pg_uma, "terms", "10");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-15");
    await ui.setSetting(pg_uma, "terms-B", "3");
    await ui.setSetting(pg_uma, "pot", "100.00");
    await ui.setSetting(pg_uma, "alert-threshold", "3.00");
    await ui.setSetting(pg_uma, "escalate-after", "1");
    await ui.setSetting(pg_uma, "default-grade", "B");
    await ui.setSetting(pg_uma, "score-mid", "0");
    await ui.setSetting(pg_uma, "score-high", "1");
    await ui.setSetting(pg_uma, "score-log", "on");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00", "from": "2026-03-01"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P2", "from": "2026-03-16", "to": "2026-03-31"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "A", "contact": "ADA@X"}));
    expect(await ui.addPool(pg_uma, "P1")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ada", "share": "60.00"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ben", "share": "40.00"})).toBe(true);
    expect(await ui.addPool(pg_uma, "P2")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P2", {"member": "Ada", "share": "100.00"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "pool:P2", "share": "10.00"})).toBe(true);
    expect(await ui.addCrew(pg_uma, "C1", "Ada")).toBe(true);
    expect(await ui.editPerson(pg_uma, p_ben, {"terms": "3", "termsFrom": "2026-03-01"})).toBe(true);
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    expect(await ui.movePerson(pg_uma, p_ben, "up")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00", "from": "2026-03-16"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "7.50"})).toBe(true);
    expect(await ui.addAlias(pg_uma, p_ada, "Bee")).toBe(true);
    expect(await ui.bulkRetire(pg_uma, [p_ben, p_ada], "2026-02-10")).toBe(2);
    await ui.showRetired(pg_uma, true);
    expect(await ui.exportCsv(pg_uma)).toBe("name,grade,retired-from,due-total\nBen,A,2026-02-10,0.00\nAda,B,2026-02-10,0.00\n");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("watched-due-total")).toHaveText("0.00");
    expect(await ui.periodAction(pg_uma, "P1", "soft-close")).toBe(true);
    expect(await ui.addClaim(pg_uma, p_ben, {"amount": "20.00", "ref": "R-2"})).toBeNull();
    expect(await ui.editPerson(pg_uma, p_ben, {"grade": "A"})).toBe(true);
    expect(await ui.statementAsOf(pg_uma, p_ada, "2026-03-20")).toBe(true);
    expect(await ui.importPeople(pg_uma, "Ben,B\nFay,C,,fay@x")).toMatchObject({"added": 1, "updated": 1});
    const p_fay = await ui.personId(pg_uma, "Fay");
    expect(await ui.compareSheet(pg_uma, `${sheet}-p`)).toEqual([]);
    expect(await ui.importRates(pg_uma, "B,12.50\nC,12.50,2026-03-05")).toBe(2);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("3");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("watched-due-total")).toHaveText("0.00");
    expect(await ui.periodAction(pg_uma, "P2", "soft-close")).toBe(true);
    expect(await ui.setApprover(pg_uma, p_ben, "uma")).toBe(true);
    await ui.setToday(pg_uma, "2026-04-17");
    expect(await ui.statement(pg_uma, p_ben)).toBe(true);
    expect(await ui.addNote(pg_uma, "x")).toBe(true);
    await ui.setAsOf(pg_uma, "2026-03-05");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("2026-03-05");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_uma.getByTestId("consolidated-people-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("watched-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rate-current-A")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-current-B")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-current-C")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-01")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-02")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-03")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-04")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-05")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-06")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-07")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-08")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-09")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-10")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-11")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-12")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-01")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-02")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-03")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-04")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-05")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-06")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-07")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-08")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-09")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-10")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-11")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-12")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-01")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-02")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-03")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-04")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-05")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-06")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-07")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-08")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-09")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-10")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-11")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-12")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-overdue-count")).toHaveText("");
    await expect(pg_uma.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-B value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=100.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=escalate-after value=1`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=default-grade value=B`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-mid value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-high value=1`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-log value=on`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00 from=2026-03-01`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=60.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ben share=40.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P2`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P2 name=Ada share=100.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=P2 share=10.00`,
      `CREW_ADDED sheet=${sheet} by=uma name=C1 lead=Ada`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=A terms=3`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `PERSON_MOVED sheet=${sheet} by=uma name=Ben position=1`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00 from=2026-03-16`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `PERSON_ALIAS_ADDED sheet=${sheet} by=uma name=Ada alias=Bee`,
      `PERSON_RETIRED sheet=${sheet} by=uma name=Ben from=2026-02-10`,
      `PERSON_RETIRED sheet=${sheet} by=uma name=Ada from=2026-02-10`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=A`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0 asof=2026-03-20`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Fay grade=C contact=fay@x`,
      `ROLLUP sheet=${sheet} by=uma person=Fay claimed=0.00 due-total=n/a overdue-total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=12.50 from=2026-03-05`,
      `ROLLUP sheet=${sheet} by=uma person=Fay claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=uma period=P2 total=0.00`,
      `APPROVER_SET sheet=${sheet} by=uma name=Ben user=uma`,
      `SCORE sheet=${sheet} by=uma name=Ben score=0`,
      `SCORE sheet=${sheet} by=uma name=Ada score=0`,
      `SCORE sheet=${sheet} by=uma name=Fay score=0`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Fay due-total=0.00`,
      `STATEMENT sheet=${sheet} by=uma name=Ben due-total=0.00 claims=0`,
      `NOTE_ADDED sheet=${sheet} by=uma text=x`
    ]);
    await ui.clearAsOf(pg_uma);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_uma.getByTestId("consolidated-people-count")).toHaveText("3");
    await expect(pg_uma.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben (B)");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-date")).toHaveText("2026-04-17");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retired")).toHaveText("yes");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retired-from")).toHaveText("2026-02-10");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-active")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-contact")).toHaveText("ada@x");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-snapshot-line")).toHaveText(["2026-03-20 0.00"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-line-line")).toHaveText(["2026-04-17 0.00"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-approver")).toHaveText("uma");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-score")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-band")).toHaveText("MID");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P2-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (B)");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("2026-03-20");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("yes");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("2026-02-10");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("Bee");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText(["2026-03-20 0.00"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText(["2026-03-20 0.00", "2026-03-20 0.00"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-approver")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-score")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-band")).toHaveText("MID");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P2-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-name")).toHaveText("Fay (C)");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-terms")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-active")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-contact")).toHaveText("fay@x");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-snapshot-line")).toHaveText(["2026-03-20 0.00"]);
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-approver")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-score")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-band")).toHaveText("MID");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-period-P2-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("3");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("watched-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_uma.getByTestId("rate-current-A")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-current-B")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-current-C")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_uma.getByTestId("summary-period-P2-change")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("classic-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("110.00");
    await expect(pg_uma.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("no");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-share")).toHaveText("60.00");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut-P1")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut-P2")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-share")).toHaveText("40.00");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-cut-P1")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-cut-P2")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-share")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-cut")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-cut-P1")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-cut-P2")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-row-P2").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_uma.getByTestId("pool-row-P2").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_uma.getByTestId("pool-member-P2-" + p_ada).getByTestId("pool-share")).toHaveText("100.00");
    await expect(pg_uma.getByTestId("pool-member-P2-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-P2-" + p_ada).getByTestId("pool-cut-P1")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-P2-" + p_ada).getByTestId("pool-cut-P2")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-row-C1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_uma.getByTestId("pool-row-C1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_uma.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-share")).toHaveText("100.00");
    await expect(pg_uma.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut-P1")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut-P2")).toHaveText("");
    await expect(pg_uma.getByTestId("crew-row-C1").getByTestId("crew-lead")).toHaveText("Ada (B)");
    await expect(pg_uma.getByTestId("crew-row-C1").getByTestId("crew-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-01")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-02")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-03")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-04")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-05")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-06")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-07")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-08")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-09")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-10")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-11")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-12")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-01")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-02")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-03")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-04")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-05")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-06")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-07")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-08")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-09")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-10")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-11")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-12")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-01")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-02")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-03")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-04")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-C-2026-05")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-C-2026-06")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-C-2026-07")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-C-2026-08")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-C-2026-09")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-C-2026-10")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-C-2026-11")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-C-2026-12")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-overdue-count")).toHaveText("");
    await expect(pg_uma.getByTestId("note-line")).toHaveText(["2026-04-17 uma: x"]);
    await ui.expectAudit(sheet, [
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-B value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=100.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=escalate-after value=1`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=default-grade value=B`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-mid value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-high value=1`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-log value=on`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00 from=2026-03-01`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=60.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ben share=40.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P2`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P2 name=Ada share=100.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=P2 share=10.00`,
      `CREW_ADDED sheet=${sheet} by=uma name=C1 lead=Ada`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=A terms=3`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `PERSON_MOVED sheet=${sheet} by=uma name=Ben position=1`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00 from=2026-03-16`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `PERSON_ALIAS_ADDED sheet=${sheet} by=uma name=Ada alias=Bee`,
      `PERSON_RETIRED sheet=${sheet} by=uma name=Ben from=2026-02-10`,
      `PERSON_RETIRED sheet=${sheet} by=uma name=Ada from=2026-02-10`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=A`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0 asof=2026-03-20`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Fay grade=C contact=fay@x`,
      `ROLLUP sheet=${sheet} by=uma person=Fay claimed=0.00 due-total=n/a overdue-total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=12.50 from=2026-03-05`,
      `ROLLUP sheet=${sheet} by=uma person=Fay claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=uma period=P2 total=0.00`,
      `APPROVER_SET sheet=${sheet} by=uma name=Ben user=uma`,
      `SCORE sheet=${sheet} by=uma name=Ben score=0`,
      `SCORE sheet=${sheet} by=uma name=Ada score=0`,
      `SCORE sheet=${sheet} by=uma name=Fay score=0`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Fay due-total=0.00`,
      `STATEMENT sheet=${sheet} by=uma name=Ben due-total=0.00 claims=0`,
      `NOTE_ADDED sheet=${sheet} by=uma text=x`
    ]);
  });
  test("dashboard over tree scenario 3", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    await ui.setSetting(pg_uma, "floor", "0.50");
    await ui.setSetting(pg_uma, "grace-days", "0");
    await ui.setSetting(pg_uma, "entry-date", "2026-03-01");
    await ui.setSetting(pg_uma, "proof-threshold-A", "0.50");
    await ui.setSetting(pg_uma, "pot", "100.00");
    expect(await ui.setSettingDated(pg_uma, "rounding", "half-up", "2026-03-10", "half-up")).toBe(true);
    await ui.setSetting(pg_uma, "review-sla", "5");
    await ui.setSetting(pg_uma, "clerk-limit-B", "0.50");
    await ui.setSetting(pg_uma, "score-mid", "0");
    await ui.setSetting(pg_uma, "score-high", "1");
    await ui.setSetting(pg_uma, "score-log", "on");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "33.33", "from": "2026-03-10", "to": "2026-03-25"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B", "terms": "3"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "A", "terms": "3"}));
    expect(await ui.addCrew(pg_uma, "C1", "Ada")).toBe(true);
    expect(await ui.addCrewMember(pg_uma, "C1", "Ben")).toBe(true);
    expect(await ui.bulkGrade(pg_uma, [p_ada, p_ben], {"grade": "C", "from": "2026-02-25"})).toBe(2);
    const c_ben_0 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "4.00", "date": "2026-03-20"}));
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ben_0, "open")).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.settlePart(pg_wes, p_ben, c_ben_0, "0.01")).toBeNull();
    expect(await ui.editPerson(pg_wes, p_ada, {"terms": "20"})).toBe(true);
    expect(await ui.editPerson(pg_wes, p_ada, {"grade": "C", "gradeFrom": "2026-03-09"})).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("1.83");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("1.33");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("1.83");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("1.83");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("100.00");
    await expect(pg_wes.getByTestId("rollup-aged-0-30")).toHaveText("1.83");
    await expect(pg_wes.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("1.83");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("watched-due-total")).toHaveText("0.00");
    expect(await ui.periodAction(pg_wes, "P1", "close")).toBe(true);
    await ui.setToday(pg_wes, "2026-04-03");
    await ui.refresh(pg_uma);
    expect(await ui.addClaim(pg_uma, p_ada, {"amount": "1.00", "date": "2026-02-10", "note": "n", "ref": "R-1"})).toBeNull();
    expect(await ui.importRates(pg_uma, "C,5.00\nB,33.33,2026-03-05")).toBe(2);
    expect(await ui.statement(pg_uma, p_ben)).toBe(true);
    expect(await ui.hold(pg_uma, p_ada, {"from": "2026-03-05", "to": "2026-03-28"})).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("1.33");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("100.00");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("watched-due-total")).toHaveText("0.00");
    expect(await ui.editPerson(pg_uma, p_ada, {"grade": "C"})).toBe(true);
    expect(await ui.retire(pg_uma, p_ben, "2026-03-20")).toBe(true);
    await ui.expectAuditView(pg_uma, "Ada", [
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C`,
      `PERSON_HELD sheet=${sheet} by=uma name=Ada from=2026-03-05`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=0.00 due-total=n/a overdue-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=wes name=Ada due-total=0.00`,
      `SCORE sheet=${sheet} by=wes name=Ada score=0`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Ada grade=C`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Ada grade=C terms=20`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B terms=3`
    ]);
    await ui.setToday(pg_uma, "2026-05-11");
    expect(await ui.setApprover(pg_uma, p_ada, "vic")).toBe(true);
    expect(await ui.search(pg_uma, "a")).toEqual([`${sheet} Ada (C) n/a`]);
    await ui.setAsOf(pg_uma, "2026-03-28");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("2026-03-28");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_uma.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("consolidated-due-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("consolidated-overdue-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-C-due-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("consolidated-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-OPEN-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (C)");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("2026-03-10");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("20");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("50.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText(["2026-03-10 0.00"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText(["2026-03-10 0.00"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-approver")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-score")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-band")).toHaveText("MID");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben (C)");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-active")).toHaveText("yes");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-0-30")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-open-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-contact")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-cut-total")).toHaveText("50.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-snapshot-line")).toHaveText(["2026-03-10 1.83"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-approver")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-score")).toHaveText("-10");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-band")).toHaveText("LOW");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-amount")).toHaveText("3.99");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("1.33");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due-by")).toHaveText("2026-03-25");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=1.33", "OPEN by uma on 2026-03-10 due=1.33"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-shares")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-review-assigned")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("100.00");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("watched-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_uma.getByTestId("rate-current-A")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-current-B")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-current-C")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("summary-grade-C-due-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("summary-grade-C-active")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("classic-due-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("month-2026-03-due-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("pool-row-C1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_uma.getByTestId("pool-row-C1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_uma.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_uma.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut")).toHaveText("50.00");
    await expect(pg_uma.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut-P1")).toHaveText("50.00");
    await expect(pg_uma.getByTestId("pool-member-C1-" + p_ben).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_uma.getByTestId("pool-member-C1-" + p_ben).getByTestId("pool-cut")).toHaveText("50.00");
    await expect(pg_uma.getByTestId("pool-member-C1-" + p_ben).getByTestId("pool-cut-P1")).toHaveText("50.00");
    await expect(pg_uma.getByTestId("crew-row-C1").getByTestId("crew-lead")).toHaveText("Ada (C)");
    await expect(pg_uma.getByTestId("crew-row-C1").getByTestId("crew-due-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("rate-month-A-2026-01")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-02")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-03")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-04")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-05")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-06")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-07")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-08")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-09")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-10")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-11")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-12")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-01")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-02")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-03")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-04")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-05")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-06")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-07")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-08")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-09")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-10")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-11")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-12")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-C-2026-01")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-02")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-03")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-04")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-05")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-06")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-07")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-08")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-09")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-10")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-11")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-12")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-overdue-count")).toHaveText("");
    await expect(pg_uma.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-A value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=100.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=rounding value=half-up from=2026-03-10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=5`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit-B value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-mid value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-high value=1`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-log value=on`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=33.33 from=2026-03-10 to=2026-03-25`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CREW_ADDED sheet=${sheet} by=uma name=C1 lead=Ada`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Ben`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=C`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=4.00 date=2026-03-20`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ben amount=4.00 date=2026-03-20`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=4.00 due-total=1.33 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=4.00 due-total=1.33 overdue-total=0.00`,
      `CLAIM_SPLIT sheet=${sheet} by=wes person=Ben amount=3.99 date=2026-03-20 into=`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ben amount=0.01 date=2026-03-20`,
      `ROLLUP sheet=${sheet} by=wes person=Ben claimed=4.00 due-total=1.83 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=4.00 due-total=1.83 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Ada grade=C terms=20`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Ada grade=C`,
      `PERIOD_CLOSED sheet=${sheet} by=wes period=P1 total=0.00`,
      `SCORE sheet=${sheet} by=wes name=Ada score=0`,
      `SCORE sheet=${sheet} by=wes name=Ben score=0`,
      `SNAPSHOT sheet=${sheet} by=wes name=Ada due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=wes name=Ben due-total=1.83`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=0.00 due-total=n/a overdue-total=0.00`,
      `ROLLUP sheet=${sheet} by=wes person=Ben claimed=4.00 due-total=1.83 overdue-total=1.83`,
      `TOTALS sheet=${sheet} by=wes claimed-total=4.00 due-total=1.83 overdue-total=1.83`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=33.33 from=2026-03-05`,
      `STATEMENT sheet=${sheet} by=uma name=Ben due-total=1.83 claims=2`,
      `PERSON_HELD sheet=${sheet} by=uma name=Ada from=2026-03-05`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C`,
      `PERSON_RETIRED sheet=${sheet} by=uma name=Ben from=2026-03-20`,
      `SCORE sheet=${sheet} by=uma name=Ada score=0`,
      `SCORE sheet=${sheet} by=uma name=Ben score=-10`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=n/a`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=1.83`,
      `APPROVER_SET sheet=${sheet} by=uma name=Ada user=vic`
    ]);
    await ui.clearAsOf(pg_uma);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_uma.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("consolidated-due-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("consolidated-overdue-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-OPEN-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (C)");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("2026-03-10");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("yes");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("20");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("100.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText(["2026-03-10 0.00", "2026-04-03 n/a"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText(["2026-03-10 0.00"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-approver")).toHaveText("vic");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-score")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-band")).toHaveText("MID");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben)).toHaveCount(0);
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("100.00");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("watched-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_uma.getByTestId("rate-current-A")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-current-B")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-current-C")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("classic-due-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("month-2026-03-due-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("pool-row-C1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_uma.getByTestId("pool-row-C1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_uma.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_uma.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut")).toHaveText("100.00");
    await expect(pg_uma.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut-P1")).toHaveText("50.00");
    await expect(pg_uma.getByTestId("pool-member-C1-" + p_ben).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_uma.getByTestId("pool-member-C1-" + p_ben).getByTestId("pool-cut")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("pool-member-C1-" + p_ben).getByTestId("pool-cut-P1")).toHaveText("50.00");
    await expect(pg_uma.getByTestId("crew-row-C1").getByTestId("crew-lead")).toHaveText("Ada (C)");
    await expect(pg_uma.getByTestId("crew-row-C1").getByTestId("crew-due-total")).toHaveText("1.83");
    await expect(pg_uma.getByTestId("rate-month-A-2026-01")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-02")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-03")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-04")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-05")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-06")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-07")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-08")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-09")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-10")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-11")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-12")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-01")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-02")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-03")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-04")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-05")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-06")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-07")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-08")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-09")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-10")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-11")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-12")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-C-2026-01")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-02")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-03")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-04")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-05")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-06")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-07")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-08")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-09")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-10")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-11")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-C-2026-12")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-overdue-count")).toHaveText("");
    await expect(pg_uma.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-A value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=100.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=rounding value=half-up from=2026-03-10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=5`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit-B value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-mid value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-high value=1`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-log value=on`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=33.33 from=2026-03-10 to=2026-03-25`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CREW_ADDED sheet=${sheet} by=uma name=C1 lead=Ada`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Ben`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=C`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=4.00 date=2026-03-20`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ben amount=4.00 date=2026-03-20`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=4.00 due-total=1.33 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=4.00 due-total=1.33 overdue-total=0.00`,
      `CLAIM_SPLIT sheet=${sheet} by=wes person=Ben amount=3.99 date=2026-03-20 into=`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ben amount=0.01 date=2026-03-20`,
      `ROLLUP sheet=${sheet} by=wes person=Ben claimed=4.00 due-total=1.83 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=4.00 due-total=1.83 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Ada grade=C terms=20`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Ada grade=C`,
      `PERIOD_CLOSED sheet=${sheet} by=wes period=P1 total=0.00`,
      `SCORE sheet=${sheet} by=wes name=Ada score=0`,
      `SCORE sheet=${sheet} by=wes name=Ben score=0`,
      `SNAPSHOT sheet=${sheet} by=wes name=Ada due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=wes name=Ben due-total=1.83`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=0.00 due-total=n/a overdue-total=0.00`,
      `ROLLUP sheet=${sheet} by=wes person=Ben claimed=4.00 due-total=1.83 overdue-total=1.83`,
      `TOTALS sheet=${sheet} by=wes claimed-total=4.00 due-total=1.83 overdue-total=1.83`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=33.33 from=2026-03-05`,
      `STATEMENT sheet=${sheet} by=uma name=Ben due-total=1.83 claims=2`,
      `PERSON_HELD sheet=${sheet} by=uma name=Ada from=2026-03-05`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C`,
      `PERSON_RETIRED sheet=${sheet} by=uma name=Ben from=2026-03-20`,
      `SCORE sheet=${sheet} by=uma name=Ada score=0`,
      `SCORE sheet=${sheet} by=uma name=Ben score=-10`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=n/a`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=1.83`,
      `APPROVER_SET sheet=${sheet} by=uma name=Ada user=vic`
    ]);
  });
});
