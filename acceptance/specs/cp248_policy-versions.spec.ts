import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("policy versions", () => {
  test("policy versions", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-01");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "20.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "clerk-limit", "1.50");
    await ui.setSetting(pg_uma, "cap", "3.00");
    expect(await ui.setSettingDated(pg_uma, "floor", "2.00", "2026-03-05", "")).toBe(true);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.00", "date": "2026-02-20"}));
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "20.00"}));
    const c_ben_0 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "40.00", "date": "2026-02-25"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_1, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ben_0, "open")).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("3.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-policy")).toHaveText("2");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-policy")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("8.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-policy")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("8.00");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("70.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("11.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("11.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("11.00");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("3");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("11.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("watched-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("policy-version")).toHaveText("3");
    await ui.setToday(pg_uma, "2026-03-10");
    await ui.setSetting(pg_uma, "cap", "9.00");
    expect(await ui.setSettingDated(pg_uma, "clerk-limit", "9.00", "2026-02-22", "1.50")).toBe(true);
    await ui.setSetting(pg_uma, "terms", "5");
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.claimAction(pg_wes, c_ada_0, "settle")).toBe(true);
    expect(await ui.claimAction(pg_wes, c_ben_0, "settle")).toBe(true);
    expect(await ui.claimAction(pg_wes, c_ada_1, "settle")).toBe(true);
    await ui.refresh(pg_uma);
    const c_ada_2 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "1.00", "date": "2026-03-10"}));
    expect(await ui.claimAction(pg_uma, c_ada_2, "open")).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-policy")).toHaveText("6");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-policy")).toHaveText("3");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("PENDING");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-policy")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("8.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-policy")).toHaveText("1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("8.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("71.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("13.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("9.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("13.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("watched-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("policy-version")).toHaveText("6");
    await ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=1.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00 from=2026-03-05`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-02-20`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=20.00 date=2026-03-01`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=40.00 date=2026-02-25`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-02-20`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=10.00 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=10.00 due-total=1.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=20.00 date=2026-03-01`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=30.00 due-total=3.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=30.00 due-total=3.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ben amount=40.00 date=2026-02-25`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=40.00 due-total=8.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=70.00 due-total=11.00 overdue-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=3.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=8.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=9.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=9.00 from=2026-02-22`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=5`,
      `CLAIM_SETTLED sheet=${sheet} by=wes person=Ada amount=10.00 date=2026-02-20 number=FY2026-1 due=1.00`,
      `CLAIM_SETTLED sheet=${sheet} by=wes person=Ben amount=40.00 date=2026-02-25 number=FY2026-2 due=8.00`,
      `CLAIM_PENDING sheet=${sheet} by=wes person=Ada amount=20.00 date=2026-03-01`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=1.00 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=1.00 date=2026-03-10`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=31.00 due-total=5.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=71.00 due-total=13.00 overdue-total=0.00`
    ]);
  });
  test("policy versions scenario 1", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "floor", "2.00");
    await ui.setSetting(pg_uma, "terms", "30");
    await ui.setSetting(pg_uma, "late-pct", "10.00");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-15");
    await ui.setSetting(pg_uma, "period-numbering-from", "2026-03-01");
    await ui.setSetting(pg_uma, "terms-C", "3");
    await ui.setSetting(pg_uma, "cap", "2.00");
    await ui.setSetting(pg_uma, "proof-threshold", "3.00");
    expect(await ui.setRole(pg_uma, "wes", "viewer")).toBe(true);
    await ui.setSetting(pg_uma, "grace-days", "0");
    await ui.setSetting(pg_uma, "proof-threshold-C", "0.50");
    expect(await ui.addVoidReason(pg_uma, "dup")).toBe(true);
    expect(await ui.saveTemplate(pg_uma, {"name": "T1", "amount": "3.33", "note": "tpl"})).toBe(true);
    await ui.setSetting(pg_uma, "review-sla", "5");
    await ui.setSetting(pg_uma, "escalate-after", "7");
    await ui.setSetting(pg_uma, "default-grade", "A");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "20.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "5.00", "from": "2026-03-10"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P2", "from": "2026-03-16", "to": "2026-03-31"})).toBe(true);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B", "contact": "ben@x", "tags": "c"}));
    expect(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C", "contact": "ben@x"})).toBeNull();
    expect(await ui.hold(pg_uma, p_cam, {"from": "2026-02-10", "to": "2026-04-02"})).toBe(true);
    expect(await ui.periodAction(pg_uma, "P1", "close")).toBe(true);
    await ui.setToday(pg_uma, "2026-04-29");
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "5.00"})).toBe(true);
    expect(await ui.statement(pg_uma, p_cam)).toBe(true);
    expect(await ui.statementAsOf(pg_uma, p_cam, "2026-03-09")).toBe(false);
    expect(await ui.dups(pg_uma)).toEqual([]);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
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
    await expect(pg_uma.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("watched-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("policy-version")).toHaveText("4");
    expect(await ui.setApprover(pg_uma, p_cam, "vic")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "10.00", "from": "2026-03-10", "to": "2026-03-25"})).toBe(true);
    expect(await ui.statementAsOf(pg_uma, p_cam, "2026-03-01")).toBe(false);
    expect(await ui.importPeople(pg_uma, "Cam,A\nFay,C,3,")).toMatchObject({"added": 1, "updated": 1});
    const p_fay = await ui.personId(pg_uma, "Fay");
    expect(await ui.exportCsv(pg_uma)).toBe("name,grade,retired-from,due-total\nCam,A,,0.00\nFay,C,,n/a\n");
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.withdrawRate(pg_vic, "C", "2026-03-10")).toBe(true);
    expect(await ui.statement(pg_vic, p_fay)).toBe(true);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("0.00");
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
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
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
    await expect(pg_vic.getByTestId("policy-version")).toHaveText("4");
    expect(await ui.hold(pg_vic, p_cam, {"from": "2026-03-05"})).toBe(true);
    await ui.setToday(pg_vic, "2026-05-27");
    expect(await ui.importOpenings(pg_vic, "Cam,P2,x")).toBeNull();
    await ui.setAsOf(pg_vic, "2026-02-10");
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("2026-02-10");
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
    await expect(pg_vic.getByTestId("consolidated-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("sheet-preview")).toHaveText("");
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
    await expect(pg_vic.getByTestId("policy-version")).toHaveText("0");
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
    await expect(pg_vic.getByTestId("summary-pending-late-count")).toHaveText("0");
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
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=30`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=3.00`,
      `ROLE_SET sheet=${sheet} by=uma user=wes role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-C value=0.50`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=dup`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=3.33 note=tpl`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=5`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=escalate-after value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=default-grade value=A`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00 from=2026-03-10`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B contact=ben@x`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_HELD sheet=${sheet} by=uma name=Cam from=2026-02-10`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Cam due-total=0.00`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P2 total=0.00 auto=yes`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=5.00`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=0.00 claims=0`,
      `APPROVER_SET sheet=${sheet} by=uma name=Cam user=vic`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=10.00 from=2026-03-10 to=2026-03-25`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=A`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Fay grade=C terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Fay claimed=0.00 due-total=n/a overdue-total=0.00`,
      `RATE_WITHDRAWN sheet=${sheet} by=vic grade=C from=2026-03-10`,
      `ROLLUP sheet=${sheet} by=vic person=Fay claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `STATEMENT sheet=${sheet} by=vic name=Fay due-total=0.00 claims=0`,
      `PERSON_HELD sheet=${sheet} by=vic name=Cam from=2026-03-05`,
      `SNAPSHOT sheet=${sheet} by=vic name=Cam due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=vic name=Fay due-total=0.00`
    ]);
    await ui.clearAsOf(pg_vic);
    await ui.refresh(pg_vic);
    expect(await ui.archive(pg_vic)).toBe(true);
    expect(await ui.addClaim(pg_vic, p_cam, {"amount": "25.00"})).toBeNull();
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("yes");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("2");
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
    await expect(pg_vic.getByTestId("consolidated-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("sheet-preview")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (A)");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-date")).toHaveText("2026-04-29");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-hold")).toHaveText("yes");
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
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-contact")).toHaveText("ben@x");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("c");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText(["2026-03-20 0.00", "2026-04-29 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-line-line")).toHaveText(["2026-04-29 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-approver")).toHaveText("vic");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-score")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-band")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-timeline-line")).toHaveText(["2026-02-10 hold to 2026-04-02", "2026-03-05 hold", "2026-04-29 grade A"]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-P2-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-name")).toHaveText("Fay (C)");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-statement-date")).toHaveText("2026-04-29");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-active")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-contact")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-snapshot-line")).toHaveText(["2026-04-29 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-statement-line-line")).toHaveText(["2026-04-29 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-approver")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-score")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-band")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-timeline-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-period-P2-carried")).toHaveText("0.00");
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
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
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
    await expect(pg_vic.getByTestId("policy-version")).toHaveText("4");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-claims-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-P2").getByTestId("period-claims-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_vic.getByTestId("summary-period-P2-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-void-dup-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-pending-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("tag-c-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-01")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-02")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-03")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-04")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-05")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-06")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-07")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-08")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-09")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-10")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-11")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-12")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-01")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-02")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-03")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-04")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-05")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-06")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-07")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-08")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-09")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-10")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-11")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-12")).toHaveText("20.00");
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
    await expect(pg_vic.getByTestId("dash-pending-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("dash-review-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("dash-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("role-row-vic").getByTestId("role-value")).toHaveText("steward");
    await expect(pg_vic.getByTestId("role-row-wes").getByTestId("role-value")).toHaveText("viewer");
    await expect(pg_vic.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=30`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=3.00`,
      `ROLE_SET sheet=${sheet} by=uma user=wes role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-C value=0.50`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=dup`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=3.33 note=tpl`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=5`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=escalate-after value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=default-grade value=A`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00 from=2026-03-10`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B contact=ben@x`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_HELD sheet=${sheet} by=uma name=Cam from=2026-02-10`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Cam due-total=0.00`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P2 total=0.00 auto=yes`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=5.00`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=0.00 claims=0`,
      `APPROVER_SET sheet=${sheet} by=uma name=Cam user=vic`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=10.00 from=2026-03-10 to=2026-03-25`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=A`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Fay grade=C terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Fay claimed=0.00 due-total=n/a overdue-total=0.00`,
      `RATE_WITHDRAWN sheet=${sheet} by=vic grade=C from=2026-03-10`,
      `ROLLUP sheet=${sheet} by=vic person=Fay claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `STATEMENT sheet=${sheet} by=vic name=Fay due-total=0.00 claims=0`,
      `PERSON_HELD sheet=${sheet} by=vic name=Cam from=2026-03-05`,
      `SNAPSHOT sheet=${sheet} by=vic name=Cam due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=vic name=Fay due-total=0.00`,
      `SHEET_ARCHIVED sheet=${sheet} by=vic`
    ]);
  });
  test("policy versions scenario 2", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "clerk-limit", "1.50");
    await ui.setSetting(pg_uma, "floor", "0.50");
    await ui.setSetting(pg_uma, "terms", "10");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-05");
    await ui.setSetting(pg_uma, "proof-threshold", "1.00");
    await ui.setSetting(pg_uma, "grace-days", "3");
    expect(await ui.addVoidReason(pg_uma, "error")).toBe(true);
    expect(await ui.addVoidReason(pg_uma, "late")).toBe(true);
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "20.00"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "C"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "C"}));
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    await ui.setSetting(pg_uma, "pot", "100.00");
    await ui.setSetting(pg_uma, "fiscal-start-month", "7");
    expect(await ui.setSettingDated(pg_uma, "rounding", "half-up", "2026-03-01", "half-up")).toBe(true);
    await ui.setSetting(pg_uma, "review-sla", "5");
    await ui.setSetting(pg_uma, "clerk-limit-B", "0.50");
    await ui.setSetting(pg_uma, "perm-today", "steward");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "12.50"})).toBe(true);
    expect(await ui.generatePeriods(pg_uma, "2026-02-01", "2026-04-30")).toBe(3);
    expect(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "C", "terms": "3"})).toBeNull();
    expect(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "A", "contact": " Ada@x "})).toBeNull();
    const p_dot = ui.must(await ui.addPerson(pg_uma, {"name": "Dot", "grade": "A"}));
    expect(await ui.setTodayTry(pg_uma, "2026-04-15")).toBe(false);
    expect(await ui.statement(pg_uma, p_dot)).toBe(true);
    expect(await ui.hold(pg_uma, p_dot, {"from": "2026-03-15"})).toBe(true);
    const c_dot_0 = ui.must(await ui.quickAdd(pg_uma, {"name": "Dot", "amount": "99.95"}));
    expect(await ui.importRates(pg_uma, "A,20.00\nC,7.50,2026-03-05")).toBe(2);
    expect(await ui.importPeople(pg_uma, "Eve,A\nFay,B,,")).toMatchObject({"added": 2, "updated": 0});
    const p_eve = await ui.personId(pg_uma, "Eve");
    const p_fay = await ui.personId(pg_uma, "Fay");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_dot).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_dot).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-due")).toHaveText("19.99");
    await expect(pg_uma.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_eve).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_eve).getByTestId("person-due-total")).toHaveText("0.00");
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
    await expect(pg_uma.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("watched-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("policy-version")).toHaveText("4");
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "12.50", "from": "2026-03-01", "to": "2026-03-12"})).toBe(true);
    expect(await ui.editPerson(pg_uma, p_eve, {"terms": "3"})).toBe(true);
    expect(await ui.importPeople(pg_uma, "Dot,B\nFay,A,3,")).toMatchObject({"added": 0, "updated": 2});
    expect(await ui.periodAction(pg_uma, "2026-03", "close")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_dot_0, "void")).toBe(false);
    expect(await ui.addComment(pg_uma, c_dot_0, "see note")).toBe(true);
    expect(await ui.addClaim(pg_uma, p_dot, {"amount": "4.00", "date": "2026-03-01", "note": "n", "ref": "R-2", "tags": "a"})).toBeNull();
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_dot).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_dot).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-due")).toHaveText("12.49");
    await expect(pg_uma.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_eve).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_eve).getByTestId("person-due-total")).toHaveText("0.00");
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
    await expect(pg_uma.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("watched-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("policy-version")).toHaveText("4");
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.delegate(pg_wes, {"user": "vic", "from": "2026-03-01", "to": "2026-03-05"})).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.addClaim(pg_vic, p_eve, {"amount": "25.00", "ref": "R-2"})).toBeNull();
    await ui.setAsOf(pg_vic, "2026-03-05");
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("2026-03-05");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
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
    await expect(pg_vic.getByTestId("consolidated-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("sheet-preview")).toHaveText("");
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
    await expect(pg_vic.getByTestId("policy-version")).toHaveText("0");
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
    await expect(pg_vic.getByTestId("summary-pending-late-count")).toHaveText("0");
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
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=3`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=late`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=100.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=fiscal-start-month value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=rounding value=half-up from=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=5`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit-B value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-today value=steward`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-02 from=2026-02-01 to=2026-02-28`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-03 from=2026-03-01 to=2026-03-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-04 from=2026-04-01 to=2026-04-30`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Dot grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Dot claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `STATEMENT sheet=${sheet} by=uma name=Dot due-total=0.00 claims=0`,
      `PERSON_HELD sheet=${sheet} by=uma name=Dot from=2026-03-15`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Dot amount=99.95 date=2026-03-20`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=7.50 from=2026-03-05`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Eve grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Eve claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Fay grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Fay claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=12.50 from=2026-03-01 to=2026-03-12`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Eve grade=A terms=3`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Dot grade=B`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Fay grade=A terms=3`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=2026-03 total=0.00`,
      `COMMENT_ADDED sheet=${sheet} by=uma person=Dot amount=99.95 date=2026-03-20 text=see note`,
      `DELEGATED sheet=${sheet} by=wes user=vic from=2026-03-01 to=2026-03-05`
    ]);
    await ui.clearAsOf(pg_vic);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-status-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("consolidated-status-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("sheet-preview")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-name")).toHaveText("Dot (B)");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-statement-date")).toHaveText("2026-03-20");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-hold")).toHaveText("yes");
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
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-statement-line-line")).toHaveText(["2026-03-20 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-approver")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-score")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-band")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-timeline-line")).toHaveText(["2026-03-15 hold", "2026-03-20 grade B", "2026-03-20 claim 99.95 DRAFT"]);
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-period-2026-02-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-period-2026-03-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-period-2026-04-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-amount")).toHaveText("99.95");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-due")).toHaveText("12.49");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-period")).toHaveText("2026-04");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-due-by")).toHaveText("2026-04-03");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-20 due=33.31"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-comments-line")).toHaveText(["uma on 2026-03-20: see note"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-shares")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-review-assigned")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-pending-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-policy")).toHaveText("4");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-name")).toHaveText("Eve (A)");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-active")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-contact")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-approver")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-score")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-band")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-timeline-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-period-2026-02-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-period-2026-03-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-period-2026-04-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-name")).toHaveText("Fay (A)");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-active")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-contact")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-approver")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-score")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-band")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-timeline-line")).toHaveText(["2026-03-20 grade A"]);
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-period-2026-02-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-period-2026-03-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-period-2026-04-carried")).toHaveText("0.00");
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
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
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
    await expect(pg_vic.getByTestId("policy-version")).toHaveText("4");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-claims-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-claims-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-claims-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-02-change")).toHaveText("");
    await expect(pg_vic.getByTestId("summary-period-2026-03-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-04-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-status-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-void-error-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-void-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-pending-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("classic-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("month-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-01")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-02")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-03")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-04")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-05")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-06")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-07")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-08")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-09")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-10")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-11")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-12")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-01")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-02")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-03")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-04")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-05")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-06")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-07")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-08")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-09")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-10")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-11")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-12")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-01")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-02")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-03")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-04")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-05")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-06")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-07")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-08")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-09")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-10")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-11")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-12")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_vic.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_vic.getByTestId("dash-overdue-count")).toHaveText("");
    await expect(pg_vic.getByTestId("role-row-wes").getByTestId("role-value")).toHaveText("steward");
    await expect(pg_vic.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=1.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=3`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=late`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=100.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=fiscal-start-month value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=rounding value=half-up from=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=5`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit-B value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-today value=steward`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-02 from=2026-02-01 to=2026-02-28`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-03 from=2026-03-01 to=2026-03-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-04 from=2026-04-01 to=2026-04-30`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Dot grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Dot claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `STATEMENT sheet=${sheet} by=uma name=Dot due-total=0.00 claims=0`,
      `PERSON_HELD sheet=${sheet} by=uma name=Dot from=2026-03-15`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Dot amount=99.95 date=2026-03-20`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=7.50 from=2026-03-05`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Eve grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Eve claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Fay grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Fay claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=12.50 from=2026-03-01 to=2026-03-12`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Eve grade=A terms=3`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Dot grade=B`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Fay grade=A terms=3`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=2026-03 total=0.00`,
      `COMMENT_ADDED sheet=${sheet} by=uma person=Dot amount=99.95 date=2026-03-20 text=see note`,
      `DELEGATED sheet=${sheet} by=wes user=vic from=2026-03-01 to=2026-03-05`
    ]);
  });
  test("policy versions scenario 3", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "floor", "0.50");
    await ui.setSetting(pg_uma, "terms", "10");
    await ui.setSetting(pg_uma, "late-pct", "10.00");
    await ui.setSetting(pg_uma, "terms-B", "20");
    await ui.setSetting(pg_uma, "proof-threshold", "1.00");
    await ui.setSetting(pg_uma, "perm-void", "steward");
    await ui.setSetting(pg_uma, "grace-days", "0");
    await ui.setSetting(pg_uma, "note-threshold", "2.50");
    await ui.setSetting(pg_uma, "entry-date", "2026-03-01");
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "7.50"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C"}));
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "1.00"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    await ui.setSetting(pg_uma, "pot", "100.00");
    await ui.setSetting(pg_uma, "alert-threshold", "3.00");
    await ui.setSetting(pg_uma, "review-threshold", "4.00");
    await ui.setSetting(pg_uma, "pending-sla", "4");
    expect(await ui.addGrade(pg_uma, "D")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "10.00", "from": "2026-03-01"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B", "tags": "c"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "A", "tags": "c"}));
    expect(await ui.addPool(pg_uma, "P1")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ben", "share": "60.00", "from": "2026-03-01", "to": "2026-04-30"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Cam", "share": "40.00", "from": "2026-03-01", "to": "2026-04-30"})).toBe(true);
    expect(await ui.addPool(pg_uma, "P2")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P2", {"member": "Ben", "share": "100.00"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "pool:P2", "share": "10.00"})).toBe(true);
    expect(await ui.editPerson(pg_uma, p_cam, {"terms": "20", "termsFrom": "2026-03-12"})).toBe(true);
    expect(await ui.statementAsOf(pg_uma, p_ben, "2026-04-02")).toBe(false);
    expect(await ui.ratePreview(pg_uma, "B", "12.50")).toEqual({ count: 0, diff: "0.00" });
    const c_cam_0 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "10.35", "date": "2026-03-15", "note": "n", "ref": "inv 7", "tags": "a, B"}));
    expect(await ui.claimAction(pg_uma, c_cam_0, "void")).toBe(false);
    expect(await ui.editInline(pg_uma, c_cam_0, "1.00")).toBe(true);
    expect(await ui.statement(pg_uma, p_cam)).toBe(true);
    expect(await ui.periodAction(pg_uma, "P1", "close")).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.00");
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
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
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
    await expect(pg_uma.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("watched-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("policy-version")).toHaveText("3");
    expect(await ui.statement(pg_uma, p_cam)).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.reassign(pg_wes, c_cam_0, "Ben")).toBe(true);
    expect(await ui.watch(pg_wes, p_ben, true)).toBe(true);
    await ui.setSetting(pg_wes, "policy-date", "2026-03-15");
    expect(await ui.movePerson(pg_wes, p_cam, "up")).toBe(true);
    await ui.refresh(pg_wes);
    expect(await ui.withdrawRate(pg_wes, "A", "start")).toBe(true);
    expect(await ui.claimAction(pg_wes, c_cam_0, "open")).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-0-30")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("watched-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("policy-version")).toHaveText("3");
    expect(await ui.movePerson(pg_wes, p_ben, "down")).toBe(false);
    await ui.refresh(pg_uma);
    expect(await ui.claimAction(pg_uma, c_cam_0, "settle")).toBe(false);
    expect(await ui.dups(pg_uma)).toEqual([]);
    expect(await ui.addPatron(pg_uma, p_ben, "Cam")).toBe(true);
    expect(await ui.inlineGrade(pg_uma, p_cam, "B")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00"})).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_uma.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("consolidated-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-B-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-D-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-open-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("consolidated-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("sheet-preview")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (B)");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-statement-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-statement-date")).toHaveText("2026-03-20");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-terms")).toHaveText("20");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-active")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-contact")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("c");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-statement-line-line")).toHaveText(["2026-03-20 0.00", "2026-03-20 0.00"]);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-approver")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-score")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-band")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-timeline-line")).toHaveText(["2026-03-20 grade B"]);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claims-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben (B)");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-patrons")).toHaveText("Cam (B) 100.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-terms")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-active")).toHaveText("yes");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-0-30")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-open-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-contact")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-tags")).toHaveText("c");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-approver")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-score")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-band")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-timeline-line")).toHaveText(["2026-03-15 claim 1.00 OPEN"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claims-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-amount")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-date")).toHaveText("2026-03-15");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-opened-by")).toHaveText("wes");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due-by")).toHaveText("2026-04-10");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-20 due=3.45", "OPEN by wes on 2026-03-20 due=1.00"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-ref")).toHaveText("inv 7");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-tags")).toHaveText("a, b");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-shares")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-review-assigned")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-pending-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-policy")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("watched-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("policy-version")).toHaveText("3");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-claims-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rate-current-A")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-current-B")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-current-C")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-current-D")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-D-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-D-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-D-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-pending-late-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("classic-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("tag-a-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("tag-b-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("tag-c-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("month-2026-03-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("110.00");
    await expect(pg_uma.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("no");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-share")).toHaveText("60.00");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-cut-P1")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-share")).toHaveText("40.00");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut-P1")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-share")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-cut")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-cut-P1")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-row-P2").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_uma.getByTestId("pool-row-P2").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_uma.getByTestId("pool-member-P2-" + p_ben).getByTestId("pool-share")).toHaveText("100.00");
    await expect(pg_uma.getByTestId("pool-member-P2-" + p_ben).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-P2-" + p_ben).getByTestId("pool-cut-P1")).toHaveText("");
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
    await expect(pg_uma.getByTestId("rate-month-B-2026-01")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-02")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-03")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-04")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-05")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-06")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-07")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-08")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-09")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-10")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-11")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-12")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-01")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-C-2026-02")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-C-2026-03")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-04")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-05")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-06")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-07")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-08")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-09")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-10")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-11")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-12")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-D-2026-01")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-D-2026-02")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-D-2026-03")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-D-2026-04")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-D-2026-05")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-D-2026-06")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-D-2026-07")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-D-2026-08")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-D-2026-09")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-D-2026-10")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-D-2026-11")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-D-2026-12")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-overdue-count")).toHaveText("");
    await expect(pg_uma.getByTestId("role-row-wes").getByTestId("role-value")).toHaveText("steward");
    await expect(pg_uma.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-B value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-void value=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=2.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=100.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-threshold value=4.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pending-sla value=4`,
      `GRADE_ADDED sheet=${sheet} by=uma grade=D`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=10.00 from=2026-03-01`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ben share=60.00 from=2026-03-01 to=2026-04-30`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Cam share=40.00 from=2026-03-01 to=2026-04-30`,
      `POOL_ADDED sheet=${sheet} by=uma name=P2`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P2 name=Ben share=100.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=P2 share=10.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=A terms=20`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=10.35 date=2026-03-15 ref=inv 7 tags=a,b`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Cam amount=1.00 date=2026-03-15`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=0.00 claims=0`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=0.00 claims=0`,
      `CLAIM_REASSIGNED sheet=${sheet} by=wes person=Ben amount=1.00 date=2026-03-15 from=Cam to=Ben`,
      `PERSON_WATCHED sheet=${sheet} by=wes name=Ben`,
      `SETTING_CHANGED sheet=${sheet} by=wes key=policy-date value=2026-03-15`,
      `PERSON_MOVED sheet=${sheet} by=wes name=Cam position=1`,
      `RATE_WITHDRAWN sheet=${sheet} by=wes grade=A`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ben amount=1.00 date=2026-03-15`,
      `ROLLUP sheet=${sheet} by=wes person=Ben claimed=1.00 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=1.00 due-total=1.00 overdue-total=0.00`,
      `PATRON_ADDED sheet=${sheet} by=uma name=Ben patron=Cam`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=B`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`
    ]);
  });
});
