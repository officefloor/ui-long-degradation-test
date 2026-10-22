import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("rate calendar", () => {
  test("rate calendar", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00", "from": "2026-02-15"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00", "from": "2026-05-01", "to": "2026-07-31"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "5.00"})).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("rate-current-A")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-current-B")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-current-C")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-01")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-02")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-03")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-04")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-05")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-06")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-07")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-08")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-09")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-10")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-11")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rate-month-A-2026-12")).toHaveText("n/a");
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
    expect(await ui.importRates(pg_uma, "A,30.00,2026-12-01\nC,1.00,2026-01-01")).toBe(2);
    await ui.setToday(pg_uma, "2027-01-10");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("rate-current-A")).toHaveText("30.00");
    await expect(pg_uma.getByTestId("rate-current-B")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-current-C")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rate-month-A-2027-01")).toHaveText("30.00");
    await expect(pg_uma.getByTestId("rate-month-A-2027-02")).toHaveText("30.00");
    await expect(pg_uma.getByTestId("rate-month-A-2027-03")).toHaveText("30.00");
    await expect(pg_uma.getByTestId("rate-month-A-2027-04")).toHaveText("30.00");
    await expect(pg_uma.getByTestId("rate-month-A-2027-05")).toHaveText("30.00");
    await expect(pg_uma.getByTestId("rate-month-A-2027-06")).toHaveText("30.00");
    await expect(pg_uma.getByTestId("rate-month-A-2027-07")).toHaveText("30.00");
    await expect(pg_uma.getByTestId("rate-month-A-2027-08")).toHaveText("30.00");
    await expect(pg_uma.getByTestId("rate-month-A-2027-09")).toHaveText("30.00");
    await expect(pg_uma.getByTestId("rate-month-A-2027-10")).toHaveText("30.00");
    await expect(pg_uma.getByTestId("rate-month-A-2027-11")).toHaveText("30.00");
    await expect(pg_uma.getByTestId("rate-month-A-2027-12")).toHaveText("30.00");
    await expect(pg_uma.getByTestId("rate-month-B-2027-01")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2027-02")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2027-03")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2027-04")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2027-05")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2027-06")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2027-07")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2027-08")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2027-09")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2027-10")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2027-11")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2027-12")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-C-2027-01")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rate-month-C-2027-02")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rate-month-C-2027-03")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rate-month-C-2027-04")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rate-month-C-2027-05")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rate-month-C-2027-06")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rate-month-C-2027-07")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rate-month-C-2027-08")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rate-month-C-2027-09")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rate-month-C-2027-10")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rate-month-C-2027-11")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rate-month-C-2027-12")).toHaveText("1.00");
    await ui.expectAudit(sheet, [
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=n/a overdue-total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00 from=2026-02-15`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00 from=2026-05-01 to=2026-07-31`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=30.00 from=2026-12-01`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=1.00 from=2026-01-01`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`
    ]);
  });
  test("rate calendar scenario 1", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-04-05");
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "floor", "2.00");
    await ui.setSetting(pg_uma, "terms", "30");
    await ui.setSetting(pg_uma, "late-pct", "10.00");
    await ui.setSetting(pg_uma, "entry-date", "2026-03-05");
    expect(await ui.addHoliday(pg_uma, "2026-03-16")).toBe(true);
    expect(await ui.addHoliday(pg_uma, "2026-04-03")).toBe(true);
    expect(await ui.addVoidReason(pg_uma, "error")).toBe(true);
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "10.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B"}));
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.25"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    await ui.setSetting(pg_uma, "alert-threshold", "1.00");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "20.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "12.50", "from": "2026-03-10"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "A"}));
    expect(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B", "contact": "ben@x", "tags": "a"})).toBeNull();
    expect(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "A", "tags": "a"})).toBeNull();
    expect(await ui.addHoliday(pg_uma, "2026-04-06")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00", "from": "2026-03-10"})).toBe(true);
    expect(await ui.retire(pg_uma, p_ben, "2026-03-05")).toBe(true);
    await ui.showRetired(pg_uma, true);
    expect(await ui.editPerson(pg_uma, p_ben, {"grade": "A", "gradeFrom": "2026-02-10"})).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.delegate(pg_vic, {"user": "wes", "from": "2026-03-01", "to": "2026-03-05"})).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.importPeople(pg_wes, "Eve,C\nFay,A,3,")).toMatchObject({"added": 2, "updated": 0});
    const p_eve = await ui.personId(pg_wes, "Eve");
    const p_fay = await ui.personId(pg_wes, "Fay");
    expect(await ui.inlineGrade(pg_wes, p_eve, "B")).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ben)).toHaveCount(0);
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("3");
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
    expect(await ui.addPatron(pg_wes, p_fay, "Ben")).toBe(true);
    await ui.showRetired(pg_wes, true);
    expect(await ui.editPerson(pg_wes, p_ben, {"terms": "20"})).toBe(true);
    await ui.refresh(pg_vic);
    expect(await ui.delegate(pg_vic, {"user": "wes", "from": "2026-03-09", "to": "2026-04-02"})).toBe(true);
    await ui.refresh(pg_wes);
    await ui.setToday(pg_wes, "2026-05-04");
    expect(await ui.statementAsOf(pg_wes, p_fay, "2026-02-10")).toBe(false);
    expect(await ui.statement(pg_wes, p_ben)).toBe(true);
    expect(await ui.inlineGrade(pg_wes, p_eve, "B")).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_eve).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("3");
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
    expect(await ui.periodAction(pg_wes, "P1", "close")).toBe(true);
    expect(await ui.search(pg_wes, "zz")).toEqual([]);
    expect(await ui.statement(pg_wes, p_fay)).toBe(true);
    expect(await ui.search(pg_wes, "e")).toEqual([`${sheet} Ben (A) 0.00`, `${sheet} Eve (B) 0.00`]);
    expect(await ui.movePerson(pg_wes, p_ben, "down")).toBe(true);
    await ui.refresh(pg_vic);
    expect(await ui.archive(pg_vic)).toBe(true);
    expect(await ui.addClaim(pg_vic, p_fay, {"amount": "0.40"})).toBeNull();
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("yes");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-name")).toHaveText("Eve (B)");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-grade")).toHaveText("B");
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
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-terms")).toHaveText("");
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
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-snapshot-line")).toHaveText(["2026-04-05 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben)).toHaveCount(0);
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-name")).toHaveText("Fay (A)");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-statement-date")).toHaveText("2026-05-04");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-patrons")).toHaveText("Ben (A) 100.00");
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
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-snapshot-line")).toHaveText(["2026-04-05 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-statement-line-line")).toHaveText(["2026-05-04 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("3");
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
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_vic.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_vic.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-void-error-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("classic-due-total")).toHaveText("0.00");
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
    await expect(pg_vic.getByTestId("rate-month-B-2026-01")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-02")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-03")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-04")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-05")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-06")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-07")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-08")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-09")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-10")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-11")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-B-2026-12")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-01")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-02")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-03")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-04")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-05")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-06")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-07")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-08")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-09")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-10")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-11")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-month-C-2026-12")).toHaveText("10.00");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=30`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-05`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-16`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-03`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=1.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50 from=2026-03-10`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-06`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00 from=2026-03-10`,
      `PERSON_RETIRED sheet=${sheet} by=uma name=Ben from=2026-03-05`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=A`,
      `DELEGATED sheet=${sheet} by=vic user=wes from=2026-03-01 to=2026-03-05`,
      `PERSON_ADDED sheet=${sheet} by=wes name=Eve grade=C`,
      `ROLLUP sheet=${sheet} by=wes person=Eve claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=wes name=Fay grade=A terms=3`,
      `ROLLUP sheet=${sheet} by=wes person=Fay claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Eve grade=B`,
      `PATRON_ADDED sheet=${sheet} by=wes name=Fay patron=Ben`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Ben grade=A terms=20`,
      `DELEGATED sheet=${sheet} by=vic user=wes from=2026-03-09 to=2026-04-02`,
      `SNAPSHOT sheet=${sheet} by=wes name=Ben due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=wes name=Eve due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=wes name=Fay due-total=0.00`,
      `STATEMENT sheet=${sheet} by=wes name=Ben due-total=0.00 claims=0`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Eve grade=B`,
      `PERIOD_CLOSED sheet=${sheet} by=wes period=P1 total=0.00`,
      `STATEMENT sheet=${sheet} by=wes name=Fay due-total=0.00 claims=0`,
      `PERSON_MOVED sheet=${sheet} by=wes name=Ben position=2`,
      `SHEET_ARCHIVED sheet=${sheet} by=vic`
    ]);
  });
  test("rate calendar scenario 2", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "terms", "7");
    await ui.setSetting(pg_uma, "late-pct", "5.00");
    await ui.setSetting(pg_uma, "period-numbering-from", "2026-03-01");
    await ui.setSetting(pg_uma, "terms-C", "20");
    await ui.setSetting(pg_uma, "cap", "5.00");
    await ui.setSetting(pg_uma, "note-threshold", "2.50");
    await ui.setSetting(pg_uma, "entry-date", "2026-03-01");
    expect(await ui.addHoliday(pg_uma, "2026-03-24")).toBe(true);
    expect(await ui.addHoliday(pg_uma, "2026-03-13")).toBe(true);
    await ui.setSetting(pg_uma, "proof-threshold-B", "0.50");
    expect(await ui.addVoidReason(pg_uma, "dup")).toBe(true);
    expect(await ui.addVoidReason(pg_uma, "late")).toBe(true);
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "10.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B"}));
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    expect(await ui.setSettingDated(pg_uma, "rounding", "half-up", "2026-03-10", "half-up")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "33.33", "from": "2026-03-01"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P2", "from": "2026-03-16", "to": "2026-03-31"})).toBe(true);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B", "terms": "20", "contact": "ben@x"}));
    expect(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B", "contact": " Ada@x "})).toBeNull();
    const pl_cam_1 = ui.must(await ui.addPlan(pg_uma, p_cam, {"amount": "3.33", "start": "2026-02-20", "end": "2026-04-30", "day": "31"}));
    await ui.setToday(pg_uma, "2026-04-09");
    expect(await ui.ratePreview(pg_uma, "A", "33.33")).toEqual({ count: 0, diff: "0.00" });
    expect(await ui.hold(pg_uma, p_cam, {"from": "2026-02-10"})).toBe(true);
    expect(await ui.addAlias(pg_uma, p_cam, "Al")).toBe(true);
    expect(await ui.generatePlans(pg_uma)).toBe(2);
    const c_cam_0 = await ui.claimAt(pg_uma, p_cam, 0);
    const c_cam_1 = await ui.claimAt(pg_uma, p_cam, 1);
    expect(await ui.periodAction(pg_uma, "P1", "close")).toBe(true);
    expect(await ui.watch(pg_uma, p_cam, true)).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-stated")).toHaveText("no");
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
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("1");
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
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "7.50", "from": "2026-03-16"})).toBe(true);
    const c_cam_2 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "20.00", "date": "2026-04-02", "ref": "R-2"}));
    const c_cam_3 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "3.33", "note": "n", "ref": "R-1", "tags": "b,a,a"}));
    expect(await ui.claimEditOpen(pg_uma, c_cam_3)).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.claimEditOpen(pg_wes, c_cam_3)).toBe(false);
    await ui.refresh(pg_uma);
    expect(await ui.claimEditSave(pg_uma, c_cam_3, {"amount": "99.95"})).toBe(true);
    expect(await ui.periodAction(pg_uma, "P2", "soft-close")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_cam_2, "open")).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-due")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("3");
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
    expect(await ui.setRate(pg_vic, {"grade": "C", "pct": "12.50"})).toBe(true);
    const c_cam_4 = ui.must(await ui.addClaim(pg_vic, p_cam, {"amount": "4.00", "tags": " c "}));
    const c_cam_5 = ui.must(await ui.split(pg_vic, p_cam, c_cam_2, "1.00"));
    expect(await ui.editClaim(pg_vic, c_cam_4, {"amount": "10.25"})).toBe(true);
    await ui.refresh(pg_wes);
    expect(await ui.archive(pg_wes)).toBe(true);
    expect(await ui.addClaim(pg_wes, p_cam, {"amount": "10.35"})).toBeNull();
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("yes");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (B)");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-hold")).toHaveText("yes");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-terms")).toHaveText("20");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-active")).toHaveText("yes");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-aged-0-30")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-open-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-contact")).toHaveText("ben@x");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-aliases")).toHaveText("Al");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText(["2026-03-20 0.00"]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P2-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-amount")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-date")).toHaveText("2026-04-02");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-opened-by")).toHaveText("vic");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-due-by")).toHaveText("2026-04-30");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-log-line")).toHaveText(["OPEN by vic on 2026-04-09 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-amount")).toHaveText("10.25");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-date")).toHaveText("2026-03-01");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-period")).toHaveText("P2");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-due-by")).toHaveText("2026-03-31");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-log-line")).toHaveText(["DRAFT by vic on 2026-04-09 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-late-entry")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-tags")).toHaveText("c");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-amount")).toHaveText("99.95");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-date")).toHaveText("2026-03-01");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-due")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-period")).toHaveText("P2");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-due-by")).toHaveText("2026-03-31");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-09 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-ref")).toHaveText("R-1");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-tags")).toHaveText("a, b");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-amount")).toHaveText("19.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-date")).toHaveText("2026-04-02");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-due-by")).toHaveText("2026-04-30");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-09 due=1.00", "OPEN by uma on 2026-04-09 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-ref")).toHaveText("R-2");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-amount")).toHaveText("3.33");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-date")).toHaveText("2026-03-31");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due-by")).toHaveText("2026-04-28");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-09 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-amount")).toHaveText("3.33");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-date")).toHaveText("2026-02-28");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-period")).toHaveText("P2");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due-by")).toHaveText("2026-03-31");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-09 due=1.00"]);
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
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("4");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_wes.getByTestId("period-row-P2").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_wes.getByTestId("period-row-P2").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_wes.getByTestId("summary-period-P2-change")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("4");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-void-dup-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-void-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("tag-a-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("tag-b-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("tag-c-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("month-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("month-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("month-2026-04-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-01")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-02")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-03")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-04")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-05")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-06")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-07")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-08")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-09")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-10")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-11")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-12")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-01")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-02")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-03")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-04")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-05")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-06")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-07")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-08")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-09")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-10")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-11")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-12")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-01")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-02")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-03")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-month-C-2026-04")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-05")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-06")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-07")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-08")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-09")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-10")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-11")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-12")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("plan-row-" + pl_cam_1).getByTestId("plan-generated")).toHaveText("2");
    await expect(pg_wes.getByTestId("plan-row-" + pl_cam_1).getByTestId("plan-next-dates")).toHaveText("2026-04-30");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=7`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=2.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-01`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-24`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-B value=0.50`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=dup`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=late`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=rounding value=half-up from=2026-03-10`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=33.33 from=2026-03-01`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B terms=20 contact=ben@x`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Cam amount=3.33 start=2026-02-20 day=31 end=2026-04-30`,
      `SNAPSHOT sheet=${sheet} by=uma name=Cam due-total=0.00`,
      `PERSON_HELD sheet=${sheet} by=uma name=Cam from=2026-02-10`,
      `PERSON_ALIAS_ADDED sheet=${sheet} by=uma name=Cam alias=Al`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=3.33 date=2026-02-28`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=3.33 date=2026-03-31`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `PERSON_WATCHED sheet=${sheet} by=uma name=Cam`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=7.50 from=2026-03-16`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=20.00 date=2026-04-02 ref=R-2`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=3.33 date=2026-03-01 ref=R-1 tags=a,b`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Cam amount=99.95 date=2026-03-01`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=uma period=P2 total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Cam amount=20.00 date=2026-04-02`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=20.00 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=20.00 due-total=1.00 overdue-total=0.00`,
      `RATE_SET sheet=${sheet} by=vic grade=C rate=12.50`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Cam amount=4.00 date=2026-03-01 tags=c`,
      `LATE_ENTRY sheet=${sheet} by=vic person=Cam amount=4.00 date=2026-03-01`,
      `CLAIM_SPLIT sheet=${sheet} by=vic person=Cam amount=19.00 date=2026-04-02 into=`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Cam amount=1.00 date=2026-04-02`,
      `ROLLUP sheet=${sheet} by=vic person=Cam claimed=20.00 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=20.00 due-total=2.00 overdue-total=0.00`,
      `CLAIM_EDITED sheet=${sheet} by=vic person=Cam amount=10.25 date=2026-03-01`,
      `SHEET_ARCHIVED sheet=${sheet} by=wes`
    ]);
  });
  test("rate calendar scenario 3", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "clerk-limit", "1.50");
    await ui.setSetting(pg_uma, "terms", "10");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-15");
    await ui.setSetting(pg_uma, "terms-A", "20");
    await ui.setSetting(pg_uma, "proof-threshold", "1.00");
    await ui.setSetting(pg_uma, "perm-settle", "clerk");
    expect(await ui.setRole(pg_uma, "wes", "viewer")).toBe(true);
    await ui.setSetting(pg_uma, "grace-B", "2");
    await ui.setSetting(pg_uma, "proof-threshold-A", "4.00");
    expect(await ui.addVoidReason(pg_uma, "error")).toBe(true);
    expect(await ui.addVoidReason(pg_uma, "late")).toBe(true);
    expect(await ui.saveTemplate(pg_uma, {"name": "T1", "amount": "0.40", "note": "tpl"})).toBe(true);
    await ui.setSetting(pg_uma, "alert-threshold", "3.00");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00", "from": "2026-03-16"})).toBe(true);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B", "contact": " Ada@x ", "tags": "b, a"}));
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    expect(await ui.addPool(pg_uma, "P1")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Cam", "share": "70.00", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ada", "share": "20.00"})).toBe(true);
    expect(await ui.addPool(pg_uma, "P2")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P2", {"member": "Cam", "share": "100.00"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "pool:P2", "share": "10.00"})).toBe(true);
    expect(await ui.addCrew(pg_uma, "C1", "Cam")).toBe(true);
    expect(await ui.addCrewMember(pg_uma, "C1", "Ada")).toBe(true);
    expect(await ui.addAlias(pg_uma, p_ada, " ada ")).toBe(false);
    expect(await ui.pasteClaims(pg_uma, "Cam,12.50,2026-02-10,a, b\nCam,12.50,,paste")).toBe(2);
    const c_cam_0 = await ui.claimAt(pg_uma, p_cam, 0);
    const c_cam_1 = await ui.claimAt(pg_uma, p_cam, 1);
    expect(await ui.addPatron(pg_uma, p_cam, "Ada")).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.transfer(pg_vic, p_cam, `${sheet}-t`)).toBe(true);
    expect(await ui.setSettingDated(pg_vic, "proof-threshold", "1.00", "2026-02-10", "1.00")).toBe(true);
    const c_ada_0 = ui.must(await ui.addClaim(pg_vic, p_ada, {"amount": "20.00", "note": "n", "tags": "a"}));
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.claimAction(pg_wes, c_ada_0, "open")).toBe(false);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DRAFT");
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
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.setRate(pg_wes, {"grade": "A", "pct": "10.00"})).toBe(false);
    await ui.refresh(pg_vic);
    await ui.setToday(pg_vic, "2026-04-16");
    expect(await ui.watch(pg_vic, p_ada, true)).toBe(true);
    expect(await ui.statement(pg_vic, p_ada)).toBe(true);
    await ui.expectClaimTimeline(pg_vic, c_ada_0, [
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ada amount=20.00 date=2026-03-20 tags=a`
    ]);
    const c_ada_1 = ui.must(await ui.addClaim(pg_vic, p_ada, {"amount": "10.35", "date": "2026-03-09", "ref": " r-1 ", "tags": "a"}));
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("2.07");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("4.00");
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
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.bulkOpen(pg_vic, [c_ada_1, c_ada_0])).toEqual({ opened: 2, refused: 0 });
    expect(await ui.setRate(pg_vic, {"grade": "B", "pct": "10.00"})).toBe(true);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("6.07");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("2.07");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (A)");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("30.35");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("6.07");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("2026-04-16");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-total")).toHaveText("2.07");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("yes");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("yes");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("2.07");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("6.07");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText(["2026-03-20 0.00"]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText(["2026-04-16 0.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("10.35");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-03-09");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("2.07");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("vic");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due-by")).toHaveText("2026-04-06");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by vic on 2026-04-16 due=2.07", "OPEN by vic on 2026-04-16 due=2.07"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-ref")).toHaveText("r-1");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-tags")).toHaveText("a");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("vic");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-04-17");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by vic on 2026-03-20 due=4.00", "OPEN by vic on 2026-04-16 due=4.00"]);
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
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("30.35");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("6.07");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("2.07");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("6.07");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("6.07");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("2.07");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("6.07");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-OPEN-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-void-error-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-void-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("classic-due-total")).toHaveText("6.07");
    await expect(pg_vic.getByTestId("tag-a-due-total")).toHaveText("6.07");
    await expect(pg_vic.getByTestId("month-2026-03-due-total")).toHaveText("6.07");
    await expect(pg_vic.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("30.00");
    await expect(pg_vic.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("no");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-share")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-share")).toHaveText("10.00");
    await expect(pg_vic.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-cut")).toHaveText("");
    await expect(pg_vic.getByTestId("pool-row-P2").getByTestId("pool-total-share")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("pool-row-P2").getByTestId("pool-balanced")).toHaveText("no");
    await expect(pg_vic.getByTestId("pool-row-C1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-row-C1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-share")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_vic.getByTestId("crew-row-C1").getByTestId("crew-lead")).toHaveText("");
    await expect(pg_vic.getByTestId("crew-row-C1").getByTestId("crew-due-total")).toHaveText("6.07");
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
    await expect(pg_vic.getByTestId("rate-month-C-2026-01")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-02")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-03")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-04")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-05")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-06")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-07")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-08")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-09")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-10")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-11")).toHaveText("7.50");
    await expect(pg_vic.getByTestId("rate-month-C-2026-12")).toHaveText("7.50");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=1.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-A value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-settle value=clerk`,
      `ROLE_SET sheet=${sheet} by=uma user=wes role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-B value=2`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-A value=4.00`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=late`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=0.40 note=tpl`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=3.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00 from=2026-03-16`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Cam share=70.00 from=2026-03-01 to=2026-03-15`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=20.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P2`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P2 name=Cam share=100.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=P2 share=10.00`,
      `CREW_ADDED sheet=${sheet} by=uma name=C1 lead=Cam`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Ada`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-02-10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-02-10`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=12.50 due-total=1.56 overdue-total=1.56`,
      `TOTALS sheet=${sheet} by=uma claimed-total=12.50 due-total=1.56 overdue-total=1.56`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-03-20`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-03-20`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=25.00 due-total=2.81 overdue-total=1.56`,
      `TOTALS sheet=${sheet} by=uma claimed-total=25.00 due-total=2.81 overdue-total=1.56`,
      `PATRON_ADDED sheet=${sheet} by=uma name=Cam patron=Ada`,
      `PERSON_TRANSFERRED sheet=${sheet} by=vic name=Cam to=${sheet}-t`,
      `TOTALS sheet=${sheet} by=vic claimed-total=0.00 due-total=0.00 overdue-total=0.00`,
      `SETTING_CHANGED sheet=${sheet} by=vic key=proof-threshold value=1.00 from=2026-02-10`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ada amount=20.00 date=2026-03-20 tags=a`,
      `SNAPSHOT sheet=${sheet} by=vic name=Ada due-total=0.00`,
      `PERSON_WATCHED sheet=${sheet} by=vic name=Ada`,
      `STATEMENT sheet=${sheet} by=vic name=Ada due-total=0.00 claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ada amount=10.35 date=2026-03-09 ref=r-1 tags=a`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Ada amount=10.35 date=2026-03-09`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=10.35 due-total=2.07 overdue-total=2.07`,
      `TOTALS sheet=${sheet} by=vic claimed-total=10.35 due-total=2.07 overdue-total=2.07`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Ada amount=20.00 date=2026-03-20`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=30.35 due-total=6.07 overdue-total=2.07`,
      `TOTALS sheet=${sheet} by=vic claimed-total=30.35 due-total=6.07 overdue-total=2.07`,
      `ALERT sheet=${sheet} by=vic name=Ada due-total=6.07`,
      `RATE_SET sheet=${sheet} by=vic grade=B rate=10.00`
    ]);
  });
});
