import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("quarterly periods", () => {
  test("quarterly periods", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-05-01", "to": "2026-05-10"})).toBe(true);
    expect(await ui.generateQuarters(pg_uma, "2026")).toBe(3);
    expect(await ui.generateQuarters(pg_uma, "x")).toBeNull();
    expect(await ui.generateQuarters(pg_uma, "2026")).toBe(0);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.00", "date": "2026-02-15"}));
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "20.00", "date": "2026-09-30"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_1, "open")).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("2026-Q4");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("2026-Q1");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-2026-Q1").getByTestId("period-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("period-row-2026-Q1").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-2026-Q1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-2026-Q1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-2026-Q1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-2026-Q3").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-2026-Q3").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-2026-Q3").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-2026-Q3").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-2026-Q3").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-2026-Q4").getByTestId("period-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("period-row-2026-Q4").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-2026-Q4").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-2026-Q4").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-2026-Q4").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("3.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2026-Q1-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("summary-period-2026-Q3-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2026-Q4-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("summary-period-2026-Q1-change")).toHaveText("");
    await expect(pg_uma.getByTestId("summary-period-P1-change")).toHaveText("-1.00");
    await expect(pg_uma.getByTestId("summary-period-2026-Q3-change")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2026-Q4-change")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("classic-period-2026-Q1-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("classic-period-2026-Q3-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("classic-period-2026-Q4-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("classic-due-total")).toHaveText("3.00");
    await ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-05-01 to=2026-05-10`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-Q1 from=2026-01-01 to=2026-03-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-Q3 from=2026-07-01 to=2026-09-30`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-Q4 from=2026-10-01 to=2026-12-31`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-02-15`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=20.00 date=2026-09-30`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-02-15`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=10.00 due-total=1.00 overdue-total=1.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=10.00 due-total=1.00 overdue-total=1.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=20.00 date=2026-09-30`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=30.00 due-total=3.00 overdue-total=1.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=30.00 due-total=3.00 overdue-total=1.00`
    ]);
  });
  test("quarterly periods scenario 1", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "clerk-limit", "1.50");
    await ui.setSetting(pg_uma, "terms", "10");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-05");
    await ui.setSetting(pg_uma, "terms-C", "3");
    expect(await ui.setRole(pg_uma, "vic", "viewer")).toBe(true);
    await ui.setSetting(pg_uma, "grace-days", "0");
    await ui.setSetting(pg_uma, "note-threshold", "1.00");
    await ui.setSetting(pg_uma, "grace-B", "5");
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "10.00"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "A"}));
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B"}));
    const c_ben_0 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "4.00"}));
    expect(await ui.claimAction(pg_uma, c_ben_0, "open")).toBe(true);
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    expect(await ui.saveTemplate(pg_uma, {"name": "T1", "amount": "10.35", "note": "tpl"})).toBe(true);
    await ui.setSetting(pg_uma, "review-threshold", "4.00");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "5.00"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P2", "from": "2026-03-16", "to": "2026-03-31"})).toBe(true);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "C", "contact": " Ada@x ", "tags": "c"}));
    expect(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"})).toBeNull();
    expect(await ui.editPerson(pg_uma, p_cam, {"terms": "3", "termsFrom": "2026-03-01"})).toBe(true);
    expect(await ui.retire(pg_uma, p_cam, "2026-03-15")).toBe(true);
    await ui.showRetired(pg_uma, true);
    expect(await ui.editPerson(pg_uma, p_cam, {"grade": "B", "gradeFrom": "2026-02-10"})).toBe(true);
    expect(await ui.inlineGrade(pg_uma, p_cam, "A")).toBe(true);
    expect(await ui.statement(pg_uma, p_cam)).toBe(true);
    expect(await ui.editPerson(pg_uma, p_cam, {"grade": "C", "gradeFrom": "2026-04-02"}, "A")).toBe(true);
    expect(await ui.statement(pg_uma, p_cam)).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_cam)).toHaveCount(0);
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("1");
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
    await ui.showRetired(pg_vic, true);
    expect(await ui.addClaimTwice(pg_vic, p_cam, {"amount": "0.40", "date": "2026-03-09"})).toBeNull();
    expect(await ui.addClaim(pg_vic, p_cam, {"amount": "0.40", "date": "2026-03-05", "tags": " c "})).toBeNull();
    expect(await ui.setSettingDated(pg_vic, "cap", "2.00", "2026-03-20", "")).toBe(false);
    expect(await ui.quickAdd(pg_vic, {"name": "Dot", "amount": "7.77"})).toBeNull();
    expect(await ui.ratePreview(pg_vic, "B", "12.50")).toEqual({ count: 0, diff: "0.00" });
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    await ui.showRetired(pg_wes, true);
    expect(await ui.flag(pg_wes, p_cam, "late", "2026-04-30")).toBe(true);
    expect(await ui.statement(pg_wes, p_cam)).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
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
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    const c_dot_0 = ui.must(await ui.quickAdd(pg_wes, {"name": "Dot", "amount": "10.35"}));
    const p_dot = await ui.personId(pg_wes, "Dot");
    expect(await ui.setRate(pg_wes, {"grade": "C", "pct": "5.00", "from": "2026-03-25"})).toBe(true);
    expect(await ui.addProof(pg_wes, c_dot_0)).toBe(true);
    expect(await ui.claimAction(pg_wes, c_dot_0, "open")).toBe(true);
    expect(await ui.exportCsv(pg_wes)).toBe("name,grade,retired-from,due-total\nCam,A,2026-03-15,0.00\nDot,A,,1.00\n");
    await ui.refresh(pg_vic);
    expect(await ui.settlePart(pg_vic, p_dot, c_dot_0, "4.00")).toBeNull();
    await ui.setAsOf(pg_vic, "2026-03-09");
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("2026-03-09");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
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
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-crew-due-total")).toHaveText("");
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
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=1.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=3`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-B value=5`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=10.35 note=tpl`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-threshold value=4.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=C terms=3`,
      `PERSON_RETIRED sheet=${sheet} by=uma name=Cam from=2026-03-15`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=B`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=A`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=0.00 claims=0`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=A`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=0.00 claims=0`,
      `PERSON_FLAGGED sheet=${sheet} by=wes name=Cam reason=late until=2026-04-30`,
      `STATEMENT sheet=${sheet} by=wes name=Cam due-total=0.00 claims=0`,
      `PERSON_ADDED sheet=${sheet} by=wes name=Dot grade=A`,
      `ROLLUP sheet=${sheet} by=wes person=Dot claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Dot amount=10.35 date=2026-03-10`,
      `RATE_SET sheet=${sheet} by=wes grade=C rate=5.00 from=2026-03-25`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=wes person=Dot amount=10.35 date=2026-03-10 proofs=1`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Dot amount=10.35 date=2026-03-10`,
      `ROLLUP sheet=${sheet} by=wes person=Dot claimed=10.35 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=10.35 due-total=1.00 overdue-total=0.00`
    ]);
    await ui.clearAsOf(pg_vic);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (A)");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-date")).toHaveText("2026-03-10");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retired")).toHaveText("yes");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retired-from")).toHaveText("2026-03-15");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-active")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-contact")).toHaveText("ada@x");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("c");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-line-line")).toHaveText(["2026-03-10 0.00", "2026-03-10 0.00", "2026-03-10 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-flag-shown")).toHaveText("late");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-P2-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-name")).toHaveText("Dot (A)");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-claimed")).toHaveText("10.35");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-terms")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-active")).toHaveText("yes");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-aged-0-30")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-open-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-contact")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-period-P2-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-period-P2-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-amount")).toHaveText("10.35");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-date")).toHaveText("2026-03-10");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-opened-by")).toHaveText("wes");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-period")).toHaveText("P2");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-due-by")).toHaveText("2026-03-24");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-03-10 due=1.00", "OPEN by wes on 2026-03-10 due=1.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-proofs")).toHaveText("1");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-proofs-receipt")).toHaveText("1");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("10.35");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-P2-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_vic.getByTestId("summary-period-P2-change")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-OPEN-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-P2-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("classic-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("tag-c-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("month-2026-03-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-01")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-02")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-03")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-04")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-05")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-06")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-07")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-08")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-09")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-10")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-11")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-12")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-01")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-02")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-03")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-04")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-05")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-06")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-07")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-08")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-09")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-10")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-11")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-12")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-01")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-02")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-03")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-04")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-05")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-06")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-07")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-08")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-09")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-10")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-11")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-12")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_vic.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_vic.getByTestId("dash-overdue-count")).toHaveText("");
    await expect(pg_vic.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=1.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=3`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-B value=5`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=10.35 note=tpl`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-threshold value=4.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=C terms=3`,
      `PERSON_RETIRED sheet=${sheet} by=uma name=Cam from=2026-03-15`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=B`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=A`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=0.00 claims=0`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=A`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=0.00 claims=0`,
      `PERSON_FLAGGED sheet=${sheet} by=wes name=Cam reason=late until=2026-04-30`,
      `STATEMENT sheet=${sheet} by=wes name=Cam due-total=0.00 claims=0`,
      `PERSON_ADDED sheet=${sheet} by=wes name=Dot grade=A`,
      `ROLLUP sheet=${sheet} by=wes person=Dot claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Dot amount=10.35 date=2026-03-10`,
      `RATE_SET sheet=${sheet} by=wes grade=C rate=5.00 from=2026-03-25`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=wes person=Dot amount=10.35 date=2026-03-10 proofs=1`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Dot amount=10.35 date=2026-03-10`,
      `ROLLUP sheet=${sheet} by=wes person=Dot claimed=10.35 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=10.35 due-total=1.00 overdue-total=0.00`
    ]);
  });
  test("quarterly periods scenario 2", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-04-05");
    await ui.setSetting(pg_uma, "floor", "0.50");
    await ui.setSetting(pg_uma, "terms", "30");
    await ui.setSetting(pg_uma, "perm-settle", "steward");
    await ui.setSetting(pg_uma, "grace-days", "0");
    await ui.setSetting(pg_uma, "proof-threshold-C", "4.00");
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "5.00"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    expect(await ui.saveTemplate(pg_uma, {"name": "T1", "amount": "1.00", "note": ""})).toBe(true);
    await ui.setSetting(pg_uma, "pot", "33.33");
    await ui.setSetting(pg_uma, "fiscal-start-month", "7");
    await ui.setSetting(pg_uma, "review-sla", "5");
    await ui.setSetting(pg_uma, "escalate-after", "7");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "5.00", "from": "2026-03-16"})).toBe(true);
    expect(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B", "contact": "ADA@X", "tags": "b, a"})).toBeNull();
    expect(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"})).toBeNull();
    const p_eve = ui.must(await ui.addPerson(pg_uma, {"name": "Eve", "grade": "C"}));
    expect(await ui.ratePreview(pg_uma, "C", "33.33")).toEqual({ count: 0, diff: "0.00" });
    expect(await ui.pasteClaims(pg_uma, "Eve,25.00,,paste")).toBe(1);
    const c_eve_0 = await ui.claimAt(pg_uma, p_eve, 0);
    expect(await ui.statementAsOf(pg_uma, p_eve, "2026-03-01")).toBe(false);
    const c_eve_1 = ui.must(await ui.claimFromTemplate(pg_uma, p_eve, "T1"));
    expect(await ui.statement(pg_uma, p_eve)).toBe(true);
    expect(await ui.claimAction(pg_uma, c_eve_1, "open")).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_eve).getByTestId("person-claimed")).toHaveText("26.00");
    await expect(pg_uma.getByTestId("person-row-" + p_eve).getByTestId("person-due-total")).toHaveText("1.75");
    await expect(pg_uma.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_uma.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-due")).toHaveText("1.25");
    await expect(pg_uma.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("26.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("1.75");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("1.75");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("1.75");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "7.50"})).toBe(true);
    const c_eve_2 = ui.must(await ui.split(pg_uma, p_eve, c_eve_1, "0.01"));
    expect(await ui.remind(pg_uma, c_eve_2)).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.claimAction(pg_vic, c_eve_0, "settle")).toBe(false);
    expect(await ui.statement(pg_vic, p_eve)).toBe(true);
    await ui.setSetting(pg_vic, "note-threshold", "2.50");
    expect(await ui.bulkSettle(pg_vic, [c_eve_1, c_eve_2, c_eve_0])).toEqual({ settled: 0, refused: 3 });
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-claimed")).toHaveText("26.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-due-total")).toHaveText("2.25");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-due")).toHaveText("1.25");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("26.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("2.25");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("2.25");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("2.25");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.importPeople(pg_vic, "Dot,C")).toMatchObject({"added": 1, "updated": 0});
    const p_dot = await ui.personId(pg_vic, "Dot");
    expect(await ui.remind(pg_vic, c_eve_1)).toBe(true);
    expect(await ui.watch(pg_vic, p_eve, true)).toBe(true);
    expect(await ui.holdClaim(pg_vic, c_eve_0)).toBe(true);
    expect(await ui.addProof(pg_vic, c_eve_0, "receipt")).toBe(true);
    await ui.sortBy(pg_vic, "name");
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("2.25");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-name")).toHaveText("Dot (C)");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-terms")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-active")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-contact")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-name")).toHaveText("Eve (C)");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-claimed")).toHaveText("26.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-due-total")).toHaveText("2.25");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-statement-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-stated-total")).toHaveText("2.25");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-statement-date")).toHaveText("2026-04-05");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-watched")).toHaveText("yes");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-terms")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-active")).toHaveText("yes");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-aged-0-30")).toHaveText("2.25");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-open-total")).toHaveText("2.25");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-contact")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-statement-line-line")).toHaveText(["2026-04-05 1.25", "2026-04-05 2.25"]);
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-amount")).toHaveText("0.01");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-date")).toHaveText("2026-04-05");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-due-by")).toHaveText("2026-05-15");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-log-line")).toHaveText(["OPEN by uma on 2026-04-05 due=0.50"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-reminded")).toHaveText("2026-04-05");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_2).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-amount")).toHaveText("0.99");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-date")).toHaveText("2026-04-05");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-due-by")).toHaveText("2026-05-15");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-05 due=0.50", "OPEN by uma on 2026-04-05 due=0.50"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-reminded")).toHaveText("2026-04-05");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_1).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-amount")).toHaveText("25.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-date")).toHaveText("2026-04-05");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-note")).toHaveText("paste");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-due")).toHaveText("1.25");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-due-by")).toHaveText("2026-05-15");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-05 due=1.25", "OPEN by uma on 2026-04-05 due=1.25"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-proofs")).toHaveText("1");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-proofs-receipt")).toHaveText("1");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_eve_0).getByTestId("claim-held")).toHaveText("yes");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("26.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("2.25");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("2.25");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("2.25");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("2.25");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-OPEN-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("classic-due-total")).toHaveText("2.25");
    await expect(pg_vic.getByTestId("month-2026-04-due-total")).toHaveText("2.25");
    await expect(pg_vic.getByTestId("rate-month-A-2026-01")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-02")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-03")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-04")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-05")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-06")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-07")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-08")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-09")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-10")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-11")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-12")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-01")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-02")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-03")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-04")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-05")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-06")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-07")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-08")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-09")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-10")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-11")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-12")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-01")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-02")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-03")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-04")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-05")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-06")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-07")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-08")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-09")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-10")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-11")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-12")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_vic.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_vic.getByTestId("dash-overdue-count")).toHaveText("");
    await expect(pg_vic.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=30`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-settle value=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-C value=4.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=1.00 note=`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=33.33`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=fiscal-start-month value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=5`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=escalate-after value=7`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=5.00 from=2026-03-16`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Eve grade=C`,
      `ROLLUP sheet=${sheet} by=uma person=Eve claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Eve amount=25.00 date=2026-04-05`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Eve amount=25.00 date=2026-04-05`,
      `ROLLUP sheet=${sheet} by=uma person=Eve claimed=25.00 due-total=1.25 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=25.00 due-total=1.25 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Eve amount=1.00 date=2026-04-05`,
      `STATEMENT sheet=${sheet} by=uma name=Eve due-total=1.25 claims=1`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Eve amount=1.00 date=2026-04-05`,
      `ROLLUP sheet=${sheet} by=uma person=Eve claimed=26.00 due-total=1.75 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=26.00 due-total=1.75 overdue-total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `CLAIM_SPLIT sheet=${sheet} by=uma person=Eve amount=0.99 date=2026-04-05 into=`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Eve amount=0.01 date=2026-04-05`,
      `ROLLUP sheet=${sheet} by=uma person=Eve claimed=26.00 due-total=2.25 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=26.00 due-total=2.25 overdue-total=0.00`,
      `REMIND sheet=${sheet} by=uma person=Eve amount=0.01 date=2026-04-05`,
      `STATEMENT sheet=${sheet} by=vic name=Eve due-total=2.25 claims=3`,
      `SETTING_CHANGED sheet=${sheet} by=vic key=note-threshold value=2.50`,
      `PERSON_ADDED sheet=${sheet} by=vic name=Dot grade=C`,
      `ROLLUP sheet=${sheet} by=vic person=Dot claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `REMIND sheet=${sheet} by=vic person=Eve amount=0.99 date=2026-04-05`,
      `PERSON_WATCHED sheet=${sheet} by=vic name=Eve`,
      `CLAIM_HELD sheet=${sheet} by=vic person=Eve amount=25.00 date=2026-04-05`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=vic person=Eve amount=25.00 date=2026-04-05 proofs=1 kind=receipt`
    ]);
  });
  test("quarterly periods scenario 3", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    await ui.setSetting(pg_uma, "floor", "0.50");
    await ui.setSetting(pg_uma, "terms", "30");
    await ui.setSetting(pg_uma, "terms-C", "20");
    await ui.setSetting(pg_uma, "cap", "5.00");
    expect(await ui.setRole(pg_uma, "wes", "viewer")).toBe(true);
    await ui.setSetting(pg_uma, "review-sla", "1");
    await ui.setSetting(pg_uma, "escalate-after", "7");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "20.00", "from": "2026-03-01"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "C", "contact": "ben@x"}));
    expect(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "C", "terms": "20", "contact": "ben@x"})).toBeNull();
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C"}));
    expect(await ui.addCrew(pg_uma, "C1", "Cam")).toBe(true);
    expect(await ui.addCrewMember(pg_uma, "C1", "Ada")).toBe(true);
    expect(await ui.editPerson(pg_uma, p_cam, {"terms": "20", "termsFrom": "2026-03-01"})).toBe(true);
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.importOpenings(pg_wes, "Ada,P1,1.00")).toBeNull();
    expect(await ui.watch(pg_wes, p_cam, true)).toBe(false);
    expect(await ui.inlineGrade(pg_wes, p_cam, "B")).toBe(false);
    expect(await ui.statement(pg_wes, p_ada)).toBe(false);
    expect(await ui.periodAction(pg_wes, "P1", "close")).toBe(false);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.statementAsOf(pg_wes, p_ada, "2026-03-15")).toBe(false);
    expect(await ui.statement(pg_wes, p_cam)).toBe(false);
    expect(await ui.watch(pg_wes, p_cam, true)).toBe(false);
    expect(await ui.addClaim(pg_wes, p_ada, {"amount": "10.25"})).toBeNull();
    expect(await ui.inlineGrade(pg_wes, p_ada, "B")).toBe(false);
    expect(await ui.statement(pg_wes, p_ada)).toBe(false);
    expect(await ui.setTodayTry(pg_wes, "2026-04-09")).toBe(false);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.setSettingTry(pg_wes, "proof-threshold", "3.00")).toBe(false);
    expect(await ui.hold(pg_wes, p_ada, {"from": "2026-03-05", "to": "2026-03-28"})).toBe(false);
    expect(await ui.statementAsOf(pg_wes, p_ada, "2026-03-05")).toBe(false);
    expect(await ui.editPerson(pg_wes, p_cam, {"grade": "B", "gradeFrom": "2026-03-20"})).toBe(false);
    expect(await ui.statementAsOf(pg_wes, p_ada, "2026-02-10")).toBe(false);
    expect(await ui.setRate(pg_wes, {"grade": "C", "pct": "7.50", "from": "2026-03-01", "to": "2026-03-12"})).toBe(false);
    await ui.setAsOf(pg_wes, "2026-02-25");
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("2026-02-25");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("");
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
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
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
    await expect(pg_wes.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-01")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-A-2026-02")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-A-2026-03")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-A-2026-04")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-A-2026-05")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-A-2026-06")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-A-2026-07")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-A-2026-08")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-A-2026-09")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-A-2026-10")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-A-2026-11")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-A-2026-12")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-B-2026-01")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-B-2026-02")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-B-2026-03")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-B-2026-04")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-B-2026-05")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-B-2026-06")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-B-2026-07")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-B-2026-08")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-B-2026-09")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-B-2026-10")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-B-2026-11")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-B-2026-12")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-01")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-02")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-03")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-04")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-05")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-06")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-07")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-08")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-09")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-10")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-11")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-12")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_wes.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_wes.getByTestId("dash-overdue-count")).toHaveText("");
    await expect(pg_wes.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=30`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=5.00`,
      `ROLE_SET sheet=${sheet} by=uma user=wes role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=1`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=escalate-after value=7`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00 from=2026-03-01`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C contact=ben@x`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CREW_ADDED sheet=${sheet} by=uma name=C1 lead=Cam`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Ada`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=C terms=20`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`
    ]);
    await ui.clearAsOf(pg_wes);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (C)");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-terms")).toHaveText("20");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-active")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-contact")).toHaveText("ben@x");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (C)");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("2026-03-20");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText(["2026-03-20 0.00"]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("pool-row-C1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_wes.getByTestId("pool-row-C1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_wes.getByTestId("pool-member-C1-" + p_cam).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_wes.getByTestId("pool-member-C1-" + p_cam).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_wes.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("crew-row-C1").getByTestId("crew-lead")).toHaveText("Cam (C)");
    await expect(pg_wes.getByTestId("crew-row-C1").getByTestId("crew-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-01")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-02")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-03")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-04")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-05")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-06")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-07")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-08")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-09")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-10")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-11")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-12")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-01")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-02")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-03")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-04")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-05")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-06")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-07")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-08")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-09")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-10")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-11")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-12")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-01")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-C-2026-02")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-C-2026-03")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-C-2026-04")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-C-2026-05")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-C-2026-06")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-C-2026-07")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-C-2026-08")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-C-2026-09")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-C-2026-10")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-C-2026-11")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-C-2026-12")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_wes.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_wes.getByTestId("dash-overdue-count")).toHaveText("");
    await expect(pg_wes.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=30`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=5.00`,
      `ROLE_SET sheet=${sheet} by=uma user=wes role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=1`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=escalate-after value=7`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00 from=2026-03-01`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C contact=ben@x`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CREW_ADDED sheet=${sheet} by=uma name=C1 lead=Cam`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Ada`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=C terms=20`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`
    ]);
  });
});
