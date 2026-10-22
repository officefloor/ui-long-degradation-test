import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("fiscal year", () => {
  test("fiscal year", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2025-12-20", "to": "2026-01-05"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P2", "from": "2026-04-01", "to": "2026-04-30"})).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-fy")).toHaveText("FY2026");
    await ui.setSetting(pg_uma, "fiscal-start-month", "4");
    expect(await ui.setSettingTry(pg_uma, "fiscal-start-month", "13")).toBe(false);
    expect(await ui.setSettingTry(pg_uma, "fiscal-start-month", "x")).toBe(false);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-fy")).toHaveText("FY2026");
    expect(await ui.generateFy(pg_uma, "2026")).toBe(11);
    expect(await ui.generateFy(pg_uma, "x")).toBeNull();
    expect(await ui.generateFy(pg_uma, "2026")).toBe(0);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.00", "date": "2026-05-05"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("2026-05");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-2026-05").getByTestId("period-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("period-row-2026-05").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-2026-05").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-2026-06").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-2026-06").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-2026-06").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-2026-07").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-2026-07").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-2026-07").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-2026-08").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-2026-08").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-2026-08").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-2026-09").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-2026-09").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-2026-09").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-2026-10").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-2026-10").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-2026-10").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-2026-11").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-2026-11").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-2026-11").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-2026-12").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-2026-12").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-2026-12").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-2027-01").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-2027-01").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-2027-01").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-2027-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-2027-02").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-2027-02").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-2027-03").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-2027-03").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-2027-03").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2026-05-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("summary-period-2026-06-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2026-07-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2026-08-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2026-09-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2026-10-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2026-11-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2026-12-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2027-01-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2027-02-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2027-03-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_uma.getByTestId("summary-period-P2-change")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2026-05-change")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("summary-period-2026-06-change")).toHaveText("-1.00");
    await expect(pg_uma.getByTestId("summary-period-2026-07-change")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2026-08-change")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2026-09-change")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2026-10-change")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2026-11-change")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2026-12-change")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2027-01-change")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2027-02-change")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-2027-03-change")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2025-12-20 to=2026-01-05`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-04-01 to=2026-04-30`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=fiscal-start-month value=4`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-05 from=2026-05-01 to=2026-05-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-06 from=2026-06-01 to=2026-06-30`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-07 from=2026-07-01 to=2026-07-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-08 from=2026-08-01 to=2026-08-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-09 from=2026-09-01 to=2026-09-30`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-10 from=2026-10-01 to=2026-10-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-11 from=2026-11-01 to=2026-11-30`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-12 from=2026-12-01 to=2026-12-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2027-01 from=2027-01-01 to=2027-01-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2027-02 from=2027-02-01 to=2027-02-28`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2027-03 from=2027-03-01 to=2027-03-31`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-05-05`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-05-05`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=10.00 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=10.00 due-total=1.00 overdue-total=0.00`
    ]);
  });
  test("fiscal year scenario 1", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "terms", "7");
    await ui.setSetting(pg_uma, "late-pct", "5.00");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-05");
    await ui.setSetting(pg_uma, "period-numbering-from", "2026-03-01");
    await ui.setSetting(pg_uma, "grace-days", "0");
    await ui.setSetting(pg_uma, "note-threshold", "2.50");
    expect(await ui.addHoliday(pg_uma, "2026-03-13")).toBe(true);
    expect(await ui.addHoliday(pg_uma, "2026-04-03")).toBe(true);
    expect(await ui.saveTemplate(pg_uma, {"name": "T1", "amount": "0.04", "note": "tpl"})).toBe(true);
    await ui.setSetting(pg_uma, "pot", "33.33");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "20.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "7.50", "from": "2026-03-16", "to": "2026-03-25"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "A", "contact": " Ada@x ", "tags": "b, a"}));
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B", "contact": "ben@x", "tags": "a"}));
    const pl_ada_1 = ui.must(await ui.addPlan(pg_uma, p_ada, {"amount": "0.40", "start": "2026-03-01", "end": "2026-04-30", "every": "10"}));
    expect(await ui.periodAction(pg_uma, "P1", "close")).toBe(true);
    await ui.setToday(pg_uma, "2026-04-28");
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "4.00", "date": "2026-02-10", "note": "n", "ref": "inv 7"}));
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "7.50", "from": "2026-03-10"})).toBe(true);
    expect(await ui.statement(pg_uma, p_cam)).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    const c_ada_1 = ui.must(await ui.addClaimTwice(pg_uma, p_ada, {"amount": "10.35", "date": "2026-03-28"}));
    expect(await ui.claimCount(pg_uma, p_ada)).toBe(2);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("1.10");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.10");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("1.10");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("1.10");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("1.10");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("1.10");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("1.10");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    expect(await ui.addHoliday(pg_uma, "2026-03-11")).toBe(true);
    expect(await ui.editClaim(pg_uma, c_ada_0, {"date": "2026-03-05"})).toBe(false);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.transfer(pg_vic, p_cam, `${sheet}-t`)).toBe(true);
    expect(await ui.statement(pg_vic, p_ada)).toBe(true);
    await ui.refresh(pg_vic);
    expect(await ui.delegate(pg_vic, {"user": "uma", "from": "2026-03-05", "to": "2026-03-20"})).toBe(true);
    await ui.refresh(pg_uma);
    expect(await ui.statementAsOf(pg_uma, p_ada, "2026-02-25")).toBe(false);
    const c_dot_0 = ui.must(await ui.quickAdd(pg_uma, {"name": "Dot", "amount": "4.00"}));
    const p_dot = await ui.personId(pg_uma, "Dot");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_dot).getByTestId("person-claimed")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("person-row-" + p_dot).getByTestId("person-due-total")).toHaveText("1.10");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.10");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_uma.getByTestId("person-row-" + p_dot).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_dot).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("1.10");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("1.10");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("1.10");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("1.10");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("1.10");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    expect(await ui.pasteClaims(pg_uma, "Dot,10.35,,")).toBe(1);
    expect(await ui.bulkOpen(pg_uma, [c_dot_0, c_ada_1, c_ada_0])).toEqual({ opened: 1, refused: 2 });
    await ui.setToday(pg_uma, "2026-05-28");
    expect(await ui.importPeople(pg_uma, "Dot,C\nFay,B,3,fay@x")).toMatchObject({"added": 1, "updated": 1});
    const p_fay = await ui.personId(pg_uma, "Fay");
    expect(await ui.editPerson(pg_uma, p_dot, {"grade": "C"})).toBe(true);
    await ui.refresh(pg_vic);
    expect(await ui.merge(pg_vic, p_dot, "Ada")).toBe(true);
    const c_ada_2 = await ui.claimAt(pg_vic, p_ada, 2);
    await ui.refresh(pg_vic);
    expect(await ui.merge(pg_vic, p_ada, "Fay")).toBe(true);
    const c_fay_0 = await ui.claimAt(pg_vic, p_fay, 0);
    const c_fay_1 = await ui.claimAt(pg_vic, p_fay, 1);
    const c_fay_2 = await ui.claimAt(pg_vic, p_fay, 2);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("24.70");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("3.15");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-due")).toHaveText("1.05");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-due")).toHaveText("1.10");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("24.70");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("3.15");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("3.15");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("3.15");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("3.15");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("3.15");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    expect(await ui.claimAction(pg_vic, c_fay_2, "settle")).toBe(true);
    await ui.setAsOf(pg_vic, "2026-03-09");
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("2026-03-09");
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
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=2.50`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-03`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=0.04 note=tpl`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50 from=2026-03-16 to=2026-03-25`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=A contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B contact=ben@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Ada amount=0.40 start=2026-03-01 every=10 end=2026-04-30`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Cam due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=n/a overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-02-10 ref=inv 7`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50 from=2026-03-10`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=n/a claims=0`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-02-10`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=4.00 due-total=1.10 overdue-total=1.10`,
      `TOTALS sheet=${sheet} by=uma claimed-total=4.00 due-total=1.10 overdue-total=1.10`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.35 date=2026-03-28`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-11`,
      `PERSON_TRANSFERRED sheet=${sheet} by=vic name=Cam to=${sheet}-t`,
      `STATEMENT sheet=${sheet} by=vic name=Ada due-total=1.10 claims=1`,
      `DELEGATED sheet=${sheet} by=vic user=uma from=2026-03-05 to=2026-03-20`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Dot grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Dot claimed=0.00 due-total=n/a overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Dot amount=4.00 date=2026-04-28`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Dot amount=10.35 date=2026-04-28`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Dot amount=10.35 date=2026-04-28`,
      `ROLLUP sheet=${sheet} by=uma person=Dot claimed=10.35 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=14.35 due-total=1.10 overdue-total=1.10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=10.35 date=2026-03-28`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=14.35 due-total=2.10 overdue-total=2.10`,
      `TOTALS sheet=${sheet} by=uma claimed-total=24.70 due-total=2.10 overdue-total=2.10`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=2.10`,
      `SNAPSHOT sheet=${sheet} by=uma name=Dot due-total=n/a`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=14.35 due-total=2.15 overdue-total=2.15`,
      `TOTALS sheet=${sheet} by=uma claimed-total=24.70 due-total=2.15 overdue-total=2.15`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Dot grade=C`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Fay grade=B terms=3 contact=fay@x`,
      `ROLLUP sheet=${sheet} by=uma person=Fay claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=24.70 due-total=2.15 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Dot grade=C`,
      `PERSON_MERGED sheet=${sheet} by=vic from=Dot into=Ada`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=24.70 due-total=3.15 overdue-total=3.15`,
      `TOTALS sheet=${sheet} by=vic claimed-total=24.70 due-total=3.15 overdue-total=3.15`,
      `PERSON_MERGED sheet=${sheet} by=vic from=Ada into=Fay`,
      `ROLLUP sheet=${sheet} by=vic person=Fay claimed=24.70 due-total=3.15 overdue-total=3.15`,
      `CLAIM_SETTLED sheet=${sheet} by=vic person=Fay amount=10.35 date=2026-04-28 number=X-1 due=1.00`,
      `ROLLUP sheet=${sheet} by=vic person=Fay claimed=24.70 due-total=3.15 overdue-total=2.15`,
      `TOTALS sheet=${sheet} by=vic claimed-total=24.70 due-total=3.15 overdue-total=2.15`
    ]);
    await ui.clearAsOf(pg_vic);
    await ui.refresh(pg_vic);
    expect(await ui.archive(pg_vic)).toBe(true);
    expect(await ui.addClaim(pg_vic, p_fay, {"amount": "20.00"})).toBeNull();
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("yes");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("3.15");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("2.15");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-name")).toHaveText("Fay (B)");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("24.70");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("3.15");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-stated-total")).toHaveText("1.10");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-statement-date")).toHaveText("2026-04-28");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-overdue-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-overdue-total")).toHaveText("2.15");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-active")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-aged-61")).toHaveText("2.15");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-settled-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-open-total")).toHaveText("2.15");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-contact")).toHaveText("fay@x");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-aliases")).toHaveText("Ada, Dot");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-amount")).toHaveText("10.35");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-date")).toHaveText("2026-04-28");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-number")).toHaveText("X-1");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-due-by")).toHaveText("2026-05-07");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-28 due=n/a", "OPEN by uma on 2026-04-28 due=n/a", "SETTLED by vic on 2026-05-28 due=1.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-amount")).toHaveText("10.35");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-date")).toHaveText("2026-03-28");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-due")).toHaveText("1.05");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-due-by")).toHaveText("2026-04-08");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-28 due=1.00", "OPEN by uma on 2026-04-28 due=1.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-amount")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-date")).toHaveText("2026-02-10");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-due")).toHaveText("1.10");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-due-by")).toHaveText("2026-02-19");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-28 due=1.00", "OPEN by uma on 2026-04-28 due=1.10"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-ref")).toHaveText("inv 7");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("24.70");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("3.15");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("2.15");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("2.15");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("3.15");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("2.15");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("3.15");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_vic.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-OPEN-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-SETTLED-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("month-2026-02-due-total")).toHaveText("1.10");
    await expect(pg_vic.getByTestId("month-2026-03-due-total")).toHaveText("1.05");
    await expect(pg_vic.getByTestId("month-2026-04-due-total")).toHaveText("1.00");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=2.50`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-03`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=0.04 note=tpl`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50 from=2026-03-16 to=2026-03-25`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=A contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B contact=ben@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Ada amount=0.40 start=2026-03-01 every=10 end=2026-04-30`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Cam due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=n/a overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-02-10 ref=inv 7`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50 from=2026-03-10`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=n/a claims=0`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-02-10`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=4.00 due-total=1.10 overdue-total=1.10`,
      `TOTALS sheet=${sheet} by=uma claimed-total=4.00 due-total=1.10 overdue-total=1.10`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.35 date=2026-03-28`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-11`,
      `PERSON_TRANSFERRED sheet=${sheet} by=vic name=Cam to=${sheet}-t`,
      `STATEMENT sheet=${sheet} by=vic name=Ada due-total=1.10 claims=1`,
      `DELEGATED sheet=${sheet} by=vic user=uma from=2026-03-05 to=2026-03-20`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Dot grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Dot claimed=0.00 due-total=n/a overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Dot amount=4.00 date=2026-04-28`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Dot amount=10.35 date=2026-04-28`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Dot amount=10.35 date=2026-04-28`,
      `ROLLUP sheet=${sheet} by=uma person=Dot claimed=10.35 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=14.35 due-total=1.10 overdue-total=1.10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=10.35 date=2026-03-28`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=14.35 due-total=2.10 overdue-total=2.10`,
      `TOTALS sheet=${sheet} by=uma claimed-total=24.70 due-total=2.10 overdue-total=2.10`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=2.10`,
      `SNAPSHOT sheet=${sheet} by=uma name=Dot due-total=n/a`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=14.35 due-total=2.15 overdue-total=2.15`,
      `TOTALS sheet=${sheet} by=uma claimed-total=24.70 due-total=2.15 overdue-total=2.15`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Dot grade=C`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Fay grade=B terms=3 contact=fay@x`,
      `ROLLUP sheet=${sheet} by=uma person=Fay claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=24.70 due-total=2.15 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Dot grade=C`,
      `PERSON_MERGED sheet=${sheet} by=vic from=Dot into=Ada`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=24.70 due-total=3.15 overdue-total=3.15`,
      `TOTALS sheet=${sheet} by=vic claimed-total=24.70 due-total=3.15 overdue-total=3.15`,
      `PERSON_MERGED sheet=${sheet} by=vic from=Ada into=Fay`,
      `ROLLUP sheet=${sheet} by=vic person=Fay claimed=24.70 due-total=3.15 overdue-total=3.15`,
      `CLAIM_SETTLED sheet=${sheet} by=vic person=Fay amount=10.35 date=2026-04-28 number=X-1 due=1.00`,
      `ROLLUP sheet=${sheet} by=vic person=Fay claimed=24.70 due-total=3.15 overdue-total=2.15`,
      `TOTALS sheet=${sheet} by=vic claimed-total=24.70 due-total=3.15 overdue-total=2.15`,
      `SHEET_ARCHIVED sheet=${sheet} by=vic`
    ]);
  });
  test("fiscal year scenario 2", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "clerk-limit", "1.50");
    await ui.setSetting(pg_uma, "floor", "0.50");
    await ui.setSetting(pg_uma, "late-pct", "5.00");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-05");
    await ui.setSetting(pg_uma, "terms-C", "3");
    expect(await ui.setRole(pg_uma, "vic", "viewer")).toBe(true);
    await ui.setSetting(pg_uma, "grace-days", "3");
    await ui.setSetting(pg_uma, "proof-threshold-A", "0.50");
    expect(await ui.addVoidReason(pg_uma, "error")).toBe(true);
    expect(await ui.addVoidReason(pg_uma, "late")).toBe(true);
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "12.50"})).toBe(true);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "A"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    expect(await ui.saveTemplate(pg_uma, {"name": "T1", "amount": "4.00", "note": "tpl"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "12.50", "from": "2026-03-01"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P2", "from": "2026-03-16", "to": "2026-03-31"})).toBe(true);
    expect(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B", "contact": " Ada@x ", "tags": "b, a"})).toBeNull();
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C", "terms": "20", "contact": " Ada@x "}));
    expect(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"})).toBeNull();
    const pl_ada_1 = ui.must(await ui.addPlan(pg_uma, p_ada, {"amount": "10.35", "start": "2026-02-20", "end": "2026-04-30", "day": "31"}));
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "4.00", "date": "2026-03-28", "note": "n", "ref": " r-1 "}));
    const c_ada_1 = ui.must(await ui.claimFromTemplate(pg_uma, p_ada, "T1"));
    expect(await ui.periodAction(pg_uma, "P2", "close")).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.claimAction(pg_vic, c_ada_0, "open")).toBe(false);
    expect(await ui.bulkOpen(pg_vic, [c_ada_0, c_ada_1])).toEqual({ opened: 0, refused: 2 });
    expect(await ui.statement(pg_vic, p_ada)).toBe(false);
    expect(await ui.statement(pg_vic, p_ada)).toBe(false);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    expect(await ui.editClaim(pg_vic, c_ada_0, {"date": "2026-02-25"})).toBe(false);
    expect(await ui.importPeople(pg_vic, "Ada,C\nFay,C,,fay@x")).toBeNull();
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.delegate(pg_wes, {"user": "uma", "from": "2026-02-10", "to": "2026-03-05"})).toBe(true);
    await ui.refresh(pg_uma);
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_0, "delete")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_0, "restore")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    const c_ada_2 = ui.must(await ui.split(pg_uma, p_ada, c_ada_0, "0.01"));
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    expect(await ui.claimAction(pg_vic, c_ada_1, "open")).toBe(false);
    expect(await ui.claimAction(pg_vic, c_ada_0, "settle")).toBe(false);
    expect(await ui.addClaim(pg_vic, p_ada, {"amount": "7.77", "date": "2026-03-20"})).toBeNull();
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (C)");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("1.00");
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
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("20");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("ada@x");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-amount")).toHaveText("0.01");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-date")).toHaveText("2026-03-28");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due-by")).toHaveText("2026-04-24");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-log-line")).toHaveText(["OPEN by uma on 2026-03-20 due=0.50"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("tpl");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due-by")).toHaveText("2026-04-17");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-20 due=0.50"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("3.99");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-03-28");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-04-24");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-20 due=0.50", "DELETED by uma on 2026-03-20 due=0.50", "DRAFT by uma on 2026-03-20 due=0.50", "OPEN by uma on 2026-03-20 due=0.50"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("r-1");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_vic.getByTestId("summary-period-P2-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-status-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-status-OPEN-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-void-error-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-void-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("month-2026-03-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("plan-row-" + pl_ada_1).getByTestId("plan-generated")).toHaveText("0");
    await expect(pg_vic.getByTestId("plan-row-" + pl_ada_1).getByTestId("plan-next-dates")).toHaveText("2026-03-31, 2026-04-30");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=1.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=3`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-A value=0.50`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=late`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=4.00 note=tpl`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50 from=2026-03-01`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C terms=20 contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Ada amount=10.35 start=2026-02-20 day=31 end=2026-04-30`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-28 ref=r-1`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-20`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P2 total=0.00`,
      `DELEGATED sheet=${sheet} by=wes user=uma from=2026-02-10 to=2026-03-05`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `CLAIM_DELETED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-28`,
      `CLAIM_RESTORED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-28`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-28`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=4.00 due-total=0.50 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=4.00 due-total=0.50 overdue-total=0.00`,
      `CLAIM_SPLIT sheet=${sheet} by=uma person=Ada amount=3.99 date=2026-03-28 into=`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=0.01 date=2026-03-28`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=4.00 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=4.00 due-total=1.00 overdue-total=0.00`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=1.00 claims=2`
    ]);
  });
  test("fiscal year scenario 3", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "terms", "10");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-05");
    await ui.setSetting(pg_uma, "terms-A", "20");
    await ui.setSetting(pg_uma, "cap", "5.00");
    expect(await ui.setRole(pg_uma, "wes", "viewer")).toBe(true);
    await ui.setSetting(pg_uma, "grace-days", "0");
    await ui.setSetting(pg_uma, "note-threshold", "2.50");
    await ui.setSetting(pg_uma, "grace-A", "5");
    expect(await ui.saveTemplate(pg_uma, {"name": "T1", "amount": "3.33", "note": "tpl"})).toBe(true);
    await ui.setSetting(pg_uma, "pot", "7.77");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "33.33"})).toBe(true);
    expect(await ui.generatePeriods(pg_uma, "2026-02-01", "2026-04-30")).toBe(3);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "A", "contact": "ADA@X"}));
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B", "tags": "a"}));
    expect(await ui.addPool(pg_uma, "P1")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Cam", "share": "70.00"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ada", "share": "20.00", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPool(pg_uma, "P2")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P2", {"member": "Cam", "share": "100.00"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "pool:P2", "share": "10.00"})).toBe(true);
    const c_cam_0 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "12.50", "date": "2026-03-20", "note": "n"}));
    await ui.setSetting(pg_uma, "floor", "2.00");
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.25", "date": "2026-03-01", "tags": "a"}));
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "99.95", "date": "2026-02-25", "note": "n"}));
    expect(await ui.watch(pg_uma, p_cam, true)).toBe(true);
    expect(await ui.pasteClaims(pg_uma, "Ada,25.00,,paste")).toBe(1);
    const c_ada_2 = await ui.claimAt(pg_uma, p_ada, 2);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.bulkReassign(pg_vic, [c_ada_1, c_ada_2], "Ada")).toEqual({ reassigned: 2, refused: 0 });
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("25.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("3.45");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("33.31");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("8.33");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("3.42");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("25.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("3.45");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("8.33");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("7.77");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("3.45");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await ui.setToday(pg_vic, "2026-03-29");
    const c_cam_1 = ui.must(await ui.addClaim(pg_vic, p_cam, {"amount": "12.50", "date": "2026-03-28", "tags": "a, B"}));
    expect(await ui.setRate(pg_vic, {"grade": "C", "pct": "5.00"})).toBe(true);
    expect(await ui.pasteClaims(pg_vic, "Ada,0.40,,paste\nAda,0.40,,\nAda,7.77,,")).toBeNull();
    expect(await ui.editInline(pg_vic, c_ada_1, "10.25")).toBe(true);
    await ui.refresh(pg_vic);
    expect(await ui.delegate(pg_vic, {"user": "uma", "from": "2026-02-25", "to": "2026-03-01"})).toBe(true);
    await ui.refresh(pg_uma);
    const c_cam_2 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "25.00", "tags": "a"}));
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("25.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("3.42");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("8.33");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("3.42");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("25.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("8.33");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("8.33");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("5");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("8.33");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    expect(await ui.periodAction(pg_uma, "2026-04", "close")).toBe(true);
    expect(await ui.editClaim(pg_uma, c_cam_0, {"amount": "25.00"})).toBe(false);
    await ui.refresh(pg_vic);
    expect(await ui.periodAction(pg_vic, "2026-02", "reopen")).toBe(true);
    expect(await ui.setRate(pg_vic, {"grade": "A", "pct": "20.00"})).toBe(true);
    expect(await ui.inlineGrade(pg_vic, p_cam, "A")).toBe(true);
    expect(await ui.setRate(pg_vic, {"grade": "B", "pct": "12.50"})).toBe(true);
    await ui.setAsOf(pg_vic, "2026-03-20");
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("2026-03-20");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (A)");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-terms")).toHaveText("");
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
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-amount")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-period")).toHaveText("2026-04");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due-by")).toHaveText("2026-04-17");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=1.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (B)");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("25.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("3.33");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("yes");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("8.33");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("8.33");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("a");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-03-due-total")).toHaveText("8.33");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("99.95");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-02-25");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("33.31");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("2026-03");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due-by")).toHaveText("2026-03-11");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=33.31"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-amount")).toHaveText("25.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-date")).toHaveText("2026-03-10");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-note")).toHaveText("paste");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("8.33");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-period")).toHaveText("2026-03");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due-by")).toHaveText("2026-03-24");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=8.33", "OPEN by uma on 2026-03-10 due=8.33"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("10.25");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-03-01");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("3.42");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("2026-03");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-03-13");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=3.42"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("a");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("25.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("8.33");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-due-total")).toHaveText("8.33");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-03-due-total")).toHaveText("8.33");
    await expect(pg_vic.getByTestId("summary-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-02-change")).toHaveText("");
    await expect(pg_vic.getByTestId("summary-period-2026-03-change")).toHaveText("8.33");
    await expect(pg_vic.getByTestId("summary-period-2026-04-change")).toHaveText("-8.33");
    await expect(pg_vic.getByTestId("summary-status-DRAFT-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("summary-status-OPEN-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("tag-a-due-total")).toHaveText("8.33");
    await expect(pg_vic.getByTestId("month-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("month-2026-03-due-total")).toHaveText("8.33");
    await expect(pg_vic.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("80.00");
    await expect(pg_vic.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("no");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-share")).toHaveText("70.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-share")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-share")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-cut")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-row-P2").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-row-P2").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_vic.getByTestId("pool-member-P2-" + p_cam).getByTestId("pool-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-member-P2-" + p_cam).getByTestId("pool-cut")).toHaveText("");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-A value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=5.00`,
      `ROLE_SET sheet=${sheet} by=uma user=wes role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=2.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-A value=5`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=3.33 note=tpl`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=7.77`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=33.33`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-02 from=2026-02-01 to=2026-02-28`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-03 from=2026-03-01 to=2026-03-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-04 from=2026-04-01 to=2026-04-30`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=A contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Cam share=70.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=20.00 from=2026-03-01 to=2026-03-15`,
      `POOL_ADDED sheet=${sheet} by=uma name=P2`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P2 name=Cam share=100.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=P2 share=10.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-03-20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-03-01 tags=a`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=99.95 date=2026-02-25`,
      `PERSON_WATCHED sheet=${sheet} by=uma name=Cam`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=25.00 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=25.00 date=2026-03-10`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=25.00 due-total=3.45 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=25.00 due-total=3.45 overdue-total=0.00`,
      `CLAIM_REASSIGNED sheet=${sheet} by=vic person=Ada amount=25.00 date=2026-03-10 from=Ada to=Ada`,
      `CLAIM_REASSIGNED sheet=${sheet} by=vic person=Ada amount=99.95 date=2026-02-25 from=Ada to=Ada`,
      `SNAPSHOT sheet=${sheet} by=vic name=Cam due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=vic name=Ada due-total=3.45`,
      `PERIOD_CLOSED sheet=${sheet} by=vic period=2026-02 total=0.00 auto=yes`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=25.00 due-total=5.00 overdue-total=8.33`,
      `TOTALS sheet=${sheet} by=vic claimed-total=25.00 due-total=5.00 overdue-total=8.33`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Cam amount=12.50 date=2026-03-28 tags=a,b`,
      `RATE_SET sheet=${sheet} by=vic grade=C rate=5.00`,
      `CLAIM_EDITED sheet=${sheet} by=vic person=Ada amount=10.25 date=2026-02-25`,
      `DELEGATED sheet=${sheet} by=vic user=uma from=2026-02-25 to=2026-03-01`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=25.00 date=2026-03-29 tags=a`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=2026-04 total=0.00`,
      `PERIOD_REOPENED sheet=${sheet} by=vic period=2026-02`,
      `RATE_SET sheet=${sheet} by=vic grade=A rate=20.00`,
      `PERSON_EDITED sheet=${sheet} by=vic name=Cam grade=A`,
      `RATE_SET sheet=${sheet} by=vic grade=B rate=12.50`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=25.00 due-total=3.12 overdue-total=3.12`,
      `TOTALS sheet=${sheet} by=vic claimed-total=25.00 due-total=3.12 overdue-total=3.12`
    ]);
    await ui.clearAsOf(pg_vic);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (A)");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-terms")).toHaveText("");
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
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-amount")).toHaveText("25.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-date")).toHaveText("2026-03-29");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-due")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-period")).toHaveText("2026-04");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-due-by")).toHaveText("2026-04-24");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-29 due=2.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-tags")).toHaveText("a");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-amount")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-date")).toHaveText("2026-03-28");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due")).toHaveText("2.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-period")).toHaveText("2026-04");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due-by")).toHaveText("2026-04-24");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by vic on 2026-03-29 due=2.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-tags")).toHaveText("a, b");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-amount")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("2.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-period")).toHaveText("2026-04");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due-by")).toHaveText("2026-04-17");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=1.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (B)");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("25.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-total")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("yes");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("a");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-03-due-total")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("10.25");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-02-25");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.28");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("2026-03");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due-by")).toHaveText("2026-03-11");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=33.31"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-amount")).toHaveText("25.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-date")).toHaveText("2026-03-10");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-note")).toHaveText("paste");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-period")).toHaveText("2026-03");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due-by")).toHaveText("2026-03-24");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=8.33", "OPEN by uma on 2026-03-10 due=8.33"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("10.25");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-03-01");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.28");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("2026-03");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-03-13");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=3.42"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("a");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("25.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("5");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-due-total")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-03-due-total")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("summary-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-02-change")).toHaveText("");
    await expect(pg_vic.getByTestId("summary-period-2026-03-change")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("summary-period-2026-04-change")).toHaveText("-3.12");
    await expect(pg_vic.getByTestId("summary-status-DRAFT-count")).toHaveText("5");
    await expect(pg_vic.getByTestId("summary-status-OPEN-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("tag-a-due-total")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("tag-b-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("month-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("month-2026-03-due-total")).toHaveText("3.12");
    await expect(pg_vic.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("80.00");
    await expect(pg_vic.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("no");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-share")).toHaveText("70.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-share")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-share")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-cut")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-row-P2").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-row-P2").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_vic.getByTestId("pool-member-P2-" + p_cam).getByTestId("pool-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-member-P2-" + p_cam).getByTestId("pool-cut")).toHaveText("");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-A value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=5.00`,
      `ROLE_SET sheet=${sheet} by=uma user=wes role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=2.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-A value=5`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=3.33 note=tpl`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=7.77`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=33.33`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-02 from=2026-02-01 to=2026-02-28`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-03 from=2026-03-01 to=2026-03-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-04 from=2026-04-01 to=2026-04-30`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=A contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Cam share=70.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=20.00 from=2026-03-01 to=2026-03-15`,
      `POOL_ADDED sheet=${sheet} by=uma name=P2`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P2 name=Cam share=100.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=P2 share=10.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-03-20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-03-01 tags=a`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=99.95 date=2026-02-25`,
      `PERSON_WATCHED sheet=${sheet} by=uma name=Cam`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=25.00 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=25.00 date=2026-03-10`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=25.00 due-total=3.45 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=25.00 due-total=3.45 overdue-total=0.00`,
      `CLAIM_REASSIGNED sheet=${sheet} by=vic person=Ada amount=25.00 date=2026-03-10 from=Ada to=Ada`,
      `CLAIM_REASSIGNED sheet=${sheet} by=vic person=Ada amount=99.95 date=2026-02-25 from=Ada to=Ada`,
      `SNAPSHOT sheet=${sheet} by=vic name=Cam due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=vic name=Ada due-total=3.45`,
      `PERIOD_CLOSED sheet=${sheet} by=vic period=2026-02 total=0.00 auto=yes`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=25.00 due-total=5.00 overdue-total=8.33`,
      `TOTALS sheet=${sheet} by=vic claimed-total=25.00 due-total=5.00 overdue-total=8.33`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Cam amount=12.50 date=2026-03-28 tags=a,b`,
      `RATE_SET sheet=${sheet} by=vic grade=C rate=5.00`,
      `CLAIM_EDITED sheet=${sheet} by=vic person=Ada amount=10.25 date=2026-02-25`,
      `DELEGATED sheet=${sheet} by=vic user=uma from=2026-02-25 to=2026-03-01`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=25.00 date=2026-03-29 tags=a`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=2026-04 total=0.00`,
      `PERIOD_REOPENED sheet=${sheet} by=vic period=2026-02`,
      `RATE_SET sheet=${sheet} by=vic grade=A rate=20.00`,
      `PERSON_EDITED sheet=${sheet} by=vic name=Cam grade=A`,
      `RATE_SET sheet=${sheet} by=vic grade=B rate=12.50`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=25.00 due-total=3.12 overdue-total=3.12`,
      `TOTALS sheet=${sheet} by=vic claimed-total=25.00 due-total=3.12 overdue-total=3.12`
    ]);
  });
});
