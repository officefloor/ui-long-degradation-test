import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("pending bound", () => {
  test("pending bound", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "clerk-limit", "1.50");
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "20.00"}));
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "30.00"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_1, "open")).toBe(true);
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00"})).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.claimAction(pg_vic, c_ada_0, "settle")).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.claimAction(pg_wes, c_ada_0, "settle")).toBe(false);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("3.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("50.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("3.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await ui.refresh(pg_vic);
    expect(await ui.claimAction(pg_vic, c_ada_0, "reject", "no")).toBe(false);
    await ui.refresh(pg_uma);
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    await ui.refresh(pg_wes);
    expect(await ui.claimAction(pg_wes, c_ada_1, "settle")).toBe(true);
    await ui.refresh(pg_uma);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "30.00"})).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("3.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("PENDING");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("yes");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("50.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("3.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=1.50`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=20.00 date=2026-03-10`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=30.00 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=20.00 date=2026-03-10`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=20.00 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=20.00 due-total=2.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=30.00 date=2026-03-10`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=50.00 due-total=5.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=50.00 due-total=5.00 overdue-total=0.00`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=5.00 claims=2`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `CLAIM_SETTLED sheet=${sheet} by=vic person=Ada amount=20.00 date=2026-03-10 number=FY2026-1 due=2.00`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=5.00 claims=2`,
      `CLAIM_PENDING sheet=${sheet} by=wes person=Ada amount=30.00 date=2026-03-10`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=30.00`
    ]);
  });
  test("pending bound scenario 1", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "terms", "10");
    await ui.setSetting(pg_uma, "late-pct", "10.00");
    await ui.setSetting(pg_uma, "proof-threshold", "1.00");
    await ui.setSetting(pg_uma, "grace-days", "0");
    await ui.setSetting(pg_uma, "note-threshold", "1.00");
    await ui.setSetting(pg_uma, "grace-B", "2");
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "5.00"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "33.33", "from": "2026-03-10", "to": "2026-03-25"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A", "contact": " Ada@x "}));
    expect(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "C", "contact": "ADA@X", "tags": "c"})).toBeNull();
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B"}));
    expect(await ui.addPool(pg_uma, "P1")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ada", "share": "50.00", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Cam", "share": "50.00"})).toBe(true);
    expect(await ui.addCrew(pg_uma, "C1", "Ada")).toBe(true);
    expect(await ui.addCrewMember(pg_uma, "C1", "Cam")).toBe(true);
    expect(await ui.addPatron(pg_uma, p_cam, "Ada")).toBe(true);
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    expect(await ui.movePerson(pg_uma, p_cam, "down")).toBe(false);
    expect(await ui.ratePreview(pg_uma, "B", "5.00")).toEqual({ count: 0, diff: "0.00" });
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "0.40", "note": "n"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "void")).toBe(true);
    expect(await ui.importRates(pg_uma, "C,20.00\nB,12.50,2026-03-05")).toBe(2);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
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
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.bulkRetire(pg_uma, [p_cam, p_ada], "2026-04-02")).toBe(2);
    await ui.showRetired(pg_uma, true);
    await ui.setSetting(pg_uma, "policy-date", "");
    expect(await ui.search(pg_uma, "e")).toEqual([`${sheet}-p Ben (B) 0.00`]);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00"})).toBe(true);
    expect(await ui.periodAction(pg_uma, "P1", "close")).toBe(true);
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    await ui.showRetired(pg_uma, true);
    expect(await ui.unretire(pg_uma, p_cam)).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
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
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.ratePreview(pg_uma, "C", "20.00")).toEqual({ count: 0, diff: "0.00" });
    expect(await ui.addHoliday(pg_uma, "2026-04-06")).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    await ui.showRetired(pg_wes, true);
    expect(await ui.merge(pg_wes, p_ada, "Cam")).toBe(false);
    expect(await ui.statementAsOf(pg_wes, p_ada, "2026-02-10")).toBe(false);
    await ui.setToday(pg_wes, "2026-04-07");
    await ui.setAsOf(pg_wes, "2026-04-02");
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("2026-04-02");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (A)");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("2026-03-20");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("yes");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("2026-04-02");
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
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("ada@x");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText(["2026-03-20 0.00"]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText(["2026-03-20 0.00", "2026-03-20 0.00"]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("0.40");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-04-03");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-20 due=1.00", "VOID by uma on 2026-03-20 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (B)");
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
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-patrons")).toHaveText("Ada (A) 100.00");
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
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-retirement-line")).toHaveText(["2026-04-02 to 2026-03-20"]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText(["2026-03-20 0.00"]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-carried")).toHaveText("0.00");
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
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("month-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("50.00");
    await expect(pg_wes.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("no");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("pool-row-C1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_wes.getByTestId("pool-row-C1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_wes.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_wes.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("pool-member-C1-" + p_cam).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_wes.getByTestId("pool-member-C1-" + p_cam).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("crew-row-C1").getByTestId("crew-lead")).toHaveText("Ada (A)");
    await expect(pg_wes.getByTestId("crew-row-C1").getByTestId("crew-due-total")).toHaveText("0.00");
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
    await expect(pg_wes.getByTestId("rate-month-B-2026-01")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-02")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-03")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-04")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-05")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-06")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-07")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-08")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-09")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-10")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-11")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-12")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-01")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-02")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-03")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-04")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-05")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-06")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-07")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-08")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-09")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-10")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-11")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-12")).toHaveText("5.00");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-B value=2`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=33.33 from=2026-03-10 to=2026-03-25`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=50.00 from=2026-03-01 to=2026-03-15`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Cam share=50.00`,
      `CREW_ADDED sheet=${sheet} by=uma name=C1 lead=Ada`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Cam`,
      `PATRON_ADDED sheet=${sheet} by=uma name=Cam patron=Ada`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=0.40 date=2026-03-20`,
      `CLAIM_VOIDED sheet=${sheet} by=uma person=Ada amount=0.40 date=2026-03-20`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50 from=2026-03-05`,
      `PERSON_RETIRED sheet=${sheet} by=uma name=Ada from=2026-04-02`,
      `PERSON_RETIRED sheet=${sheet} by=uma name=Cam from=2026-04-02`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `PERSON_UNRETIRED sheet=${sheet} by=uma name=Cam on=2026-03-20`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-06`,
      `SNAPSHOT sheet=${sheet} by=wes name=Ada due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=wes name=Cam due-total=0.00`
    ]);
    await ui.clearAsOf(pg_wes);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (A)");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("2026-03-20");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("yes");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("2026-04-02");
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
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("ada@x");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText(["2026-03-20 0.00"]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText(["2026-03-20 0.00", "2026-03-20 0.00"]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("0.40");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-04-03");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-20 due=1.00", "VOID by uma on 2026-03-20 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (B)");
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
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-patrons")).toHaveText("Ada (A) 100.00");
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
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-retirement-line")).toHaveText(["2026-04-02 to 2026-03-20"]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText(["2026-03-20 0.00"]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-carried")).toHaveText("0.00");
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
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("month-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("50.00");
    await expect(pg_wes.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("no");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("pool-row-C1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_wes.getByTestId("pool-row-C1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_wes.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_wes.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("pool-member-C1-" + p_cam).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_wes.getByTestId("pool-member-C1-" + p_cam).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("crew-row-C1").getByTestId("crew-lead")).toHaveText("Ada (A)");
    await expect(pg_wes.getByTestId("crew-row-C1").getByTestId("crew-due-total")).toHaveText("0.00");
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
    await expect(pg_wes.getByTestId("rate-month-B-2026-01")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-02")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-03")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-04")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-05")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-06")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-07")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-08")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-09")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-10")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-11")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-12")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-01")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-02")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-03")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-04")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-05")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-06")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-07")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-08")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-09")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-10")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-11")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-12")).toHaveText("5.00");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-B value=2`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=33.33 from=2026-03-10 to=2026-03-25`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=50.00 from=2026-03-01 to=2026-03-15`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Cam share=50.00`,
      `CREW_ADDED sheet=${sheet} by=uma name=C1 lead=Ada`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Cam`,
      `PATRON_ADDED sheet=${sheet} by=uma name=Cam patron=Ada`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=0.40 date=2026-03-20`,
      `CLAIM_VOIDED sheet=${sheet} by=uma person=Ada amount=0.40 date=2026-03-20`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50 from=2026-03-05`,
      `PERSON_RETIRED sheet=${sheet} by=uma name=Ada from=2026-04-02`,
      `PERSON_RETIRED sheet=${sheet} by=uma name=Cam from=2026-04-02`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `PERSON_UNRETIRED sheet=${sheet} by=uma name=Cam on=2026-03-20`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-06`,
      `SNAPSHOT sheet=${sheet} by=wes name=Ada due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=wes name=Cam due-total=0.00`
    ]);
  });
  test("pending bound scenario 2", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "terms", "10");
    await ui.setSetting(pg_uma, "late-pct", "10.00");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-15");
    await ui.setSetting(pg_uma, "terms-C", "3");
    await ui.setSetting(pg_uma, "cap", "2.00");
    expect(await ui.setRole(pg_uma, "vic", "viewer")).toBe(true);
    expect(await ui.addHoliday(pg_uma, "2026-03-16")).toBe(true);
    await ui.setSetting(pg_uma, "grace-A", "5");
    expect(await ui.addVoidReason(pg_uma, "late")).toBe(true);
    expect(await ui.addVoidReason(pg_uma, "error")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "7.50"})).toBe(true);
    expect(await ui.generatePeriods(pg_uma, "2026-02-01", "2026-04-30")).toBe(3);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B"}));
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C", "tags": "b, a"}));
    expect(await ui.importRates(pg_uma, "A,20.00\nA,10.00,2026-03-05")).toBe(2);
    expect(await ui.periodAction(pg_uma, "2026-04", "close")).toBe(true);
    expect(await ui.importPeople(pg_uma, "Cam,B")).toMatchObject({"added": 0, "updated": 1});
    expect(await ui.inlineGrade(pg_uma, p_ada, "C")).toBe(true);
    expect(await ui.generatePeriods(pg_uma, "2026-01-15", "2026-02-20")).toBe(1);
    expect(await ui.addAlias(pg_uma, p_cam, " ada ")).toBe(false);
    expect(await ui.addPatron(pg_uma, p_cam, "Ada")).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
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
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    expect(await ui.editPerson(pg_uma, p_ada, {"terms": ""})).toBe(true);
    expect(await ui.pasteClaims(pg_uma, "Ada,99.95,,\nAda,10.35,,")).toBe(2);
    const c_ada_0 = await ui.claimAt(pg_uma, p_ada, 0);
    const c_ada_1 = await ui.claimAt(pg_uma, p_ada, 1);
    await ui.sortBy(pg_uma, "grade");
    expect(await ui.statementAsOf(pg_uma, p_ada, "2026-04-02")).toBe(false);
    expect(await ui.addPatron(pg_uma, p_cam, "Ada")).toBe(false);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "5.00", "from": "2026-04-04", "to": "2026-03-12"})).toBe(false);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("110.30");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("110.30");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.defer(pg_uma, c_ada_0, "2026-04-05")).toBe(true);
    await ui.setToday(pg_uma, "2026-04-20");
    const c_ada_2 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "4.00", "date": "2026-03-28", "note": "n"}));
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "12.50"})).toBe(true);
    await ui.setAsOf(pg_uma, "2026-03-01");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("2026-03-01");
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
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=2.00`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=viewer`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-16`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-A value=5`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=late`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-02 from=2026-02-01 to=2026-02-28`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-03 from=2026-03-01 to=2026-03-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-04 from=2026-04-01 to=2026-04-30`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=n/a overdue-total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00 from=2026-03-05`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=2026-04 total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=B`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-01 from=2026-01-01 to=2026-01-31`,
      `PATRON_ADDED sheet=${sheet} by=uma name=Cam patron=Ada`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=n/a claims=0`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C terms=`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=99.95 date=2026-03-20`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=99.95 date=2026-03-20`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=99.95 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=99.95 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.35 date=2026-03-20`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=10.35 date=2026-03-20`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=110.30 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=110.30 due-total=0.00 overdue-total=0.00`,
      `CLAIM_DEFERRED sheet=${sheet} by=uma person=Ada amount=99.95 date=2026-03-20 until=2026-04-05`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=10.35 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=10.35 due-total=0.00 overdue-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Cam due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=n/a`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=110.30 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=110.30 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-28`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50`
    ]);
    await ui.clearAsOf(pg_uma);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.archive(pg_wes)).toBe(true);
    expect(await ui.addClaim(pg_wes, p_cam, {"amount": "3.33"})).toBeNull();
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("yes");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (B)");
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
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-patrons")).toHaveText("Ada (C) 100.00");
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
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText(["2026-03-20 0.00"]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-01-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-02-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-03-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-04-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-2026-01-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (C)");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("110.30");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("2026-03-20");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-count")).toHaveText("2");
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
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText(["2026-03-20 n/a"]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText(["2026-03-20 n/a"]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-01-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-02-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-03-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-04-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-2026-01-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-amount")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-date")).toHaveText("2026-03-28");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-period")).toHaveText("2026-04");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due-by")).toHaveText("2026-04-01");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-20 due=n/a"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("10.35");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("2026-03");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due-by")).toHaveText("2026-03-25");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-20 due=n/a", "OPEN by uma on 2026-03-20 due=n/a"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("99.95");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("2026-03");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-03-25");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-20 due=n/a", "OPEN by uma on 2026-03-20 due=n/a"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("2026-04-05");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("110.30");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-2026-02").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-2026-02").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2026-02").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_wes.getByTestId("period-row-2026-02").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-2026-03").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-2026-03").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2026-03").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_wes.getByTestId("period-row-2026-03").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-2026-04").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-2026-04").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_wes.getByTestId("period-row-2026-04").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_wes.getByTestId("period-row-2026-04").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-2026-01").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-2026-01").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_wes.getByTestId("period-row-2026-01").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_wes.getByTestId("period-row-2026-01").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2026-01-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2026-01-change")).toHaveText("");
    await expect(pg_wes.getByTestId("summary-period-2026-02-change")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2026-03-change")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-2026-04-change")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-void-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-void-error-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("classic-period-2026-02-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-period-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-period-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-period-2026-01-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("tag-a-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("tag-b-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("month-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-01")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-02")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-A-2026-03")).toHaveText("12.50");
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
    await expect(pg_wes.getByTestId("rate-month-B-2026-03")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-04")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-05")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-06")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-07")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-08")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-09")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-10")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-11")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-B-2026-12")).toHaveText("7.50");
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
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=2.00`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=viewer`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-16`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-A value=5`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=late`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-02 from=2026-02-01 to=2026-02-28`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-03 from=2026-03-01 to=2026-03-31`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-04 from=2026-04-01 to=2026-04-30`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=n/a overdue-total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00 from=2026-03-05`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=2026-04 total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=B`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=2026-01 from=2026-01-01 to=2026-01-31`,
      `PATRON_ADDED sheet=${sheet} by=uma name=Cam patron=Ada`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=n/a claims=0`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C terms=`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=99.95 date=2026-03-20`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=99.95 date=2026-03-20`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=99.95 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=99.95 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.35 date=2026-03-20`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=10.35 date=2026-03-20`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=110.30 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=110.30 due-total=0.00 overdue-total=0.00`,
      `CLAIM_DEFERRED sheet=${sheet} by=uma person=Ada amount=99.95 date=2026-03-20 until=2026-04-05`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=10.35 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=10.35 due-total=0.00 overdue-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Cam due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=n/a`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=110.30 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=110.30 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-28`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50`,
      `SHEET_ARCHIVED sheet=${sheet} by=wes`
    ]);
  });
  test("pending bound scenario 3", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-04-05");
    await ui.setSetting(pg_uma, "floor", "2.00");
    await ui.setSetting(pg_uma, "terms", "10");
    await ui.setSetting(pg_uma, "late-pct", "10.00");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-15");
    await ui.setSetting(pg_uma, "terms-A", "3");
    await ui.setSetting(pg_uma, "perm-close", "clerk");
    expect(await ui.setRole(pg_uma, "vic", "viewer")).toBe(true);
    await ui.setSetting(pg_uma, "note-threshold", "1.00");
    expect(await ui.addHoliday(pg_uma, "2026-03-13")).toBe(true);
    await ui.setSetting(pg_uma, "proof-threshold-C", "4.00");
    expect(await ui.addVoidReason(pg_uma, "dup")).toBe(true);
    expect(await ui.addVoidReason(pg_uma, "error")).toBe(true);
    await ui.setSetting(pg_uma, "pot", "33.33");
    await ui.setSetting(pg_uma, "alert-threshold", "3.00");
    await ui.setSetting(pg_uma, "review-threshold", "4.00");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "20.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "5.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B", "tags": "a"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "C", "terms": "3", "tags": "c"}));
    const pl_cam_1 = ui.must(await ui.addPlan(pg_uma, p_cam, {"amount": "12.50", "start": "2026-03-09", "end": "2026-04-30", "every": "7"}));
    expect(await ui.editPerson(pg_uma, p_cam, {"grade": "A", "gradeFrom": "2026-04-02"})).toBe(true);
    expect(await ui.editPerson(pg_uma, p_cam, {"grade": "C", "gradeFrom": "2026-02-25"}, "A")).toBe(true);
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    const c_cam_0 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "0.40", "date": "2026-03-20", "note": "n", "ref": " r-1 "}));
    expect(await ui.generatePlans(pg_uma)).toBe(4);
    const c_cam_1 = await ui.claimAt(pg_uma, p_cam, 1);
    const c_cam_2 = await ui.claimAt(pg_uma, p_cam, 2);
    const c_cam_3 = await ui.claimAt(pg_uma, p_cam, 3);
    const c_cam_4 = await ui.claimAt(pg_uma, p_cam, 4);
    const c_dot_0 = ui.must(await ui.quickAdd(pg_uma, {"name": "Dot", "amount": "7.77"}));
    const p_dot = await ui.personId(pg_uma, "Dot");
    expect(await ui.statement(pg_uma, p_ada)).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_dot).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_dot).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("3");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("6");
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
    expect(await ui.importPeople(pg_uma, "Eve,A\nFay,B,3,")).toMatchObject({"added": 2, "updated": 0});
    const p_eve = await ui.personId(pg_uma, "Eve");
    const p_fay = await ui.personId(pg_uma, "Fay");
    expect(await ui.bulkOpen(pg_uma, [c_cam_0, c_cam_2])).toEqual({ opened: 2, refused: 0 });
    const c_cam_5 = ui.must(await ui.quickAdd(pg_uma, {"name": "Cam", "amount": "0.04"}));
    expect(await ui.claimAction(pg_uma, c_cam_4, "open")).toBe(true);
    expect(await ui.pasteClaims(pg_uma, "Ada,10.25,2026-03-09,a, b")).toBe(1);
    const c_ada_0 = await ui.claimAt(pg_uma, p_ada, 0);
    expect(await ui.hold(pg_uma, p_fay, {"from": "2026-02-25", "to": "2026-03-20"})).toBe(true);
    expect(await ui.editClaim(pg_uma, c_cam_3, {"amount": "3.33"})).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("10.25");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("2.05");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("2.05");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("25.40");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("3.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_dot).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_dot).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_eve).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_eve).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("35.65");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("2.05");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("4");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("2.05");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("2.05");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("5");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("4");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("4");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("2.05");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("2.05");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    const c_cam_6 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "0.40", "date": "2026-03-05"}));
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.claimAction(pg_vic, c_cam_2, "settle")).toBe(false);
    expect(await ui.addComment(pg_vic, c_ada_0, "ok")).toBe(false);
    expect(await ui.addClaim(pg_vic, p_eve, {"amount": "10.35"})).toBeNull();
    await ui.setAsOf(pg_vic, "2026-02-10");
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("2026-02-10");
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
    await ui.expectAudit(sheet, [
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-A value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-close value=clerk`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-C value=4.00`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=dup`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=33.33`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-threshold value=4.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=5.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Cam amount=12.50 start=2026-03-09 every=7 end=2026-04-30`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=A`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=A`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=0.40 date=2026-03-20 ref=r-1`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-03-09`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-03-16`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-03-23`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-03-30`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Dot grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Dot claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Dot amount=7.77 date=2026-04-05`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Eve grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Eve claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Fay grade=B terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Fay claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-03-16`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=12.50 due-total=1.00 overdue-total=1.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=12.50 due-total=0.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Cam amount=0.40 date=2026-03-20`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=12.90 due-total=2.00 overdue-total=2.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=12.90 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=0.04 date=2026-04-05`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-03-30`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=25.40 due-total=3.00 overdue-total=3.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=25.40 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-03-09`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-03-09`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=10.25 due-total=2.05 overdue-total=2.05`,
      `TOTALS sheet=${sheet} by=uma claimed-total=35.65 due-total=2.05 overdue-total=2.05`,
      `PERSON_HELD sheet=${sheet} by=uma name=Fay from=2026-02-25`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Cam amount=3.33 date=2026-03-23`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=0.40 date=2026-03-05`
    ]);
    await ui.clearAsOf(pg_vic);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_vic.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_vic.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_vic.getByTestId("consolidated-people-count")).toHaveText("5");
    await expect(pg_vic.getByTestId("consolidated-due-total")).toHaveText("2.05");
    await expect(pg_vic.getByTestId("consolidated-overdue-total")).toHaveText("2.05");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (B)");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("10.25");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("2.05");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("2026-04-05");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-total")).toHaveText("2.05");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("yes");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("2.05");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("2.05");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("a");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText(["2026-04-05 0.00", "2026-04-05 0.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("10.25");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-03-09");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("a, b");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("2.05");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-03-24");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-05 due=2.05", "OPEN by uma on 2026-04-05 due=2.05"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (A)");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("25.40");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("3.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-overdue-total")).toHaveText("3.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-active")).toHaveText("yes");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aged-0-30")).toHaveText("3.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-open-total")).toHaveText("3.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-contact")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-origin")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-tags")).toHaveText("c");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-amount")).toHaveText("0.40");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-due-by")).toHaveText("2026-03-10");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-05 due=1.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-amount")).toHaveText("0.04");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-date")).toHaveText("2026-04-05");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-due-by")).toHaveText("2026-04-08");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-05 due=2.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-amount")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-date")).toHaveText("2026-03-30");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-due-by")).toHaveText("2026-04-02");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-05 due=1.00", "OPEN by uma on 2026-04-05 due=1.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-amount")).toHaveText("3.33");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-date")).toHaveText("2026-03-23");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-due-by")).toHaveText("2026-03-26");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-05 due=1.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-amount")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-date")).toHaveText("2026-03-16");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-due-by")).toHaveText("2026-03-19");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-05 due=1.00", "OPEN by uma on 2026-04-05 due=1.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-amount")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-date")).toHaveText("2026-03-09");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due-by")).toHaveText("2026-03-12");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-05 due=1.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-amount")).toHaveText("0.40");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due-by")).toHaveText("2026-03-25");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-05 due=1.00", "OPEN by uma on 2026-04-05 due=1.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-ref")).toHaveText("r-1");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-name")).toHaveText("Dot (A)");
    await expect(pg_vic.getByTestId("person-row-" + p_dot).getByTestId("person-grade")).toHaveText("A");
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
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-amount")).toHaveText("7.77");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-date")).toHaveText("2026-04-05");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-due-by")).toHaveText("2026-04-08");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-05 due=2.00"]);
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("claim-row-" + c_dot_0).getByTestId("claim-review-late")).toHaveText("no");
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
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_eve).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-name")).toHaveText("Fay (B)");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_vic.getByTestId("person-row-" + p_fay).getByTestId("person-hold")).toHaveText("yes");
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
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("35.65");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("2.05");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("4");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("2.05");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("2.05");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("5");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("5");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("4");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("2.05");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("2.05");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("summary-grade-A-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("summary-grade-A-due-total")).toHaveText("3.00");
    await expect(pg_vic.getByTestId("summary-grade-A-active")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-B-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("summary-grade-B-due-total")).toHaveText("2.05");
    await expect(pg_vic.getByTestId("summary-grade-B-active")).toHaveText("1");
    await expect(pg_vic.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-DRAFT-count")).toHaveText("5");
    await expect(pg_vic.getByTestId("summary-status-OPEN-count")).toHaveText("4");
    await expect(pg_vic.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-void-dup-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-void-error-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("classic-due-total")).toHaveText("5.05");
    await expect(pg_vic.getByTestId("tag-a-due-total")).toHaveText("2.05");
    await expect(pg_vic.getByTestId("tag-c-due-total")).toHaveText("3.00");
    await expect(pg_vic.getByTestId("month-2026-03-due-total")).toHaveText("5.05");
    await expect(pg_vic.getByTestId("month-2026-04-due-total")).toHaveText("0.00");
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
    await expect(pg_vic.getByTestId("plan-row-" + pl_cam_1).getByTestId("plan-generated")).toHaveText("4");
    await expect(pg_vic.getByTestId("plan-row-" + pl_cam_1).getByTestId("plan-next-dates")).toHaveText("2026-04-06, 2026-04-13, 2026-04-20, 2026-04-27");
    await ui.expectAudit(sheet, [
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-A value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-close value=clerk`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-C value=4.00`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=dup`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=33.33`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-threshold value=4.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=5.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Cam amount=12.50 start=2026-03-09 every=7 end=2026-04-30`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=A`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=A`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=0.40 date=2026-03-20 ref=r-1`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-03-09`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-03-16`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-03-23`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-03-30`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Dot grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Dot claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Dot amount=7.77 date=2026-04-05`,
      `STATEMENT sheet=${sheet} by=uma name=Ada due-total=0.00 claims=0`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Eve grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Eve claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Fay grade=B terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Fay claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-03-16`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=12.50 due-total=1.00 overdue-total=1.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=12.50 due-total=0.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Cam amount=0.40 date=2026-03-20`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=12.90 due-total=2.00 overdue-total=2.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=12.90 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=0.04 date=2026-04-05`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-03-30`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=25.40 due-total=3.00 overdue-total=3.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=25.40 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-03-09`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-03-09`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=10.25 due-total=2.05 overdue-total=2.05`,
      `TOTALS sheet=${sheet} by=uma claimed-total=35.65 due-total=2.05 overdue-total=2.05`,
      `PERSON_HELD sheet=${sheet} by=uma name=Fay from=2026-02-25`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Cam amount=3.33 date=2026-03-23`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=0.40 date=2026-03-05`
    ]);
  });
});
