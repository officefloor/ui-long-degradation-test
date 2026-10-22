import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("review state", () => {
  test("review state", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "20.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "review-threshold", "1.50");
    expect(await ui.setSettingDated(pg_uma, "review-threshold", "3.00", "2026-03-05", "1.50")).toBe(true);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.00", "date": "2026-03-01"}));
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "20.00"}));
    const c_ada_2 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "40.00"}));
    const c_ben_0 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "10.00"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_1, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_2, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ben_0, "open")).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("REVIEW");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("REVIEW");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("FY2026-1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("REVIEW");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("3");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-REVIEW-count")).toHaveText("3");
    await expect(pg_uma.getByTestId("classic-due-total")).toHaveText("1.00");
    expect(await ui.claimAction(pg_uma, c_ada_2, "settle")).toBe(false);
    expect(await ui.editClaim(pg_uma, c_ada_2, {"amount": "1.00"})).toBe(false);
    expect(await ui.claimAction(pg_uma, c_ada_2, "review")).toBe(false);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.claimAction(pg_vic, c_ada_2, "review")).toBe(true);
    expect(await ui.claimAction(pg_vic, c_ada_2, "settle")).toBe(true);
    expect(await ui.claimAction(pg_vic, c_ben_0, "review")).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.claimAction(pg_wes, c_ada_2, "settle")).toBe(false);
    await ui.refresh(pg_uma);
    expect(await ui.claimAction(pg_uma, c_ada_1, "void")).toBe(true);
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-number")).toHaveText("FY2026-2");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("FY2026-1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-number")).toHaveText("FY2026-3");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("60.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("7.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("3.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("7.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("classic-due-total")).toHaveText("7.00");
    await ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-threshold value=1.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-threshold value=3.00 from=2026-03-05`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-03-01`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=20.00 date=2026-03-10`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=40.00 date=2026-03-10`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=10.00 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-03-01 number=FY2026-1`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=10.00 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=10.00 due-total=1.00 overdue-total=0.00`,
      `CLAIM_REVIEW sheet=${sheet} by=uma person=Ada amount=20.00 date=2026-03-10`,
      `CLAIM_REVIEW sheet=${sheet} by=uma person=Ada amount=40.00 date=2026-03-10`,
      `CLAIM_REVIEW sheet=${sheet} by=uma person=Ben amount=10.00 date=2026-03-10`,
      `CLAIM_REVIEWED sheet=${sheet} by=vic person=Ada amount=40.00 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Ada amount=40.00 date=2026-03-10 number=FY2026-2`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=50.00 due-total=5.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=50.00 due-total=5.00 overdue-total=0.00`,
      `CLAIM_SETTLED sheet=${sheet} by=vic person=Ada amount=40.00 date=2026-03-10 number=FY2026-2 due=4.00`,
      `CLAIM_REVIEWED sheet=${sheet} by=vic person=Ben amount=10.00 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Ben amount=10.00 date=2026-03-10 number=FY2026-3`,
      `ROLLUP sheet=${sheet} by=vic person=Ben claimed=10.00 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=60.00 due-total=7.00 overdue-total=0.00`,
      `CLAIM_VOIDED sheet=${sheet} by=uma person=Ada amount=20.00 date=2026-03-10`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=5.00 claims=2`
    ]);
  });
  test("review state scenario 1", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-04-05");
    await ui.setSetting(pg_uma, "clerk-limit", "3.00");
    await ui.setSetting(pg_uma, "floor", "2.00");
    await ui.setSetting(pg_uma, "terms", "10");
    await ui.setSetting(pg_uma, "late-pct", "10.00");
    await ui.setSetting(pg_uma, "period-numbering-from", "2026-03-01");
    await ui.setSetting(pg_uma, "cap", "2.00");
    await ui.setSetting(pg_uma, "entry-date", "2026-03-05");
    expect(await ui.addHoliday(pg_uma, "2026-03-13")).toBe(true);
    await ui.setSetting(pg_uma, "grace-A", "2");
    expect(await ui.addVoidReason(pg_uma, "error")).toBe(true);
    expect(await ui.addVoidReason(pg_uma, "late")).toBe(true);
    expect(await ui.saveTemplate(pg_uma, {"name": "T1", "amount": "10.35", "note": "tpl"})).toBe(true);
    await ui.setSetting(pg_uma, "review-threshold", "4.00");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00", "from": "2026-03-16"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "A", "terms": "20"}));
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B", "terms": "20", "tags": "b, a"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "C", "terms": "3"}));
    expect(await ui.addPool(pg_uma, "P1")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ben", "share": "70.00", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ada", "share": "20.00"})).toBe(true);
    expect(await ui.addPool(pg_uma, "P2")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P2", {"member": "Ben", "share": "100.00"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "pool:P2", "share": "10.00"})).toBe(true);
    const c_cam_0 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "0.04", "tags": "b,a,a"}));
    expect(await ui.pasteClaims(pg_uma, "Ada,25.00,,paste")).toBe(1);
    const c_ada_0 = await ui.claimAt(pg_uma, p_ada, 0);
    expect(await ui.statement(pg_uma, p_cam)).toBe(true);
    expect(await ui.periodAction(pg_uma, "P1", "close")).toBe(true);
    expect(await ui.statement(pg_uma, p_cam)).toBe(true);
    expect(await ui.addComment(pg_uma, c_ada_0, "see note")).toBe(true);
    expect(await ui.addLine(pg_uma, c_cam_0, {"label": "y", "qty": "1", "unit": "2.50"})).toBe(false);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("25.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("3.13");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("25.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("3.13");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("3");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    expect(await ui.addAlias(pg_uma, p_ada, "Al")).toBe(true);
    const c_ada_1 = ui.must(await ui.split(pg_uma, p_ada, c_ada_0, "0.01"));
    await ui.setSetting(pg_uma, "entry-date", "2026-03-01");
    expect(await ui.movePerson(pg_uma, p_ada, "up")).toBe(true);
    await ui.expectAuditView(pg_uma, "Cam", [
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=n/a claims=0`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=n/a claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=0.04 date=2026-03-05 tags=a,b`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=n/a overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C terms=3`
    ]);
    expect(await ui.claimAction(pg_uma, c_cam_0, "delete")).toBe(false);
    expect(await ui.claimAction(pg_uma, c_cam_0, "restore")).toBe(false);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.claimAction(pg_wes, c_ada_0, "settle")).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("25.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("3.12");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("PENDING");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("25.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("4.12");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("3");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await ui.setToday(pg_wes, "2026-04-20");
    expect(await ui.statementAsOf(pg_wes, p_ada, "2026-03-15")).toBe(false);
    expect(await ui.claimAction(pg_wes, c_ada_1, "settle")).toBe(true);
    expect(await ui.setRate(pg_wes, {"grade": "C", "pct": "7.50"})).toBe(true);
    const c_ada_2 = ui.must(await ui.addClaim(pg_wes, p_ada, {"amount": "10.35", "date": "2026-03-01", "tags": "a, B"}));
    expect(await ui.setRate(pg_wes, {"grade": "C", "pct": "7.50"})).toBe(true);
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
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("0.00");
    await ui.expectAudit(sheet, [
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-05`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-A value=2`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=late`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=10.35 note=tpl`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-threshold value=4.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00 from=2026-03-16`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A terms=20`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B terms=20`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=n/a overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ben share=70.00 from=2026-03-01 to=2026-03-15`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=20.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P2`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P2 name=Ben share=100.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=P2 share=10.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=0.04 date=2026-03-05 tags=a,b`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=25.00 date=2026-03-05`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=25.00 date=2026-03-05 number=X-1`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=25.00 due-total=2.00 overdue-total=3.13`,
      `TOTALS sheet=${sheet} by=uma claimed-total=25.00 due-total=2.00 overdue-total=0.00`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=n/a claims=0`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=n/a claims=0`,
      `COMMENT_ADDED sheet=${sheet} by=uma person=Ada amount=25.00 date=2026-03-05 number=X-1 text=see note`,
      `PERSON_ALIAS_ADDED sheet=${sheet} by=uma name=Ada alias=Al`,
      `CLAIM_SPLIT sheet=${sheet} by=uma person=Ada amount=24.99 date=2026-03-05 number=X-1 into=X-2`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=0.01 date=2026-03-05 number=X-2`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=25.00 due-total=2.00 overdue-total=4.12`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-01`,
      `PERSON_MOVED sheet=${sheet} by=uma name=Ada position=1`,
      `CLAIM_PENDING sheet=${sheet} by=wes person=Ada amount=24.99 date=2026-03-05 number=X-1`,
      `SNAPSHOT sheet=${sheet} by=wes name=Ada due-total=2.00`,
      `SNAPSHOT sheet=${sheet} by=wes name=Ben due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=wes name=Cam due-total=n/a`,
      `CLAIM_SETTLED sheet=${sheet} by=wes person=Ada amount=0.01 date=2026-03-05 number=X-2 due=1.00`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=25.00 due-total=2.00 overdue-total=3.12`,
      `RATE_SET sheet=${sheet} by=wes grade=C rate=7.50`,
      `ROLLUP sheet=${sheet} by=wes person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=25.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ada amount=10.35 date=2026-03-01 tags=a,b`,
      `RATE_SET sheet=${sheet} by=wes grade=C rate=7.50`
    ]);
    await ui.clearAsOf(pg_wes);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("3");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("25.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-total")).toHaveText("3.12");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("2.12");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("20");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("3.12");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("3.12");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("Al");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("a, b");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText(["2026-04-05 2.00"]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-amount")).toHaveText("10.35");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-date")).toHaveText("2026-03-01");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("1.29");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due-by")).toHaveText("2026-03-30");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-04-20 due=1.29"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-tags")).toHaveText("a, b");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("0.01");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("paste");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("X-2");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due-by")).toHaveText("2026-04-03");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-log-line")).toHaveText(["OPEN by uma on 2026-04-05 due=1.00", "SETTLED by wes on 2026-04-20 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-split-from")).toHaveText("X-1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("24.99");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("paste");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("3.12");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("PENDING");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("X-1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-04-03");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-05 due=3.13", "OPEN by uma on 2026-04-05 due=3.13", "PENDING by wes on 2026-04-05 due=3.12"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText(["uma on 2026-04-05: see note"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-terms")).toHaveText("20");
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
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-snapshot-line")).toHaveText(["2026-04-05 0.00"]);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-statement-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-stated-total")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-statement-date")).toHaveText("2026-04-05");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-active")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-contact")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText(["2026-04-05 n/a"]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-amount")).toHaveText("0.04");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due-by")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-05 due=n/a"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-tags")).toHaveText("a, b");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("25.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("3.12");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("3");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-void-error-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-void-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("tag-a-due-total")).toHaveText("4.12");
    await expect(pg_wes.getByTestId("tag-b-due-total")).toHaveText("4.12");
    await expect(pg_wes.getByTestId("month-2026-03-due-total")).toHaveText("4.12");
    await expect(pg_wes.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("30.00");
    await expect(pg_wes.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("no");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-share")).toHaveText("70.00");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-share")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-share")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("pool-row-P2").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_wes.getByTestId("pool-row-P2").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_wes.getByTestId("pool-member-P2-" + p_ben).getByTestId("pool-share")).toHaveText("100.00");
    await expect(pg_wes.getByTestId("pool-member-P2-" + p_ben).getByTestId("pool-cut")).toHaveText("");
    await ui.expectAudit(sheet, [
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-05`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-A value=2`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=late`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=10.35 note=tpl`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-threshold value=4.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00 from=2026-03-16`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A terms=20`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B terms=20`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=n/a overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ben share=70.00 from=2026-03-01 to=2026-03-15`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=20.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P2`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P2 name=Ben share=100.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=P2 share=10.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=0.04 date=2026-03-05 tags=a,b`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=25.00 date=2026-03-05`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=25.00 date=2026-03-05 number=X-1`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=25.00 due-total=2.00 overdue-total=3.13`,
      `TOTALS sheet=${sheet} by=uma claimed-total=25.00 due-total=2.00 overdue-total=0.00`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=n/a claims=0`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=n/a claims=0`,
      `COMMENT_ADDED sheet=${sheet} by=uma person=Ada amount=25.00 date=2026-03-05 number=X-1 text=see note`,
      `PERSON_ALIAS_ADDED sheet=${sheet} by=uma name=Ada alias=Al`,
      `CLAIM_SPLIT sheet=${sheet} by=uma person=Ada amount=24.99 date=2026-03-05 number=X-1 into=X-2`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=0.01 date=2026-03-05 number=X-2`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=25.00 due-total=2.00 overdue-total=4.12`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-01`,
      `PERSON_MOVED sheet=${sheet} by=uma name=Ada position=1`,
      `CLAIM_PENDING sheet=${sheet} by=wes person=Ada amount=24.99 date=2026-03-05 number=X-1`,
      `SNAPSHOT sheet=${sheet} by=wes name=Ada due-total=2.00`,
      `SNAPSHOT sheet=${sheet} by=wes name=Ben due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=wes name=Cam due-total=n/a`,
      `CLAIM_SETTLED sheet=${sheet} by=wes person=Ada amount=0.01 date=2026-03-05 number=X-2 due=1.00`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=25.00 due-total=2.00 overdue-total=3.12`,
      `RATE_SET sheet=${sheet} by=wes grade=C rate=7.50`,
      `ROLLUP sheet=${sheet} by=wes person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=25.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ada amount=10.35 date=2026-03-01 tags=a,b`,
      `RATE_SET sheet=${sheet} by=wes grade=C rate=7.50`
    ]);
  });
  test("review state scenario 2", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "clerk-limit", "1.50");
    await ui.setSetting(pg_uma, "floor", "0.50");
    await ui.setSetting(pg_uma, "terms", "7");
    await ui.setSetting(pg_uma, "late-pct", "10.00");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-15");
    await ui.setSetting(pg_uma, "period-numbering-from", "2026-03-01");
    await ui.setSetting(pg_uma, "cap", "5.00");
    await ui.setSetting(pg_uma, "proof-threshold", "1.00");
    await ui.setSetting(pg_uma, "perm-settle", "steward");
    await ui.setSetting(pg_uma, "grace-days", "0");
    await ui.setSetting(pg_uma, "note-threshold", "2.50");
    await ui.setSetting(pg_uma, "entry-date", "2026-03-01");
    await ui.setSetting(pg_uma, "pot", "33.33");
    await ui.setSetting(pg_uma, "alert-threshold", "3.00");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "20.00"})).toBe(true);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B", "terms": "20"}));
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    const pl_cam_1 = ui.must(await ui.addPlan(pg_uma, p_cam, {"amount": "99.95", "start": "2026-02-20", "end": "2026-04-30", "day": "31"}));
    expect(await ui.generatePlans(pg_uma)).toBe(1);
    const c_cam_0 = await ui.claimAt(pg_uma, p_cam, 0);
    expect(await ui.hold(pg_uma, p_ada, {"from": "2026-02-25", "to": "2026-03-15"})).toBe(true);
    expect(await ui.hold(pg_uma, p_ada, {"from": "2026-03-05", "to": "2026-03-09"})).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.reassign(pg_wes, c_cam_0, "Ada")).toBe(true);
    expect(await ui.ratePreview(pg_wes, "C", "12.50")).toEqual({ count: 0, diff: "0.00" });
    const c_cam_0_2 = ui.must(await ui.addClaim(pg_wes, p_cam, {"amount": "1.00", "date": "2026-04-02", "ref": " r-1 "}));
    expect(await ui.movePerson(pg_wes, p_cam, "down")).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    expect(await ui.ratePreview(pg_wes, "B", "20.00")).toEqual({ count: 0, diff: "0.00" });
    await ui.refresh(pg_wes);
    expect(await ui.delegate(pg_wes, {"user": "vic", "from": "2026-02-10", "to": "2026-03-28"})).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.claimAction(pg_vic, c_cam_0_2, "open")).toBe(true);
    expect(await ui.claimAction(pg_vic, c_cam_0_2, "void")).toBe(true);
    expect(await ui.claimAction(pg_vic, c_cam_0, "open")).toBe(true);
    expect(await ui.importPeople(pg_vic, "Eve,A\nFay,B,,")).toMatchObject({"added": 2, "updated": 0});
    const p_eve = await ui.personId(pg_vic, "Eve");
    const p_fay = await ui.personId(pg_vic, "Fay");
    await ui.refresh(pg_wes);
    expect(await ui.claimAction(pg_wes, c_cam_0, "settle")).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("99.95");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("99.95");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("4");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    expect(await ui.statement(pg_wes, p_fay)).toBe(true);
    const c_ada_1 = ui.must(await ui.addClaim(pg_wes, p_ada, {"amount": "10.25", "tags": "a, B"}));
    expect(await ui.statementAsOf(pg_wes, p_cam, "2026-02-10")).toBe(false);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("4");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("99.95");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("5.00");
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
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("2.50");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("10.25");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-03-01");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due-by")).toHaveText("2026-03-19");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-03-10 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-tags")).toHaveText("a, b");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-amount")).toHaveText("99.95");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-date")).toHaveText("2026-02-28");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-number")).toHaveText("X-2");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-opened-by")).toHaveText("vic");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due-by")).toHaveText("2026-03-27");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=19.99", "OPEN by vic on 2026-03-10 due=7.50", "SETTLED by wes on 2026-03-10 due=7.50"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("B");
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
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-contact")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-amount")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-date")).toHaveText("2026-04-02");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-number")).toHaveText("X-1");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-opened-by")).toHaveText("vic");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-due-by")).toHaveText("2026-04-30");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-03-10 due=0.50", "OPEN by vic on 2026-03-10 due=0.50", "VOID by vic on 2026-03-10 due=0.50"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-ref")).toHaveText("r-1");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-name")).toHaveText("Eve");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-terms")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-active")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-contact")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-name")).toHaveText("Fay");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-statement-date")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-terms")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-active")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-contact")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("99.95");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("4");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("tag-a-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("tag-b-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("month-2026-02-due-total")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("month-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("month-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("plan-row-" + pl_cam_1).getByTestId("plan-generated")).toHaveText("1");
    await expect(pg_wes.getByTestId("plan-row-" + pl_cam_1).getByTestId("plan-next-dates")).toHaveText("2026-03-31, 2026-04-30");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=1.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-settle value=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=2.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=33.33`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=3.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B terms=20`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Cam amount=99.95 start=2026-02-20 day=31 end=2026-04-30`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=99.95 date=2026-02-28`,
      `PERSON_HELD sheet=${sheet} by=uma name=Ada from=2026-02-25`,
      `PERSON_HELD sheet=${sheet} by=uma name=Ada from=2026-03-05`,
      `CLAIM_REASSIGNED sheet=${sheet} by=wes person=Ada amount=99.95 date=2026-02-28 from=Cam to=Ada`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Cam amount=1.00 date=2026-04-02 ref=r-1`,
      `PERSON_MOVED sheet=${sheet} by=wes name=Cam position=2`,
      `DELEGATED sheet=${sheet} by=wes user=vic from=2026-02-10 to=2026-03-28`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Cam amount=1.00 date=2026-04-02 number=X-1 for=wes`,
      `ROLLUP sheet=${sheet} by=vic person=Cam claimed=1.00 due-total=0.50 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=1.00 due-total=0.50 overdue-total=0.00`,
      `CLAIM_VOIDED sheet=${sheet} by=vic person=Cam amount=1.00 date=2026-04-02 number=X-1 for=wes`,
      `ROLLUP sheet=${sheet} by=vic person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=0.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Ada amount=99.95 date=2026-02-28 number=X-2 for=wes`,
      `PERSON_ADDED sheet=${sheet} by=vic name=Eve grade=A for=wes`,
      `ROLLUP sheet=${sheet} by=vic person=Eve claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=vic name=Fay grade=B for=wes`,
      `ROLLUP sheet=${sheet} by=vic person=Fay claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_SETTLED sheet=${sheet} by=wes person=Ada amount=99.95 date=2026-02-28 number=X-2 due=7.50`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=99.95 due-total=5.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=99.95 due-total=0.00 overdue-total=0.00`,
      `ALERT sheet=${sheet} by=wes name=Ada due-total=5.00`,
      `STATEMENT sheet=${sheet} by=wes name=Fay due-total=0.00 claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ada amount=10.25 date=2026-03-01 tags=a,b`
    ]);
  });
  test("review state scenario 3", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "clerk-limit", "3.00");
    await ui.setSetting(pg_uma, "proof-threshold", "1.00");
    await ui.setSetting(pg_uma, "note-threshold", "1.00");
    await ui.setSetting(pg_uma, "entry-date", "2026-03-05");
    expect(await ui.addHoliday(pg_uma, "2026-04-03")).toBe(true);
    expect(await ui.addHoliday(pg_uma, "2026-03-13")).toBe(true);
    await ui.setSetting(pg_uma, "pot", "100.00");
    await ui.setSetting(pg_uma, "fiscal-start-month", "4");
    await ui.setSetting(pg_uma, "alert-threshold", "1.00");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "5.00", "from": "2026-03-01"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P2", "from": "2026-03-16", "to": "2026-03-31"})).toBe(true);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B", "terms": "3"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    expect(await ui.addPool(pg_uma, "P1")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Cam", "share": "50.00"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ben", "share": "50.00"})).toBe(true);
    expect(await ui.bulkGrade(pg_uma, [p_cam, p_ben], {"grade": "B", "from": "2026-02-10"})).toBe(2);
    await ui.setToday(pg_uma, "2026-04-27");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "5.00"})).toBe(true);
    expect(await ui.ratePreview(pg_uma, "B", "33.33")).toEqual({ count: 0, diff: "0.00" });
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.delegate(pg_vic, {"user": "wes", "from": "2026-03-15", "to": "2026-03-20"})).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    await ui.refresh(pg_uma);
    expect(await ui.statement(pg_uma, p_cam)).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("100.00");
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
    const c_ben_0 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "25.00"}));
    expect(await ui.addHoliday(pg_uma, "2026-03-11")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ben_0, "void")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "12.50", "from": "2026-03-01", "to": "2026-03-12"})).toBe(true);
    expect(await ui.periodAction(pg_uma, "P1", "soft-close")).toBe(true);
    const c_cam_0 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "20.00", "date": "2026-03-15", "tags": "a, B"}));
    expect(await ui.editInline(pg_uma, c_cam_0, "20.00")).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.50");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("1.88");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("100.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await ui.setToday(pg_uma, "2026-05-11");
    await ui.expectAuditView(pg_uma, "Ben", [
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=0.00`,
      `CLAIM_VOIDED sheet=${sheet} by=uma person=Ben amount=25.00 date=2026-03-05`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=25.00 date=2026-03-05`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ben share=50.00`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B`
    ]);
    await ui.refresh(pg_vic);
    expect(await ui.periodAction(pg_vic, "P1", "reopen")).toBe(true);
    await ui.setAsOf(pg_vic, "2026-03-15");
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("2026-03-15");
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
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
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
    await expect(pg_vic.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("classic-due-total")).toHaveText("0.00");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-05`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-03`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=100.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=fiscal-start-month value=4`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=1.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00 from=2026-03-01`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Cam share=50.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ben share=50.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=B`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B`,
      `SNAPSHOT sheet=${sheet} by=uma name=Cam due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00`,
      `DELEGATED sheet=${sheet} by=vic user=wes from=2026-03-15 to=2026-03-20`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=0.00 claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=25.00 date=2026-03-05`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-11`,
      `CLAIM_VOIDED sheet=${sheet} by=uma person=Ben amount=25.00 date=2026-03-05`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=12.50 from=2026-03-01 to=2026-03-12`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=20.00 date=2026-03-15 tags=a,b`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Cam amount=20.00 date=2026-03-15`,
      `SNAPSHOT sheet=${sheet} by=uma name=Cam due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=0.00`,
      `PERIOD_REOPENED sheet=${sheet} by=vic period=P1`
    ]);
    await ui.clearAsOf(pg_vic);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-date")).toHaveText("2026-04-27");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retired-from")).toHaveText("");
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
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-contact")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-cut-total")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText(["2026-03-20 0.00", "2026-04-27 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-amount")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-date")).toHaveText("2026-03-15");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-period")).toHaveText("P2");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due-by")).toHaveText("2026-03-18");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-27 due=1.50"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-tags")).toHaveText("a, b");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-statement-date")).toHaveText("");
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
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-cut-total")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-snapshot-line")).toHaveText(["2026-03-20 0.00", "2026-04-27 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-amount")).toHaveText("25.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("1.88");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-period")).toHaveText("P2");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due-by")).toHaveText("2026-03-27");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-27 due=1.88", "VOID by uma on 2026-04-27 due=1.88"]);
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
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("7.50");
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
    await expect(pg_vic.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_vic.getByTestId("summary-period-P2-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-status-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-VOID-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("tag-a-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("tag-b-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("month-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-cut")).toHaveText("50.00");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-05`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-03`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=100.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=fiscal-start-month value=4`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=1.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00 from=2026-03-01`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Cam share=50.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ben share=50.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=B`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B`,
      `SNAPSHOT sheet=${sheet} by=uma name=Cam due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00`,
      `DELEGATED sheet=${sheet} by=vic user=wes from=2026-03-15 to=2026-03-20`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=0.00 claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=25.00 date=2026-03-05`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-11`,
      `CLAIM_VOIDED sheet=${sheet} by=uma person=Ben amount=25.00 date=2026-03-05`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=12.50 from=2026-03-01 to=2026-03-12`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=20.00 date=2026-03-15 tags=a,b`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Cam amount=20.00 date=2026-03-15`,
      `SNAPSHOT sheet=${sheet} by=uma name=Cam due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=0.00`,
      `PERIOD_REOPENED sheet=${sheet} by=vic period=P1`
    ]);
  });
});
