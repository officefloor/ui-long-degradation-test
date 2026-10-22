import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("period comparison", () => {
  test("period comparison", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    expect(await ui.addPeriod(pg_uma, {"name": "P2", "from": "2026-03-11", "to": "2026-03-20"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-10"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P3", "from": "2026-03-21", "to": "2026-03-31"})).toBe(true);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.00", "date": "2026-03-05"}));
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "30.00", "date": "2026-03-15"}));
    const c_ada_2 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "5.00", "date": "2026-03-25"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_1, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_2, "open")).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P3").getByTestId("period-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("period-row-P3").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P3-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_uma.getByTestId("summary-period-P2-change")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P3-change")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("3");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("0");
    expect(await ui.periodAction(pg_uma, "P1", "close")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00"})).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_2, "void")).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_uma.getByTestId("period-row-P3").getByTestId("period-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("period-row-P3").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("8.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P3-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_uma.getByTestId("summary-period-P2-change")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P3-change")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("1");
    await ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-11 to=2026-03-20`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-10`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P3 from=2026-03-21 to=2026-03-31`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-03-05`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=30.00 date=2026-03-15`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=5.00 date=2026-03-25`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-03-05 number=FY2026-1`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=10.00 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=10.00 due-total=1.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=30.00 date=2026-03-15 number=FY2026-2`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=40.00 due-total=4.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=40.00 due-total=4.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=5.00 date=2026-03-25 number=FY2026-3`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=45.00 due-total=5.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=45.00 due-total=5.00 overdue-total=0.00`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=45.00 due-total=9.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=45.00 due-total=9.00 overdue-total=0.00`,
      `CLAIM_VOIDED sheet=${sheet} by=uma person=Ada amount=5.00 date=2026-03-25 number=FY2026-3`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=40.00 due-total=8.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=40.00 due-total=8.00 overdue-total=0.00`
    ]);
  });
  test("period comparison scenario 1", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    await ui.setSetting(pg_uma, "terms", "10");
    await ui.setSetting(pg_uma, "late-pct", "10.00");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-15");
    await ui.setSetting(pg_uma, "terms-B", "20");
    await ui.setSetting(pg_uma, "cap", "2.00");
    await ui.setSetting(pg_uma, "proof-threshold", "1.00");
    expect(await ui.setRole(pg_uma, "vic", "viewer")).toBe(true);
    await ui.setSetting(pg_uma, "grace-days", "3");
    expect(await ui.addHoliday(pg_uma, "2026-03-13")).toBe(true);
    expect(await ui.saveTemplate(pg_uma, {"name": "T1", "amount": "0.04", "note": "tpl"})).toBe(true);
    await ui.setSetting(pg_uma, "pot", "33.33");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "20.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "7.50", "from": "2026-03-16", "to": "2026-03-25"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B", "terms": "3", "contact": " Ada@x "}));
    expect(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "A", "contact": " Ada@x "})).toBeNull();
    expect(await ui.watch(pg_uma, p_ben, true)).toBe(true);
    expect(await ui.statement(pg_uma, p_ben)).toBe(true);
    const c_ben_0 = ui.must(await ui.quickAdd(pg_uma, {"name": "Ben", "amount": "12.50"}));
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.claimAction(pg_vic, c_ben_0, "open")).toBe(false);
    expect(await ui.importRates(pg_vic, "B,10.00\nA,7.50,2026-03-05")).toBeNull();
    expect(await ui.addProof(pg_vic, c_ben_0)).toBe(false);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("2.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    expect(await ui.editClaim(pg_vic, c_ben_0, {"amount": "25.00"})).toBe(false);
    expect(await ui.setTodayTry(pg_vic, "2026-04-04")).toBe(false);
    expect(await ui.hold(pg_vic, p_ada, {"from": "2026-03-01", "to": "2026-03-05"})).toBe(false);
    expect(await ui.addClaim(pg_vic, p_ben, {"amount": "25.00", "date": "2026-03-05", "note": "n", "ref": "R-2"})).toBeNull();
    expect(await ui.ratePreview(pg_vic, "C", "7.50")).toEqual({ count: 0, diff: "0.00" });
    expect(await ui.addPatron(pg_vic, p_ben, "Ada")).toBe(false);
    expect(await ui.statement(pg_vic, p_ada)).toBe(false);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("2.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    expect(await ui.claimAction(pg_vic, c_ben_0, "void")).toBe(false);
    expect(await ui.bulkGrade(pg_vic, [p_ben, p_ada], {"grade": "C"})).toBe(0);
    expect(await ui.setRate(pg_vic, {"grade": "A", "pct": "10.00"})).toBe(false);
    expect(await ui.claimAction(pg_vic, c_ben_0, "open")).toBe(false);
    expect(await ui.claimAction(pg_vic, c_ben_0, "open")).toBe(false);
    expect(await ui.editClaim(pg_vic, c_ben_0, {"amount": "99.95"})).toBe(false);
    expect(await ui.statement(pg_vic, p_ben)).toBe(false);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("2.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await ui.setAsOf(pg_vic, "2026-03-05");
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("2026-03-05");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
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
    await ui.expectAudit(sheet, [
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-B value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.00`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=3`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=0.04 note=tpl`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50 from=2026-03-16 to=2026-03-25`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B terms=3 contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_WATCHED sheet=${sheet} by=uma name=Ben`,
      `STATEMENT sheet=${sheet} by=uma name=Ben due-total=0.00 claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=12.50 date=2026-03-20`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`
    ]);
    await ui.clearAsOf(pg_vic);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben (B)");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-statement-date")).toHaveText("2026-03-20");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-terms")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-active")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-contact")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-amount")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("2.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due-by")).toHaveText("2026-04-17");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-20 due=2.50"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (B)");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("2026-03-20");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("ada@x");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("month-2026-03-due-total")).toHaveText("0.00");
    await ui.expectAudit(sheet, [
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-B value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.00`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=3`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=0.04 note=tpl`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50 from=2026-03-16 to=2026-03-25`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B terms=3 contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_WATCHED sheet=${sheet} by=uma name=Ben`,
      `STATEMENT sheet=${sheet} by=uma name=Ben due-total=0.00 claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=12.50 date=2026-03-20`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`
    ]);
  });
  test("period comparison scenario 2", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "terms", "30");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-15");
    await ui.setSetting(pg_uma, "terms-B", "20");
    await ui.setSetting(pg_uma, "cap", "5.00");
    await ui.setSetting(pg_uma, "perm-settle", "clerk");
    expect(await ui.addHoliday(pg_uma, "2026-03-13")).toBe(true);
    expect(await ui.addHoliday(pg_uma, "2026-03-24")).toBe(true);
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "12.50"})).toBe(true);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "A"}));
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C"}));
    const c_cam_0 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "10.25"}));
    expect(await ui.claimAction(pg_uma, c_cam_0, "open")).toBe(true);
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    await ui.setSetting(pg_uma, "pot", "33.33");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "5.00", "from": "2026-03-16"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "C", "terms": "3"}));
    expect(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B", "contact": " Ada@x "})).toBeNull();
    expect(await ui.pasteClaims(pg_uma, "Ben,10.25,2026-03-05,a, b\nBen,20.00,,a, b\nBen,4.00,,a, b")).toBe(3);
    const c_ben_0 = await ui.claimAt(pg_uma, p_ben, 0);
    const c_ben_1 = await ui.claimAt(pg_uma, p_ben, 1);
    const c_ben_2 = await ui.claimAt(pg_uma, p_ben, 2);
    expect(await ui.setSettingDated(pg_uma, "floor", "3.00", "2026-03-20", "")).toBe(true);
    expect(await ui.editClaim(pg_uma, c_ben_0, {"date": "2026-04-02"})).toBe(false);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.claimAction(pg_wes, c_ben_1, "open")).toBe(false);
    expect(await ui.statementAsOf(pg_wes, p_ben, "2026-03-05")).toBe(false);
    expect(await ui.setRate(pg_wes, {"grade": "B", "pct": "7.50"})).toBe(true);
    expect(await ui.claimAction(pg_wes, c_ben_2, "open")).toBe(false);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("34.25");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("4.78");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due")).toHaveText("2.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("1.28");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("34.25");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("4.78");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("4.78");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("3");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("4.78");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    expect(await ui.editInline(pg_wes, c_ben_0, "4.00")).toBe(false);
    expect(await ui.setSettingDated(pg_wes, "proof-threshold", "", "2026-04-02", "")).toBe(true);
    const c_ben_3 = ui.must(await ui.split(pg_wes, p_ben, c_ben_1, "1.00"));
    expect(await ui.claimEditOpen(pg_wes, c_ben_0)).toBe(false);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.claimEditOpen(pg_vic, c_ben_0)).toBe(false);
    await ui.refresh(pg_wes);
    expect(await ui.claimEditSave(pg_wes, c_ben_0, {"amount": "25.00"})).toBe(false);
    expect(await ui.watch(pg_wes, p_ben, true)).toBe(true);
    expect(await ui.addAlias(pg_wes, p_ben, "Bee")).toBe(true);
    expect(await ui.claimAction(pg_wes, c_ben_0, "open")).toBe(false);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("34.25");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due")).toHaveText("2.38");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("1.28");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("34.25");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("5.66");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("4");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    const c_ben_4 = ui.must(await ui.addClaim(pg_wes, p_ben, {"amount": "99.95", "date": "2026-04-02", "tags": "a"}));
    expect(await ui.setSettingDated(pg_wes, "clerk-limit", "", "2026-02-10", "")).toBe(true);
    await ui.setSetting(pg_wes, "policy-date", "2026-03-15");
    expect(await ui.periodAction(pg_wes, "P1", "soft-close")).toBe(true);
    await ui.setToday(pg_wes, "2026-03-21");
    expect(await ui.statement(pg_wes, p_ben)).toBe(true);
    const c_ben_5 = ui.must(await ui.addClaim(pg_wes, p_ben, {"amount": "1.00", "date": "2026-03-15"}));
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("34.25");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-due")).toHaveText("12.49");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due")).toHaveText("2.38");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("1.28");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("34.25");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("4");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("5.66");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("5.66");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("4");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("5.66");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await ui.setAsOf(pg_wes, "2026-03-09");
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("2026-03-09");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=30`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-B value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-settle value=clerk`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-24`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00 from=2026-03-16`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=C terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=10.25 date=2026-03-05`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ben amount=10.25 date=2026-03-05 number=FY2026-2`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=10.25 due-total=1.28 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=10.25 due-total=1.28 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=20.00 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ben amount=20.00 date=2026-03-10 number=FY2026-3`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=30.25 due-total=3.78 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=30.25 due-total=3.78 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=4.00 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ben amount=4.00 date=2026-03-10 number=FY2026-4`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=34.25 due-total=4.78 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=34.25 due-total=4.78 overdue-total=0.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=3.00 from=2026-03-20`,
      `RATE_SET sheet=${sheet} by=wes grade=B rate=7.50`,
      `SETTING_CHANGED sheet=${sheet} by=wes key=proof-threshold value= from=2026-04-02`,
      `CLAIM_SPLIT sheet=${sheet} by=wes person=Ben amount=19.00 date=2026-03-10 number=FY2026-3 into=FY2026-5`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ben amount=1.00 date=2026-03-10 number=FY2026-5`,
      `ROLLUP sheet=${sheet} by=wes person=Ben claimed=34.25 due-total=5.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=34.25 due-total=5.00 overdue-total=0.00`,
      `PERSON_WATCHED sheet=${sheet} by=wes name=Ben`,
      `PERSON_ALIAS_ADDED sheet=${sheet} by=wes name=Ben alias=Bee`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=99.95 date=2026-04-02 tags=a`,
      `SETTING_CHANGED sheet=${sheet} by=wes key=clerk-limit value= from=2026-02-10`,
      `SETTING_CHANGED sheet=${sheet} by=wes key=policy-date value=2026-03-15`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=wes period=P1 total=1.28`,
      `SNAPSHOT sheet=${sheet} by=wes name=Ben due-total=5.00`,
      `ROLLUP sheet=${sheet} by=wes person=Ben claimed=34.25 due-total=5.00 overdue-total=5.66`,
      `TOTALS sheet=${sheet} by=wes claimed-total=34.25 due-total=5.00 overdue-total=5.66`,
      `STATEMENT sheet=${sheet} by=wes name=Ben due-total=5.00 claims=4`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=1.00 date=2026-03-15`
    ]);
    await ui.clearAsOf(pg_wes);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("5.66");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben (C)");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("34.25");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-stated-total")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-statement-date")).toHaveText("2026-03-21");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-count")).toHaveText("4");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-total")).toHaveText("5.66");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-excess")).toHaveText("0.66");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-watched")).toHaveText("yes");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-active")).toHaveText("yes");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aged-0-30")).toHaveText("5.66");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-open-total")).toHaveText("5.66");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-contact")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aliases")).toHaveText("Bee");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-due-total")).toHaveText("1.28");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-amount")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-date")).toHaveText("2026-03-15");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-due-by")).toHaveText("2026-03-18");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-03-21 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_5).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-amount")).toHaveText("99.95");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-date")).toHaveText("2026-04-02");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-due")).toHaveText("12.49");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-due-by")).toHaveText("2026-04-07");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-03-10 due=12.49"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-tags")).toHaveText("a");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_4).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-amount")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-date")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-note")).toHaveText("a, b");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-number")).toHaveText("FY2026-5");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-opened-by")).toHaveText("wes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-due-by")).toHaveText("2026-03-16");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-log-line")).toHaveText(["OPEN by wes on 2026-03-10 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-split-from")).toHaveText("FY2026-3");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-amount")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-date")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-note")).toHaveText("a, b");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-number")).toHaveText("FY2026-4");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-due-by")).toHaveText("2026-03-16");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=1.00", "OPEN by uma on 2026-03-10 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-amount")).toHaveText("19.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-date")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-note")).toHaveText("a, b");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due")).toHaveText("2.38");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-number")).toHaveText("FY2026-3");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due-by")).toHaveText("2026-03-16");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=2.50", "OPEN by uma on 2026-03-10 due=2.50"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-amount")).toHaveText("10.25");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-note")).toHaveText("a, b");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("1.28");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-number")).toHaveText("FY2026-2");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due-by")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=1.28", "OPEN by uma on 2026-03-10 due=1.28"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("34.25");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("4");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("5.66");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("5.66");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("4");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("5.66");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("1.28");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-period-P1-due-total")).toHaveText("1.28");
    await expect(pg_wes.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("4");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("tag-a-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("month-2026-03-due-total")).toHaveText("5.66");
    await expect(pg_wes.getByTestId("month-2026-04-due-total")).toHaveText("0.00");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=30`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-B value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-settle value=clerk`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-24`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00 from=2026-03-16`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=C terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=10.25 date=2026-03-05`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ben amount=10.25 date=2026-03-05 number=FY2026-2`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=10.25 due-total=1.28 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=10.25 due-total=1.28 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=20.00 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ben amount=20.00 date=2026-03-10 number=FY2026-3`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=30.25 due-total=3.78 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=30.25 due-total=3.78 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=4.00 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ben amount=4.00 date=2026-03-10 number=FY2026-4`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=34.25 due-total=4.78 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=34.25 due-total=4.78 overdue-total=0.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=3.00 from=2026-03-20`,
      `RATE_SET sheet=${sheet} by=wes grade=B rate=7.50`,
      `SETTING_CHANGED sheet=${sheet} by=wes key=proof-threshold value= from=2026-04-02`,
      `CLAIM_SPLIT sheet=${sheet} by=wes person=Ben amount=19.00 date=2026-03-10 number=FY2026-3 into=FY2026-5`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ben amount=1.00 date=2026-03-10 number=FY2026-5`,
      `ROLLUP sheet=${sheet} by=wes person=Ben claimed=34.25 due-total=5.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=34.25 due-total=5.00 overdue-total=0.00`,
      `PERSON_WATCHED sheet=${sheet} by=wes name=Ben`,
      `PERSON_ALIAS_ADDED sheet=${sheet} by=wes name=Ben alias=Bee`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=99.95 date=2026-04-02 tags=a`,
      `SETTING_CHANGED sheet=${sheet} by=wes key=clerk-limit value= from=2026-02-10`,
      `SETTING_CHANGED sheet=${sheet} by=wes key=policy-date value=2026-03-15`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=wes period=P1 total=1.28`,
      `SNAPSHOT sheet=${sheet} by=wes name=Ben due-total=5.00`,
      `ROLLUP sheet=${sheet} by=wes person=Ben claimed=34.25 due-total=5.00 overdue-total=5.66`,
      `TOTALS sheet=${sheet} by=wes claimed-total=34.25 due-total=5.00 overdue-total=5.66`,
      `STATEMENT sheet=${sheet} by=wes name=Ben due-total=5.00 claims=4`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=1.00 date=2026-03-15`
    ]);
  });
  test("period comparison scenario 3", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-04-05");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "late-pct", "10.00");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-05");
    await ui.setSetting(pg_uma, "terms-C", "20");
    await ui.setSetting(pg_uma, "proof-threshold", "3.00");
    await ui.setSetting(pg_uma, "perm-open", "steward");
    expect(await ui.addHoliday(pg_uma, "2026-04-03")).toBe(true);
    expect(await ui.addHoliday(pg_uma, "2026-03-24")).toBe(true);
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "12.50"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "C"}));
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    await ui.setSetting(pg_uma, "pot", "7.77");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00", "from": "2026-03-10", "to": "2026-03-12"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P2", "from": "2026-03-16", "to": "2026-03-31"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "A", "terms": "3"}));
    expect(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"})).toBeNull();
    expect(await ui.periodAction(pg_uma, "P2", "close")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00", "from": "2026-03-10"})).toBe(true);
    expect(await ui.pasteClaims(pg_uma, "Ben,0.40,2026-03-28,paste\nBen,7.77,,paste\nBen,10.25,2026-02-25,a, b")).toBeNull();
    expect(await ui.hold(pg_uma, p_ben, {"from": "2026-02-25"})).toBe(true);
    expect(await ui.statementAsOf(pg_uma, p_ben, "2026-03-05")).toBe(false);
    expect(await ui.addHoliday(pg_uma, "2026-04-06")).toBe(true);
    expect(await ui.exportCsv(pg_uma)).toBe("name,grade,retired-from,due-total\nBen,A,,0.00\n");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await ui.setToday(pg_uma, "2026-04-19");
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.periodAction(pg_wes, "P2", "reopen")).toBe(true);
    expect(await ui.statement(pg_wes, p_ben)).toBe(true);
    await ui.refresh(pg_wes);
    expect(await ui.unstate(pg_wes, p_ben)).toBe(true);
    expect(await ui.statement(pg_wes, p_ben)).toBe(true);
    expect(await ui.setRate(pg_wes, {"grade": "C", "pct": "5.00", "from": "2026-03-16"})).toBe(true);
    expect(await ui.statementAsOf(pg_wes, p_ben, "2026-03-01")).toBe(false);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    expect(await ui.watch(pg_wes, p_ben, true)).toBe(true);
    expect(await ui.retire(pg_wes, p_ben, "2026-03-28")).toBe(true);
    await ui.showRetired(pg_wes, true);
    expect(await ui.periodAction(pg_wes, "P2", "close")).toBe(true);
    expect(await ui.statement(pg_wes, p_ben)).toBe(true);
    expect(await ui.periodAction(pg_wes, "P1", "close")).toBe(true);
    expect(await ui.watch(pg_wes, p_ben, false)).toBe(true);
    expect(await ui.ratePreview(pg_wes, "A", "12.50")).toEqual({ count: 0, diff: "0.00" });
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await ui.refresh(pg_wes);
    expect(await ui.archive(pg_wes)).toBe(true);
    expect(await ui.addClaim(pg_wes, p_ben, {"amount": "4.00"})).toBeNull();
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("yes");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben (A)");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-statement-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-statement-date")).toHaveText("2026-04-19");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-retired")).toHaveText("yes");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-retired-from")).toHaveText("2026-03-28");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-hold")).toHaveText("yes");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-active")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-contact")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_wes.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_wes.getByTestId("summary-period-P2-change")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-open value=steward`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-03`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-24`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=7.77`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00 from=2026-03-10 to=2026-03-12`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P2 total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00 from=2026-03-10`,
      `PERSON_HELD sheet=${sheet} by=uma name=Ben from=2026-02-25`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-06`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=0.00`,
      `PERIOD_REOPENED sheet=${sheet} by=wes period=P2`,
      `STATEMENT sheet=${sheet} by=wes name=Ben due-total=0.00 claims=0`,
      `STATEMENT_CANCELLED sheet=${sheet} by=wes name=Ben due-total=0.00`,
      `STATEMENT sheet=${sheet} by=wes name=Ben due-total=0.00 claims=0`,
      `RATE_SET sheet=${sheet} by=wes grade=C rate=5.00 from=2026-03-16`,
      `PERSON_WATCHED sheet=${sheet} by=wes name=Ben`,
      `PERSON_RETIRED sheet=${sheet} by=wes name=Ben from=2026-03-28`,
      `PERIOD_CLOSED sheet=${sheet} by=wes period=P2 total=0.00`,
      `STATEMENT sheet=${sheet} by=wes name=Ben due-total=0.00 claims=0`,
      `PERIOD_CLOSED sheet=${sheet} by=wes period=P1 total=0.00`,
      `PERSON_UNWATCHED sheet=${sheet} by=wes name=Ben`,
      `SHEET_ARCHIVED sheet=${sheet} by=wes`
    ]);
  });
});
