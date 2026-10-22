import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("steward dashboard", () => {
  test("steward dashboard", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "20.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "clerk-limit", "1.50");
    await ui.setSetting(pg_uma, "review-threshold", "3.00");
    await ui.setSetting(pg_uma, "terms", "5");
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "20.00", "date": "2026-03-01"}));
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "40.00"}));
    const c_ben_0 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "10.00", "date": "2026-03-01"}));
    const c_ben_1 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "5.00"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_1, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ben_0, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ben_1, "open")).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.claimAction(pg_wes, c_ada_0, "settle")).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_wes.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_wes.getByTestId("dash-overdue-count")).toHaveText("");
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("dash-pending-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("dash-review-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("dash-overdue-count")).toHaveText("1");
    expect(await ui.hold(pg_vic, p_ben, {"from": "2026-03-01"})).toBe(true);
    expect(await ui.claimAction(pg_vic, c_ada_1, "review")).toBe(true);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("dash-pending-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("dash-review-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("dash-overdue-count")).toHaveText("1");
    await ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=1.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-threshold value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=5`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=20.00 date=2026-03-01`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=40.00 date=2026-03-20`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=10.00 date=2026-03-01`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=5.00 date=2026-03-20`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=20.00 date=2026-03-01`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=20.00 due-total=2.00 overdue-total=2.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=20.00 due-total=2.00 overdue-total=2.00`,
      `CLAIM_REVIEW sheet=${sheet} by=uma person=Ada amount=40.00 date=2026-03-20`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ben amount=10.00 date=2026-03-01`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=10.00 due-total=2.00 overdue-total=2.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=30.00 due-total=4.00 overdue-total=4.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ben amount=5.00 date=2026-03-20`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=15.00 due-total=3.00 overdue-total=2.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=35.00 due-total=5.00 overdue-total=4.00`,
      `CLAIM_SETTLED sheet=${sheet} by=wes person=Ada amount=20.00 date=2026-03-01 number=FY2026-1 due=2.00`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=20.00 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=35.00 due-total=5.00 overdue-total=2.00`,
      `PERSON_HELD sheet=${sheet} by=vic name=Ben from=2026-03-01`,
      `CLAIM_REVIEWED sheet=${sheet} by=vic person=Ada amount=40.00 date=2026-03-20`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Ada amount=40.00 date=2026-03-20`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=60.00 due-total=6.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=75.00 due-total=9.00 overdue-total=2.00`
    ]);
  });
  test("steward dashboard scenario 1", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-04-05");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "clerk-limit", "3.00");
    await ui.setSetting(pg_uma, "floor", "2.00");
    await ui.setSetting(pg_uma, "terms", "10");
    await ui.setSetting(pg_uma, "terms-B", "20");
    await ui.setSetting(pg_uma, "cap", "2.00");
    await ui.setSetting(pg_uma, "proof-threshold", "1.00");
    await ui.setSetting(pg_uma, "grace-days", "3");
    await ui.setSetting(pg_uma, "note-threshold", "2.50");
    await ui.setSetting(pg_uma, "entry-date", "2026-03-01");
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "7.50"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    const c_ben_0 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "3.33"}));
    expect(await ui.claimAction(pg_uma, c_ben_0, "open")).toBe(true);
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    await ui.setSetting(pg_uma, "pot", "33.33");
    await ui.setSetting(pg_uma, "review-sla", "5");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "20.00", "from": "2026-03-16"})).toBe(true);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "A"}));
    expect(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "A", "contact": "ADA@X"})).toBeNull();
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B", "tags": "b, a"}));
    expect(await ui.addPool(pg_uma, "P1")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Cam", "share": "50.00", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ada", "share": "50.00"})).toBe(true);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "3.33", "date": "2026-03-09", "note": "n", "ref": "R-1", "tags": "a, B"}));
    expect(await ui.editPerson(pg_uma, p_cam, {"grade": "A"})).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_0, "void")).toBe(true);
    expect(await ui.addPatron(pg_uma, p_ada, "Cam")).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.delegate(pg_wes, {"user": "uma", "from": "2026-02-25", "to": "2026-03-20"})).toBe(true);
    await ui.refresh(pg_uma);
    expect(await ui.inlineGrade(pg_uma, p_ada, "C")).toBe(true);
    await ui.refresh(pg_wes);
    expect(await ui.transfer(pg_wes, p_cam, `${sheet}-t`)).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.11");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
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
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.hold(pg_wes, p_ada, {"from": "2026-03-01", "to": "2026-03-20"})).toBe(true);
    expect(await ui.addClaim(pg_wes, p_ada, {"amount": "3.33", "date": "2026-03-20", "note": "n", "ref": "R-1"})).toBeNull();
    expect(await ui.setRate(pg_wes, {"grade": "C", "pct": "5.00"})).toBe(true);
    const c_ada_1 = ui.must(await ui.addClaim(pg_wes, p_ada, {"amount": "12.50", "note": "n", "tags": " c "}));
    expect(await ui.pasteClaims(pg_wes, "Ada,10.35,2026-03-20,\nAda,7.77,2026-02-10,paste\nZed,12.50,2026-03-15,")).toBeNull();
    expect(await ui.statementAsOf(pg_wes, p_ada, "2026-03-15")).toBe(false);
    expect(await ui.editPerson(pg_wes, p_ada, {"grade": "A"})).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("4.17");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.11");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.editInline(pg_wes, c_ada_1, "1.00")).toBe(true);
    await ui.refresh(pg_uma);
    expect(await ui.claimAction(pg_uma, c_ada_1, "void")).toBe(true);
    await ui.refresh(pg_wes);
    await ui.setAsOf(pg_wes, "2026-04-02");
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("2026-04-02");
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
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-B value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=2.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=33.33`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=5`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=20.00 from=2026-03-16`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Cam share=50.00 from=2026-03-01 to=2026-03-15`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=50.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=3.33 date=2026-03-09 ref=R-1 tags=a,b`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=A`,
      `CLAIM_VOIDED sheet=${sheet} by=uma person=Ada amount=3.33 date=2026-03-09`,
      `PATRON_ADDED sheet=${sheet} by=uma name=Ada patron=Cam`,
      `DELEGATED sheet=${sheet} by=wes user=uma from=2026-02-25 to=2026-03-20`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C`,
      `PERSON_TRANSFERRED sheet=${sheet} by=wes name=Cam to=${sheet}-t`,
      `PERSON_HELD sheet=${sheet} by=wes name=Ada from=2026-03-01`,
      `RATE_SET sheet=${sheet} by=wes grade=C rate=5.00`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ada amount=12.50 date=2026-03-01 tags=c`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Ada grade=A`,
      `CLAIM_EDITED sheet=${sheet} by=wes person=Ada amount=1.00 date=2026-03-01`,
      `CLAIM_VOIDED sheet=${sheet} by=uma person=Ada amount=1.00 date=2026-03-01`
    ]);
    await ui.clearAsOf(pg_wes);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (A)");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("yes");
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
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("a, b");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-03-01");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due-by")).toHaveText("2026-03-27");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-04-05 due=4.17", "VOID by uma on 2026-04-05 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-tags")).toHaveText("c");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("3.33");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-03-09");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.11");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-04-06");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-05 due=1.11", "VOID by uma on 2026-04-05 due=1.11"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("R-1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("a, b");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-photo")).toHaveText("0");
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
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("1");
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
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("tag-a-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("tag-b-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("tag-c-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("month-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("50.00");
    await expect(pg_wes.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("no");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("rate-month-A-2026-01")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-02")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-03")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-04")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-05")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-06")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-07")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-08")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-09")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-10")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-11")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-12")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-01")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-02")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-03")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-04")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-05")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-06")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-07")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-08")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-09")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-10")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-11")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-B-2026-12")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-C-2026-01")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-02")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-03")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-04")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-05")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-06")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-07")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-08")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-09")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-10")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-11")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-12")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("dash-pending-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("dash-review-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("dash-overdue-count")).toHaveText("0");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-B value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=2.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=33.33`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=5`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=20.00 from=2026-03-16`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Cam share=50.00 from=2026-03-01 to=2026-03-15`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=50.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=3.33 date=2026-03-09 ref=R-1 tags=a,b`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=A`,
      `CLAIM_VOIDED sheet=${sheet} by=uma person=Ada amount=3.33 date=2026-03-09`,
      `PATRON_ADDED sheet=${sheet} by=uma name=Ada patron=Cam`,
      `DELEGATED sheet=${sheet} by=wes user=uma from=2026-02-25 to=2026-03-20`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C`,
      `PERSON_TRANSFERRED sheet=${sheet} by=wes name=Cam to=${sheet}-t`,
      `PERSON_HELD sheet=${sheet} by=wes name=Ada from=2026-03-01`,
      `RATE_SET sheet=${sheet} by=wes grade=C rate=5.00`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ada amount=12.50 date=2026-03-01 tags=c`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Ada grade=A`,
      `CLAIM_EDITED sheet=${sheet} by=wes person=Ada amount=1.00 date=2026-03-01`,
      `CLAIM_VOIDED sheet=${sheet} by=uma person=Ada amount=1.00 date=2026-03-01`
    ]);
  });
  test("steward dashboard scenario 2", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-04-05");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "floor", "2.00");
    await ui.setSetting(pg_uma, "late-pct", "10.00");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-05");
    await ui.setSetting(pg_uma, "proof-threshold", "3.00");
    await ui.setSetting(pg_uma, "perm-void", "steward");
    await ui.setSetting(pg_uma, "grace-days", "0");
    expect(await ui.addHoliday(pg_uma, "2026-03-24")).toBe(true);
    await ui.setSetting(pg_uma, "grace-C", "5");
    expect(await ui.saveTemplate(pg_uma, {"name": "T1", "amount": "12.50", "note": ""})).toBe(true);
    await ui.setSetting(pg_uma, "pot", "33.33");
    await ui.setSetting(pg_uma, "alert-threshold", "1.00");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00", "from": "2026-03-10"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "C", "contact": " Ada@x "}));
    expect(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C", "contact": "ADA@X"})).toBeNull();
    expect(await ui.editPerson(pg_uma, p_cam, {"terms": "3", "termsFrom": "2026-03-12"})).toBe(true);
    expect(await ui.editPerson(pg_uma, p_cam, {"grade": "C"})).toBe(true);
    const c_cam_0 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "10.25", "note": "n", "ref": "inv 7"}));
    expect(await ui.setSettingDated(pg_uma, "floor", "3.00", "2026-03-05", "2.00")).toBe(true);
    expect(await ui.addProof(pg_uma, c_cam_0, "receipt")).toBe(true);
    expect(await ui.hold(pg_uma, p_cam, {"from": "2026-02-10"})).toBe(true);
    await ui.expectAuditView(pg_uma, "", [
      `PERSON_HELD sheet=${sheet} by=uma name=Cam from=2026-02-10`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=uma person=Cam amount=10.25 date=2026-04-05 proofs=1 kind=receipt`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=3.00 from=2026-03-05`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=10.25 date=2026-04-05 ref=inv 7`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=C`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=C terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=n/a overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C contact=ada@x`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00 from=2026-03-10`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=33.33`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=12.50 note=`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-C value=5`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-24`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-void value=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`
    ]);
    expect(await ui.statement(pg_uma, p_cam)).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
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
    expect(await ui.importOpenings(pg_uma, "Cam,P1,1.00")).toBe(1);
    expect(await ui.inlineGrade(pg_uma, p_cam, "A")).toBe(true);
    expect(await ui.exportCsv(pg_uma)).toBe("name,grade,retired-from,due-total\nCam,A,,0.00\n");
    expect(await ui.inlineGrade(pg_uma, p_cam, "C")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "7.50", "from": "2026-03-16", "to": "2026-03-25"})).toBe(true);
    expect(await ui.addLine(pg_uma, c_cam_0, {"label": "x", "qty": "3", "unit": "0.01"})).toBe(true);
    expect(await ui.importOpenings(pg_uma, "Cam,P1,x")).toBeNull();
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
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
    expect(await ui.addComment(pg_uma, c_cam_0, "ok")).toBe(true);
    await ui.sortBy(pg_uma, "due-total");
    expect(await ui.retire(pg_uma, p_cam, "2026-03-05")).toBe(true);
    await ui.showRetired(pg_uma, true);
    expect(await ui.statement(pg_uma, p_cam)).toBe(true);
    await ui.setAsOf(pg_uma, "2026-02-10");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("2026-02-10");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_uma.getByTestId("consolidated-people-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
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
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-void value=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-24`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-C value=5`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=12.50 note=`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=33.33`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=1.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00 from=2026-03-10`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=n/a overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=C terms=3`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=C`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=10.25 date=2026-04-05 ref=inv 7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=3.00 from=2026-03-05`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=uma person=Cam amount=10.25 date=2026-04-05 proofs=1 kind=receipt`,
      `PERSON_HELD sheet=${sheet} by=uma name=Cam from=2026-02-10`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=n/a claims=0`,
      `OPENING_SET sheet=${sheet} by=uma name=Cam period=P1 amount=1.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=C`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=n/a overdue-total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50 from=2026-03-16 to=2026-03-25`,
      `CLAIM_LINE_ADDED sheet=${sheet} by=uma person=Cam amount=0.03 date=2026-04-05 label=x qty=3 unit=0.01`,
      `COMMENT_ADDED sheet=${sheet} by=uma person=Cam amount=0.03 date=2026-04-05 text=ok`,
      `PERSON_RETIRED sheet=${sheet} by=uma name=Cam from=2026-03-05`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=n/a claims=0`
    ]);
    await ui.clearAsOf(pg_uma);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_uma.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (C)");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-statement-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-stated-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-statement-date")).toHaveText("2026-04-05");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-retired")).toHaveText("yes");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-retired-from")).toHaveText("2026-03-05");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-hold")).toHaveText("yes");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-active")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-contact")).toHaveText("ada@x");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-statement-line-line")).toHaveText(["2026-04-05 n/a", "2026-04-05 n/a"]);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-carried")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-amount")).toHaveText("0.03");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-date")).toHaveText("2026-04-05");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due-by")).toHaveText("2026-04-08");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-05 due=n/a"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs")).toHaveText("1");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-ref")).toHaveText("inv 7");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-comments-line")).toHaveText(["uma on 2026-04-05: ok"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-lines-line")).toHaveText(["x 3 x 0.01"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs-receipt")).toHaveText("1");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
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
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("rate-current-A")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-current-B")).toHaveText("10.00");
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
    await expect(pg_uma.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("month-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-01")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-02")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-03")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-04")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-05")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-06")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-07")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-08")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-09")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-10")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-11")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-12")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-B-2026-01")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-02")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-03")).toHaveText("12.50");
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
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-void value=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-24`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-C value=5`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=12.50 note=`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=33.33`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=1.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00 from=2026-03-10`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=n/a overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=C terms=3`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=C`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=10.25 date=2026-04-05 ref=inv 7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=3.00 from=2026-03-05`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=uma person=Cam amount=10.25 date=2026-04-05 proofs=1 kind=receipt`,
      `PERSON_HELD sheet=${sheet} by=uma name=Cam from=2026-02-10`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=n/a claims=0`,
      `OPENING_SET sheet=${sheet} by=uma name=Cam period=P1 amount=1.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=C`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=n/a overdue-total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50 from=2026-03-16 to=2026-03-25`,
      `CLAIM_LINE_ADDED sheet=${sheet} by=uma person=Cam amount=0.03 date=2026-04-05 label=x qty=3 unit=0.01`,
      `COMMENT_ADDED sheet=${sheet} by=uma person=Cam amount=0.03 date=2026-04-05 text=ok`,
      `PERSON_RETIRED sheet=${sheet} by=uma name=Cam from=2026-03-05`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=n/a claims=0`
    ]);
  });
  test("steward dashboard scenario 3", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "floor", "2.00");
    await ui.setSetting(pg_uma, "terms", "10");
    await ui.setSetting(pg_uma, "late-pct", "10.00");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-15");
    await ui.setSetting(pg_uma, "period-numbering-from", "2026-03-01");
    await ui.setSetting(pg_uma, "cap", "2.00");
    await ui.setSetting(pg_uma, "perm-open", "clerk");
    await ui.setSetting(pg_uma, "note-threshold", "1.00");
    await ui.setSetting(pg_uma, "entry-date", "2026-03-05");
    expect(await ui.addHoliday(pg_uma, "2026-03-13")).toBe(true);
    expect(await ui.addVoidReason(pg_uma, "late")).toBe(true);
    expect(await ui.addVoidReason(pg_uma, "error")).toBe(true);
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "20.00"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "C"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B"}));
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    await ui.setSetting(pg_uma, "fiscal-start-month", "7");
    expect(await ui.setSettingDated(pg_uma, "rounding", "half-up", "2026-03-01", "half-up")).toBe(true);
    await ui.setSetting(pg_uma, "proof-kinds", "receipt");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "5.00", "from": "2026-03-10", "to": "2026-03-12"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P2", "from": "2026-03-16", "to": "2026-03-31"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B", "terms": "3"}));
    expect(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "A", "contact": " Ada@x "})).toBeNull();
    const pl_ada_1 = ui.must(await ui.addPlan(pg_uma, p_ada, {"amount": "12.50", "start": "2026-03-01", "end": "2026-04-30", "day": "31"}));
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    await ui.setToday(pg_uma, "2026-04-07");
    await ui.setToday(pg_uma, "2026-05-04");
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "99.95", "ref": " r-1 ", "tags": "a, B"}));
    expect(await ui.pasteClaims(pg_uma, "Ada,10.25,,a, b\nAda,4.00,2026-03-20,paste")).toBe(2);
    const c_ada_1 = await ui.claimAt(pg_uma, p_ada, 1);
    const c_ada_2 = await ui.claimAt(pg_uma, p_ada, 2);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.claimAction(pg_vic, c_ada_1, "settle")).toBe(true);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("14.25");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("2.20");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.10");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("14.25");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("2.20");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("1.10");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("2.20");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("2.20");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-crew-due-total")).toHaveText("");
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.redate(pg_wes, c_ada_2, "2026-03-01")).toBe(true);
    expect(await ui.setRate(pg_wes, {"grade": "B", "pct": "7.50", "from": "2026-03-01", "to": "2026-03-12"})).toBe(true);
    const c_ada_3 = ui.must(await ui.addClaim(pg_wes, p_ada, {"amount": "1.00"}));
    expect(await ui.claimAction(pg_wes, c_ada_2, "settle")).toBe(true);
    expect(await ui.claimAction(pg_wes, c_ada_3, "open")).toBe(false);
    await ui.setToday(pg_wes, "2026-05-22");
    expect(await ui.watch(pg_wes, p_ada, true)).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("14.25");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("2.20");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("1.10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("14.25");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("2.20");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("2.20");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("2.20");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.claimAction(pg_wes, c_ada_0, "delete")).toBe(true);
    expect(await ui.statementAsOf(pg_wes, p_ada, "2026-04-02")).toBe(true);
    await ui.refresh(pg_uma);
    expect(await ui.claimAction(pg_uma, c_ada_3, "open")).toBe(true);
    await ui.setSetting(pg_uma, "policy-date", "2026-03-15");
    await ui.setAsOf(pg_uma, "2026-03-20");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("2026-03-20");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_uma.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (B)");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
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
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText(["2026-03-10 0.00"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText(["2026-03-10 0.00"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P2-carried")).toHaveText("0.00");
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
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("rate-current-A")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-current-B")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-current-C")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("0");
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
    await expect(pg_uma.getByTestId("summary-void-late-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-void-error-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("classic-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-01")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-A-2026-02")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-A-2026-03")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-A-2026-04")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-A-2026-05")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-A-2026-06")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-A-2026-07")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-A-2026-08")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-A-2026-09")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-A-2026-10")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-A-2026-11")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-A-2026-12")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-01")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-02")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-03")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-04")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-05")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-06")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-07")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-08")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-09")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-10")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-11")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-12")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-C-2026-01")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-02")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-03")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-04")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-05")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-06")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-07")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-08")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-09")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-10")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-11")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-12")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-overdue-count")).toHaveText("");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-open value=clerk`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-05`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=late`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=fiscal-start-month value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=rounding value=half-up from=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-kinds value=receipt`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00 from=2026-03-10 to=2026-03-12`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Ada amount=12.50 start=2026-03-01 day=31 end=2026-04-30`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=99.95 date=2026-03-05 ref=r-1 tags=a,b`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-03-05`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-03-05`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=10.25 due-total=1.10 overdue-total=1.10`,
      `TOTALS sheet=${sheet} by=uma claimed-total=10.25 due-total=1.10 overdue-total=1.10`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-20`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-20`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=14.25 due-total=2.00 overdue-total=3.30`,
      `TOTALS sheet=${sheet} by=uma claimed-total=14.25 due-total=2.00 overdue-total=3.30`,
      `CLAIM_SETTLED sheet=${sheet} by=vic person=Ada amount=10.25 date=2026-03-05 number=P1-1 due=1.10`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=14.25 due-total=2.00 overdue-total=2.20`,
      `TOTALS sheet=${sheet} by=vic claimed-total=14.25 due-total=2.00 overdue-total=2.20`,
      `CLAIM_REDATED sheet=${sheet} by=wes person=Ada amount=4.00 date=2026-03-01 old=2026-03-20 new=2026-03-01`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=14.25 due-total=2.20 overdue-total=1.10`,
      `TOTALS sheet=${sheet} by=wes claimed-total=14.25 due-total=2.20 overdue-total=1.10`,
      `RATE_SET sheet=${sheet} by=wes grade=B rate=7.50 from=2026-03-01 to=2026-03-12`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ada amount=1.00 date=2026-03-05`,
      `CLAIM_SETTLED sheet=${sheet} by=wes person=Ada amount=4.00 date=2026-03-01 number=P2-1 due=1.10`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=14.25 due-total=2.20 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=14.25 due-total=2.20 overdue-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=wes name=Ada due-total=2.20`,
      `PERSON_WATCHED sheet=${sheet} by=wes name=Ada`,
      `CLAIM_DELETED sheet=${sheet} by=wes person=Ada amount=99.95 date=2026-03-05`,
      `STATEMENT sheet=${sheet} by=wes name=Ada due-total=0.00 claims=0 asof=2026-04-02`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=1.00 date=2026-03-05`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=15.25 due-total=3.41 overdue-total=1.21`,
      `TOTALS sheet=${sheet} by=uma claimed-total=15.25 due-total=3.41 overdue-total=1.21`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`
    ]);
    await ui.clearAsOf(pg_uma);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_uma.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("consolidated-due-total")).toHaveText("3.41");
    await expect(pg_uma.getByTestId("consolidated-overdue-total")).toHaveText("1.21");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (B)");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("15.25");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("3.41");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("3");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("2026-04-02");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-total")).toHaveText("1.21");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("1.21");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("2.20");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("1.21");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText(["2026-03-10 0.00", "2026-04-07 0.00", "2026-05-04 2.20"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText(["2026-03-10 0.00", "2026-05-04 0.00", "2026-04-02 0.00"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P2-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-amount")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-due")).toHaveText("1.21");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-due-by")).toHaveText("2026-03-10");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-05-04 due=1.00", "OPEN by uma on 2026-05-22 due=1.21"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-amount")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-date")).toHaveText("2026-03-01");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-note")).toHaveText("paste");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("1.10");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-number")).toHaveText("P2-1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-period")).toHaveText("P2");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due-by")).toHaveText("2026-03-25");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-05-04 due=2.00", "OPEN by uma on 2026-05-04 due=2.20", "SETTLED by wes on 2026-05-04 due=1.10"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("10.25");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("a, b");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.10");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("P1-1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due-by")).toHaveText("2026-03-10");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-05-04 due=1.00", "OPEN by uma on 2026-05-04 due=1.10", "SETTLED by vic on 2026-05-04 due=1.10"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("99.95");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DELETED");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-03-10");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-05-04 due=7.50", "DELETED by wes on 2026-05-22 due=7.50"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("r-1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("a, b");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("15.25");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("3.41");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("1.21");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("2.20");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("1.21");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("3.41");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("1.21");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("rate-current-A")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-current-B")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-current-C")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("3.41");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_uma.getByTestId("summary-period-P2-change")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-void-late-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-void-error-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("classic-period-P1-due-total")).toHaveText("2.31");
    await expect(pg_uma.getByTestId("classic-period-P2-due-total")).toHaveText("1.10");
    await expect(pg_uma.getByTestId("classic-due-total")).toHaveText("3.41");
    await expect(pg_uma.getByTestId("tag-a-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("tag-b-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("month-2026-03-due-total")).toHaveText("3.41");
    await expect(pg_uma.getByTestId("rate-month-A-2026-01")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-A-2026-02")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-A-2026-03")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-A-2026-04")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-A-2026-05")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-A-2026-06")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-A-2026-07")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-A-2026-08")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-A-2026-09")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-A-2026-10")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-A-2026-11")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-A-2026-12")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-01")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-02")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-03")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-04")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-05")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-06")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-07")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-08")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-09")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-10")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-11")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-12")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rate-month-C-2026-01")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-02")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-03")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-04")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-05")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-06")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-07")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-08")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-09")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-10")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-11")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-12")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-overdue-count")).toHaveText("");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_1).getByTestId("plan-generated")).toHaveText("0");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_1).getByTestId("plan-next-dates")).toHaveText("");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-open value=clerk`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-05`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=late`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=fiscal-start-month value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=rounding value=half-up from=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-kinds value=receipt`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00 from=2026-03-10 to=2026-03-12`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Ada amount=12.50 start=2026-03-01 day=31 end=2026-04-30`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=99.95 date=2026-03-05 ref=r-1 tags=a,b`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-03-05`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-03-05`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=10.25 due-total=1.10 overdue-total=1.10`,
      `TOTALS sheet=${sheet} by=uma claimed-total=10.25 due-total=1.10 overdue-total=1.10`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-20`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-20`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=14.25 due-total=2.00 overdue-total=3.30`,
      `TOTALS sheet=${sheet} by=uma claimed-total=14.25 due-total=2.00 overdue-total=3.30`,
      `CLAIM_SETTLED sheet=${sheet} by=vic person=Ada amount=10.25 date=2026-03-05 number=P1-1 due=1.10`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=14.25 due-total=2.00 overdue-total=2.20`,
      `TOTALS sheet=${sheet} by=vic claimed-total=14.25 due-total=2.00 overdue-total=2.20`,
      `CLAIM_REDATED sheet=${sheet} by=wes person=Ada amount=4.00 date=2026-03-01 old=2026-03-20 new=2026-03-01`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=14.25 due-total=2.20 overdue-total=1.10`,
      `TOTALS sheet=${sheet} by=wes claimed-total=14.25 due-total=2.20 overdue-total=1.10`,
      `RATE_SET sheet=${sheet} by=wes grade=B rate=7.50 from=2026-03-01 to=2026-03-12`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ada amount=1.00 date=2026-03-05`,
      `CLAIM_SETTLED sheet=${sheet} by=wes person=Ada amount=4.00 date=2026-03-01 number=P2-1 due=1.10`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=14.25 due-total=2.20 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=14.25 due-total=2.20 overdue-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=wes name=Ada due-total=2.20`,
      `PERSON_WATCHED sheet=${sheet} by=wes name=Ada`,
      `CLAIM_DELETED sheet=${sheet} by=wes person=Ada amount=99.95 date=2026-03-05`,
      `STATEMENT sheet=${sheet} by=wes name=Ada due-total=0.00 claims=0 asof=2026-04-02`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=1.00 date=2026-03-05`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=15.25 due-total=3.41 overdue-total=1.21`,
      `TOTALS sheet=${sheet} by=uma claimed-total=15.25 due-total=3.41 overdue-total=1.21`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`
    ]);
  });
});
