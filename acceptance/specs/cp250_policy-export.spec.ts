import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("policy export", () => {
  test("policy export", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-01");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "20.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    await ui.setSetting(pg_uma, "cap", "3.00");
    expect(await ui.setSettingDated(pg_uma, "terms", "5", "2026-03-10", "")).toBe(true);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.00", "date": "2026-02-20"}));
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "20.00"}));
    const c_ben_0 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "40.00", "date": "2026-03-10"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_1, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ben_0, "open")).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.claimAction(pg_vic, c_ada_0, "settle")).toBe(true);
    expect(await ui.exportPolicy(pg_vic)).toBe("version,from,key,value,claims,due-total\n1,2026-03-01,cap,3.00,1,2.00\n2,2026-03-10,terms,5,1,8.00\n");
    await ui.refresh(pg_uma);
    expect(await ui.hold(pg_uma, p_ben, {"from": "2026-03-10"})).toBe(true);
    expect(await ui.exportPolicy(pg_uma)).toBe("version,from,key,value,claims,due-total\n1,2026-03-01,cap,3.00,1,2.00\n2,2026-03-10,terms,5,1,8.00\n");
  });
  test("policy export scenario 1", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "late-pct", "10.00");
    await ui.setSetting(pg_uma, "grace-days", "3");
    await ui.setSetting(pg_uma, "note-threshold", "1.00");
    expect(await ui.addHoliday(pg_uma, "2026-03-13")).toBe(true);
    expect(await ui.addHoliday(pg_uma, "2026-04-03")).toBe(true);
    await ui.setSetting(pg_uma, "grace-C", "2");
    await ui.setSetting(pg_uma, "proof-threshold-B", "0.50");
    await ui.setSetting(pg_uma, "pot", "100.00");
    await ui.setSetting(pg_uma, "alert-threshold", "1.00");
    await ui.setSetting(pg_uma, "default-grade", "A");
    await ui.setSetting(pg_uma, "max-open", "1");
    expect(await ui.addGrade(pg_uma, "D")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "12.50"})).toBe(true);
    expect(await ui.generatePeriods(pg_uma, "2026-02-01", "2026-04-30")).toBe(3);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "C", "terms": "3", "contact": " Ada@x "}));
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B"}));
    expect(await ui.addPool(pg_uma, "P1")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Cam", "share": "60.00", "from": "2026-03-01", "to": "2026-04-30"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ada", "share": "40.00"})).toBe(true);
    expect(await ui.addCrew(pg_uma, "C1", "Cam")).toBe(true);
    expect(await ui.addCrewMember(pg_uma, "C1", "Ada")).toBe(true);
    expect(await ui.editPerson(pg_uma, p_ada, {"terms": "20", "termsFrom": "2026-03-12"})).toBe(true);
    expect(await ui.periodAction(pg_uma, "2026-03", "close")).toBe(true);
    await ui.setToday(pg_uma, "2026-04-03");
    await ui.expectAuditView(pg_uma, "Ada", [
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=B terms=`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Ada`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=40.00`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`
    ]);
    await ui.expectAuditView(pg_uma, "Ada", [
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=B terms=`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Ada`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=40.00`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`
    ]);
    expect(await ui.statement(pg_uma, p_cam)).toBe(true);
    expect(await ui.editPerson(pg_uma, p_ada, {"terms": "20"})).toBe(true);
    expect(await ui.statementAsOf(pg_uma, p_cam, "2026-03-28")).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("200.00");
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
    await expect(pg_uma.getByTestId("policy-version")).toHaveText("1");
    expect(await ui.inlineGrade(pg_uma, p_ada, "A")).toBe(true);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.25", "date": "2026-03-28", "note": "n"}));
    expect(await ui.exportCsv(pg_uma)).toBe("name,grade,retired-from,due-total\nCam,C,,0.00\nAda,A,,0.00\n");
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.reassign(pg_vic, c_ada_0, "Cam")).toBe(false);
    expect(await ui.claimAction(pg_vic, c_ada_0, "delete")).toBe(true);
    expect(await ui.claimAction(pg_vic, c_ada_0, "restore")).toBe(true);
    expect(await ui.addProof(pg_vic, c_ada_0)).toBe(true);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("200.00");
    await expect(pg_vic.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
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
    await expect(pg_vic.getByTestId("policy-version")).toHaveText("1");
    expect(await ui.addClaim(pg_vic, p_ada, {"amount": "10.35", "date": "2026-03-05", "tags": "a"})).toBeNull();
    await ui.refresh(pg_vic);
    expect(await ui.periodAction(pg_vic, "2026-03", "reopen")).toBe(true);
    expect(await ui.editInline(pg_vic, c_ada_0, "20.00")).toBe(true);
    expect(await ui.inlineGrade(pg_vic, p_cam, "C")).toBe(true);
    expect(await ui.statement(pg_vic, p_cam)).toBe(true);
    await ui.setAsOf(pg_vic, "2026-03-15");
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("2026-03-15");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-D-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-status-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-cut-total")).toHaveText("200.00");
    await expect(pg_vic.getByTestId("sheet-preview")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (C)");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("C");
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
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-cut-total")).toHaveText("110.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText(["2026-03-10 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-approver")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-score")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-band")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-timeline-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-02-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-03-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-04-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (B)");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
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
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("20");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("90.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText(["2026-03-10 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-approver")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-score")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-band")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-timeline-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-02-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-03-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-04-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("200.00");
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
    await expect(pg_vic.getByTestId("policy-version")).toHaveText("1");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-claims-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-claims-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-claims-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-current-D")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-D-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-D-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-D-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-02-change")).toHaveText("");
    await expect(pg_vic.getByTestId("summary-period-2026-03-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-2026-04-change")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-pending-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("classic-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-share")).toHaveText("60.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut")).toHaveText("60.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut-2026-02")).toHaveText("60.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-share")).toHaveText("40.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut")).toHaveText("40.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut-2026-02")).toHaveText("40.00");
    await expect(pg_vic.getByTestId("pool-row-C1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-row-C1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_cam).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_cam).getByTestId("pool-cut")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_cam).getByTestId("pool-cut-2026-02")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut-2026-02")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("crew-row-C1").getByTestId("crew-lead")).toHaveText("Cam (C)");
    await expect(pg_vic.getByTestId("crew-row-C1").getByTestId("crew-due-total")).toHaveText("0.00");
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
    await expect(pg_vic.getByTestId("rate-month-C-2026-01")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-02")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-03")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-04")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-05")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-06")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-07")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-08")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-09")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-10")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-11")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-12")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-D-2026-01")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-02")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-03")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-04")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-05")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-06")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-07")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-08")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-09")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-10")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-11")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-12")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("dash-pending-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("dash-review-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("dash-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("role-row-vic").getByTestId("role-value")).toHaveText("steward");
    await expect(pg_vic.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-03`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-C value=2`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-B value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=100.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=default-grade value=A`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=max-open value=1`,
      `GRADE_ADDED sheet=${sheet} by=uma grade=D`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=12.50`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-02 from=2026-02-01 to=2026-02-28`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-03 from=2026-03-01 to=2026-03-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-04 from=2026-04-01 to=2026-04-30`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C terms=3 contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Cam share=60.00 from=2026-03-01 to=2026-04-30`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=40.00`,
      `CREW_ADDED sheet=${sheet} by=uma name=C1 lead=Cam`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Ada`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=B terms=`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=2026-03 total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Cam due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=2026-02 total=0.00 auto=yes`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=0.00 claims=0`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=B terms=20`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=0.00 claims=0 asof=2026-03-28`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=A`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-03-28`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `CLAIM_DELETED sheet=${sheet} by=vic person=Ada amount=10.25 date=2026-03-28`,
      `CLAIM_RESTORED sheet=${sheet} by=vic person=Ada amount=10.25 date=2026-03-28`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=vic person=Ada amount=10.25 date=2026-03-28 proofs=1`,
      `PERIOD_REOPENED sheet=${sheet} by=vic period=2026-03`,
      `CLAIM_EDITED sheet=${sheet} by=vic person=Ada amount=20.00 date=2026-03-28`,
      `PERSON_EDITED sheet=${sheet} by=vic name=Cam grade=C`,
      `STATEMENT sheet=${sheet} by=vic name=Cam due-total=0.00 claims=0`
    ]);
    await ui.clearAsOf(pg_vic);
    await ui.refresh(pg_vic);
    expect(await ui.archive(pg_vic)).toBe(true);
    expect(await ui.addClaim(pg_vic, p_cam, {"amount": "3.33"})).toBeNull();
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
    await expect(pg_vic.getByTestId("consolidated-grade-D-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-status-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("consolidated-status-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-cut-total")).toHaveText("200.00");
    await expect(pg_vic.getByTestId("sheet-preview")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (C)");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-date")).toHaveText("2026-04-03");
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
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-contact")).toHaveText("ada@x");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-cut-total")).toHaveText("110.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText(["2026-03-10 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-line-line")).toHaveText(["2026-04-03 0.00", "2026-03-28 0.00", "2026-04-03 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-approver")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-score")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-band")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-timeline-line")).toHaveText(["2026-04-03 grade C"]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-02-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-03-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-04-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (A)");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("2026-04-03");
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
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("90.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText(["2026-03-10 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText(["2026-04-03 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-approver")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-score")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-band")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-timeline-line")).toHaveText(["2026-03-28 claim 20.00 DRAFT", "2026-04-03 grade A"]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claims-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-02-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-03-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-04-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-03-28");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("2026-04");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-04-27");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-03 due=1.00", "DELETED by vic on 2026-04-03 due=1.00", "DRAFT by vic on 2026-04-03 due=1.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("1");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-receipt")).toHaveText("1");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-shares")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-review-assigned")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-pending-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-policy")).toHaveText("1");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("200.00");
    await expect(pg_vic.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
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
    await expect(pg_vic.getByTestId("policy-version")).toHaveText("1");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-claims-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-claims-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-claims-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-current-D")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-D-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-D-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-D-active")).toHaveText("0");
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
    await expect(pg_vic.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-pending-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("classic-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("month-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-share")).toHaveText("60.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut")).toHaveText("60.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut-2026-02")).toHaveText("60.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut-2026-03")).toHaveText("60.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-share")).toHaveText("40.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut")).toHaveText("40.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut-2026-02")).toHaveText("40.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut-2026-03")).toHaveText("40.00");
    await expect(pg_vic.getByTestId("pool-row-C1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-row-C1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_cam).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_cam).getByTestId("pool-cut")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_cam).getByTestId("pool-cut-2026-02")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_cam).getByTestId("pool-cut-2026-03")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut-2026-02")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut-2026-03")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("crew-row-C1").getByTestId("crew-lead")).toHaveText("Cam (C)");
    await expect(pg_vic.getByTestId("crew-row-C1").getByTestId("crew-due-total")).toHaveText("0.00");
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
    await expect(pg_vic.getByTestId("rate-month-C-2026-01")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-02")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-03")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-04")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-05")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-06")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-07")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-08")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-09")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-10")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-11")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-12")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-D-2026-01")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-02")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-03")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-04")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-05")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-06")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-07")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-08")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-09")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-10")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-11")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-12")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("dash-pending-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("dash-review-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("dash-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("role-row-vic").getByTestId("role-value")).toHaveText("steward");
    await expect(pg_vic.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-03`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-C value=2`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-B value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=100.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=default-grade value=A`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=max-open value=1`,
      `GRADE_ADDED sheet=${sheet} by=uma grade=D`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=12.50`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-02 from=2026-02-01 to=2026-02-28`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-03 from=2026-03-01 to=2026-03-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-04 from=2026-04-01 to=2026-04-30`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C terms=3 contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Cam share=60.00 from=2026-03-01 to=2026-04-30`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=40.00`,
      `CREW_ADDED sheet=${sheet} by=uma name=C1 lead=Cam`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Ada`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=B terms=`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=2026-03 total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Cam due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=2026-02 total=0.00 auto=yes`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=0.00 claims=0`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=B terms=20`,
      `STATEMENT sheet=${sheet} by=uma name=Cam due-total=0.00 claims=0 asof=2026-03-28`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=A`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-03-28`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `CLAIM_DELETED sheet=${sheet} by=vic person=Ada amount=10.25 date=2026-03-28`,
      `CLAIM_RESTORED sheet=${sheet} by=vic person=Ada amount=10.25 date=2026-03-28`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=vic person=Ada amount=10.25 date=2026-03-28 proofs=1`,
      `PERIOD_REOPENED sheet=${sheet} by=vic period=2026-03`,
      `CLAIM_EDITED sheet=${sheet} by=vic person=Ada amount=20.00 date=2026-03-28`,
      `PERSON_EDITED sheet=${sheet} by=vic name=Cam grade=C`,
      `STATEMENT sheet=${sheet} by=vic name=Cam due-total=0.00 claims=0`,
      `SHEET_ARCHIVED sheet=${sheet} by=vic`
    ]);
  });
  test("policy export scenario 2", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    await ui.setSetting(pg_uma, "clerk-limit", "1.50");
    await ui.setSetting(pg_uma, "floor", "0.50");
    await ui.setSetting(pg_uma, "late-pct", "10.00");
    await ui.setSetting(pg_uma, "terms-A", "3");
    await ui.setSetting(pg_uma, "perm-close", "clerk");
    await ui.setSetting(pg_uma, "note-threshold", "1.00");
    await ui.setSetting(pg_uma, "grace-B", "2");
    await ui.setSetting(pg_uma, "pot", "33.33");
    await ui.setSetting(pg_uma, "fiscal-start-month", "4");
    await ui.setSetting(pg_uma, "review-threshold", "4.00");
    await ui.setSetting(pg_uma, "review-sla", "1");
    await ui.setSetting(pg_uma, "score-mid", "0");
    await ui.setSetting(pg_uma, "score-high", "1");
    expect(await ui.setRole(pg_uma, "vic", "restricted")).toBe(true);
    expect(await ui.addGrade(pg_uma, "D")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "33.33"})).toBe(true);
    expect(await ui.generatePeriods(pg_uma, "2026-02-01", "2026-04-30")).toBe(3);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "C", "tags": "b, a"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    expect(await ui.addPool(pg_uma, "P1")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Cam", "share": "33.33"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ben", "share": "33.33", "from": "2026-03-01", "to": "2026-04-30"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ada", "share": "33.34", "from": "2026-03-01", "to": "2026-04-30"})).toBe(true);
    expect(await ui.addCrew(pg_uma, "C1", "Cam")).toBe(true);
    expect(await ui.addCrewMember(pg_uma, "C1", "Ada")).toBe(true);
    expect(await ui.editPerson(pg_uma, p_ben, {"terms": "3", "termsFrom": "2026-03-01"})).toBe(true);
    await ui.setToday(pg_uma, "2026-03-25");
    expect(await ui.statementAsOf(pg_uma, p_cam, "2026-03-01")).toBe(false);
    expect(await ui.statement(pg_uma, p_ben)).toBe(true);
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    expect(await ui.movePerson(pg_uma, p_ada, "up")).toBe(true);
    expect(await ui.importPeople(pg_uma, "Dot,C\nFay,C,3,")).toMatchObject({"added": 2, "updated": 0});
    const p_dot = await ui.personId(pg_uma, "Dot");
    const p_fay = await ui.personId(pg_uma, "Fay");
    const c_fay_0 = ui.must(await ui.addClaim(pg_uma, p_fay, {"amount": "10.35", "date": "2026-04-02", "note": "n", "ref": "inv 7"}));
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_dot).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_dot).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("38.88");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("5");
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
    expect(await ui.editInline(pg_uma, c_fay_0, "0.04")).toBe(true);
    expect(await ui.hold(pg_uma, p_fay, {"from": "2026-03-05"})).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    await ui.showRetired(pg_vic, true);
    expect(await ui.importRates(pg_vic, "C,5.00\nA,12.50,2026-03-05")).toBe(2);
    await ui.showRetired(pg_vic, true);
    expect(await ui.periodAction(pg_vic, "2026-04", "soft-close")).toBe(false);
    expect(await ui.setRate(pg_vic, {"grade": "B", "pct": "12.50"})).toBe(true);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_cam)).toHaveCount(0);
    await expect(pg_vic.getByTestId("person-row-" + p_ada)).toHaveCount(0);
    await expect(pg_vic.getByTestId("person-row-" + p_ben)).toHaveCount(0);
    await expect(pg_vic.getByTestId("person-row-" + p_dot)).toHaveCount(0);
    await expect(pg_vic.getByTestId("person-row-" + p_fay)).toHaveCount(0);
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("38.88");
    await expect(pg_vic.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("5");
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
    await expect(pg_vic.getByTestId("policy-version")).toHaveText("3");
    await ui.showRetired(pg_vic, true);
    expect(await ui.importRates(pg_vic, "B,33.33\nC,33.33,2026-03-05")).toBe(2);
    await ui.showRetired(pg_vic, true);
    await ui.showRetired(pg_vic, true);
    expect(await ui.search(pg_vic, "a")).toEqual([`${sheet} Cam (C) 0.00`, `${sheet} Ada (A) 0.00`, `${sheet} Fay (C) 0.00`]);
    await ui.showRetired(pg_vic, true);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("5");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-grade-D-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-status-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("consolidated-status-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("consolidated-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-cut-total")).toHaveText("38.88");
    await expect(pg_vic.getByTestId("sheet-preview")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam)).toHaveCount(0);
    await expect(pg_vic.getByTestId("person-row-" + p_ada)).toHaveCount(0);
    await expect(pg_vic.getByTestId("person-row-" + p_ben)).toHaveCount(0);
    await expect(pg_vic.getByTestId("person-row-" + p_dot)).toHaveCount(0);
    await expect(pg_vic.getByTestId("person-row-" + p_fay)).toHaveCount(0);
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("38.88");
    await expect(pg_vic.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("5");
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
    await expect(pg_vic.getByTestId("policy-version")).toHaveText("3");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-02").getByTestId("period-claims-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-03").getByTestId("period-claims-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_vic.getByTestId("period-row-2026-04").getByTestId("period-claims-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-current-D")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-D-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-D-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-D-active")).toHaveText("0");
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
    await expect(pg_vic.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-pending-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("classic-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("tag-a-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("tag-b-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("month-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-share")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut")).toHaveText("11.11");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut-2026-02")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-share")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-cut")).toHaveText("11.11");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-cut-2026-02")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-share")).toHaveText("33.34");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut")).toHaveText("11.11");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut-2026-02")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-row-C1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-row-C1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_cam).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_cam).getByTestId("pool-cut")).toHaveText("16.66");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_cam).getByTestId("pool-cut-2026-02")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut")).toHaveText("16.67");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut-2026-02")).toHaveText("");
    await expect(pg_vic.getByTestId("crew-row-C1").getByTestId("crew-lead")).toHaveText("Cam (C)");
    await expect(pg_vic.getByTestId("crew-row-C1").getByTestId("crew-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rate-month-A-2026-01")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-02")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-03")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-04")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-05")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-06")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-07")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-08")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-09")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-10")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-11")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-A-2026-12")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-month-B-2026-01")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-02")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-03")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-04")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-05")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-06")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-07")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-08")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-09")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-10")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-11")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-B-2026-12")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-C-2026-01")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-02")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-03")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-04")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-C-2026-05")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-C-2026-06")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-C-2026-07")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-C-2026-08")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-C-2026-09")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-C-2026-10")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-C-2026-11")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-C-2026-12")).toHaveText("33.33");
    await expect(pg_vic.getByTestId("rate-month-D-2026-01")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-02")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-03")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-04")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-05")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-06")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-07")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-08")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-09")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-10")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-11")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rate-month-D-2026-12")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_vic.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_vic.getByTestId("dash-overdue-count")).toHaveText("");
    await expect(pg_vic.getByTestId("role-row-vic").getByTestId("role-value")).toHaveText("restricted");
    await expect(pg_vic.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=1.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-A value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-close value=clerk`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-B value=2`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=33.33`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=fiscal-start-month value=4`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-threshold value=4.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=1`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-mid value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-high value=1`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=restricted`,
      `GRADE_ADDED sheet=${sheet} by=uma grade=D`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=33.33`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-02 from=2026-02-01 to=2026-02-28`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-03 from=2026-03-01 to=2026-03-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-04 from=2026-04-01 to=2026-04-30`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=n/a overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Cam share=33.33`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ben share=33.33 from=2026-03-01 to=2026-04-30`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=33.34 from=2026-03-01 to=2026-04-30`,
      `CREW_ADDED sheet=${sheet} by=uma name=C1 lead=Cam`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Ada`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B terms=3`,
      `SNAPSHOT sheet=${sheet} by=uma name=Cam due-total=n/a`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`,
      `STATEMENT sheet=${sheet} by=uma name=Ben due-total=0.00 claims=0`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `PERSON_MOVED sheet=${sheet} by=uma name=Ada position=2`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Dot grade=C`,
      `ROLLUP sheet=${sheet} by=uma person=Dot claimed=0.00 due-total=n/a overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Fay grade=C terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Fay claimed=0.00 due-total=n/a overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Fay amount=10.35 date=2026-04-02 ref=inv 7`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Fay amount=0.04 date=2026-04-02`,
      `PERSON_HELD sheet=${sheet} by=uma name=Fay from=2026-03-05`,
      `RATE_SET sheet=${sheet} by=vic grade=C rate=5.00`,
      `ROLLUP sheet=${sheet} by=vic person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `ROLLUP sheet=${sheet} by=vic person=Dot claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `ROLLUP sheet=${sheet} by=vic person=Fay claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `RATE_SET sheet=${sheet} by=vic grade=A rate=12.50 from=2026-03-05`,
      `RATE_SET sheet=${sheet} by=vic grade=B rate=12.50`,
      `RATE_SET sheet=${sheet} by=vic grade=B rate=33.33`,
      `RATE_SET sheet=${sheet} by=vic grade=C rate=33.33 from=2026-03-05`
    ]);
  });
  test("policy export scenario 3", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "policy-date", "2026-03-15");
    await ui.setSetting(pg_uma, "terms-C", "3");
    expect(await ui.setRole(pg_uma, "vic", "viewer")).toBe(true);
    await ui.setSetting(pg_uma, "grace-days", "0");
    expect(await ui.addVoidReason(pg_uma, "error")).toBe(true);
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "10.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C"}));
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "25.00"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    await ui.setSetting(pg_uma, "pot", "7.77");
    await ui.setSetting(pg_uma, "fiscal-start-month", "4");
    await ui.setSetting(pg_uma, "review-threshold", "1.50");
    await ui.setSetting(pg_uma, "score-log", "on");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "10.00"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A", "terms": "20"})).toBeNull();
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B", "terms": "20"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B"}));
    expect(await ui.editPerson(pg_uma, p_ben, {"terms": "20", "termsFrom": "2026-03-12"})).toBe(true);
    const pl_ben_1 = ui.must(await ui.addPlan(pg_uma, p_ben, {"amount": "4.00", "start": "2026-03-01", "end": "2026-04-30", "day": "15"}));
    const c_cam_0 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "3.33"}));
    expect(await ui.watch(pg_uma, p_ben, true)).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.reassign(pg_wes, c_cam_0, "Ben")).toBe(true);
    await ui.refresh(pg_wes);
    expect(await ui.delegate(pg_wes, {"user": "vic", "from": "2026-03-15", "to": "2026-03-20"})).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.claimAction(pg_vic, c_cam_0, "void", "error")).toBe(false);
    expect(await ui.statementAsOf(pg_vic, p_ben, "2026-02-25")).toBe(false);
    expect(await ui.editClaim(pg_vic, c_cam_0, {"amount": "1.00"})).toBe(false);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
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
    await expect(pg_vic.getByTestId("policy-version")).toHaveText("0");
    expect(await ui.periodAction(pg_vic, "P1", "close")).toBe(false);
    expect(await ui.ratePreview(pg_vic, "B", "7.50")).toEqual({ count: 0, diff: "0.00" });
    expect(await ui.editClaim(pg_vic, c_cam_0, {"date": "2026-03-05"})).toBe(false);
    expect(await ui.editPerson(pg_vic, p_cam, {"grade": "C", "gradeFrom": "2026-03-05"})).toBe(false);
    expect(await ui.addLine(pg_vic, c_cam_0, {"label": "x", "qty": "1", "unit": "2.50"})).toBe(false);
    expect(await ui.hold(pg_vic, p_cam, {"from": "2026-02-10"})).toBe(false);
    await ui.refresh(pg_wes);
    expect(await ui.flag(pg_wes, p_ben, "late", "2026-03-12")).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
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
    await expect(pg_wes.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
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
    await expect(pg_wes.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("watched-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("policy-version")).toHaveText("0");
    expect(await ui.ratePreview(pg_wes, "A", "5.00")).toEqual({ count: 0, diff: "0.00" });
    expect(await ui.exportCsv(pg_wes)).toBe("name,grade,retired-from,due-total\nBen,B,,0.00\nCam,B,,0.00\n");
    expect(await ui.claimAction(pg_wes, c_cam_0, "open")).toBe(true);
    expect(await ui.retire(pg_wes, p_cam, "2026-03-15")).toBe(true);
    await ui.setAsOf(pg_wes, "2026-02-25");
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("2026-02-25");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-status-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("sheet-preview")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-61")).toHaveText("0.00");
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
    await expect(pg_wes.getByTestId("my-reviews-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("watched-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("policy-version")).toHaveText("0");
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
    await expect(pg_wes.getByTestId("summary-pending-late-count")).toHaveText("0");
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
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=3`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=7.77`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=fiscal-start-month value=4`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-threshold value=1.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-log value=on`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=10.00`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B terms=20`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B terms=20`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Ben amount=4.00 start=2026-03-01 day=15 end=2026-04-30`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=3.33 date=2026-03-10`,
      `PERSON_WATCHED sheet=${sheet} by=uma name=Ben`,
      `CLAIM_REASSIGNED sheet=${sheet} by=wes person=Ben amount=3.33 date=2026-03-10 from=Cam to=Ben`,
      `DELEGATED sheet=${sheet} by=wes user=vic from=2026-03-15 to=2026-03-20`,
      `PERSON_FLAGGED sheet=${sheet} by=wes name=Ben reason=late until=2026-03-12`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ben amount=3.33 date=2026-03-10`,
      `ROLLUP sheet=${sheet} by=wes person=Ben claimed=3.33 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=3.33 due-total=1.00 overdue-total=0.00`,
      `PERSON_RETIRED sheet=${sheet} by=wes name=Cam from=2026-03-15`
    ]);
    await ui.clearAsOf(pg_wes);
    await ui.refresh(pg_wes);
    expect(await ui.archive(pg_wes)).toBe(true);
    await ui.showRetired(pg_wes, true);
    expect(await ui.addClaim(pg_wes, p_cam, {"amount": "4.00"})).toBeNull();
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("yes");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-grade-B-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-status-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-OPEN-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("consolidated-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-open-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("consolidated-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("sheet-preview")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben (B)");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("3.33");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("1.00");
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
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-active")).toHaveText("yes");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aged-0-30")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-open-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-contact")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-flag-shown")).toHaveText("late");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-approver")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-score")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-band")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-timeline-line")).toHaveText(["2026-03-10 claim 3.33 OPEN"]);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claims-OPEN-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-amount")).toHaveText("3.33");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-date")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-opened-by")).toHaveText("wes");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due-by")).toHaveText("2026-03-30");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=1.00", "OPEN by wes on 2026-03-10 due=1.00"]);
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
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-shares")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-review-assigned")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-pending-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-policy")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (B)");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-retired")).toHaveText("yes");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-retired-from")).toHaveText("2026-03-15");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-terms")).toHaveText("");
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
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-approver")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-score")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-band")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-timeline-line")).toHaveText(["2026-03-15 retired"]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("3.33");
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
    await expect(pg_wes.getByTestId("watched-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("policy-version")).toHaveText("0");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-claims-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-void-error-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-pending-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("month-2026-03-due-total")).toHaveText("1.00");
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
    await expect(pg_wes.getByTestId("rate-month-B-2026-01")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-02")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-03")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-04")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-05")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-06")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-07")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-08")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-09")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-10")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-11")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-12")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-01")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-02")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-03")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-04")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-05")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-06")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-07")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-08")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-09")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-10")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-11")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-12")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("dash-pending-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("dash-review-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("dash-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("role-row-vic").getByTestId("role-value")).toHaveText("viewer");
    await expect(pg_wes.getByTestId("role-row-wes").getByTestId("role-value")).toHaveText("steward");
    await expect(pg_wes.getByTestId("note-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("plan-row-" + pl_ben_1).getByTestId("plan-generated")).toHaveText("0");
    await expect(pg_wes.getByTestId("plan-row-" + pl_ben_1).getByTestId("plan-next-dates")).toHaveText("2026-03-15, 2026-04-15");
    await expect(pg_wes.getByTestId("plan-row-" + pl_ben_1).getByTestId("plan-paused")).toHaveText("no");
    await expect(pg_wes.getByTestId("plan-row-" + pl_ben_1).getByTestId("plan-change-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=3`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=7.77`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=fiscal-start-month value=4`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-threshold value=1.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=score-log value=on`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=10.00`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B terms=20`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B terms=20`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Ben amount=4.00 start=2026-03-01 day=15 end=2026-04-30`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=3.33 date=2026-03-10`,
      `PERSON_WATCHED sheet=${sheet} by=uma name=Ben`,
      `CLAIM_REASSIGNED sheet=${sheet} by=wes person=Ben amount=3.33 date=2026-03-10 from=Cam to=Ben`,
      `DELEGATED sheet=${sheet} by=wes user=vic from=2026-03-15 to=2026-03-20`,
      `PERSON_FLAGGED sheet=${sheet} by=wes name=Ben reason=late until=2026-03-12`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ben amount=3.33 date=2026-03-10`,
      `ROLLUP sheet=${sheet} by=wes person=Ben claimed=3.33 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=3.33 due-total=1.00 overdue-total=0.00`,
      `PERSON_RETIRED sheet=${sheet} by=wes name=Cam from=2026-03-15`,
      `SHEET_ARCHIVED sheet=${sheet} by=wes`
    ]);
  });
});
