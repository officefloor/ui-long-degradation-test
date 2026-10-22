import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("proof kinds", () => {
  test("proof kinds", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "proof-threshold", "1.50");
    await ui.setSetting(pg_uma, "proof-kinds", "receipt,photo");
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "20.00"}));
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "30.00"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_1, "open")).toBe(true);
    expect(await ui.addProof(pg_uma, c_ada_0, "receipt")).toBe(true);
    expect(await ui.addProof(pg_uma, c_ada_0, "x")).toBe(false);
    expect(await ui.addProof(pg_uma, c_ada_1)).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.claimAction(pg_vic, c_ada_0, "settle")).toBe(false);
    expect(await ui.claimAction(pg_vic, c_ada_1, "settle")).toBe(false);
    expect(await ui.addProof(pg_vic, c_ada_0, "photo")).toBe(true);
    expect(await ui.claimAction(pg_vic, c_ada_0, "settle")).toBe(true);
    await ui.refresh(pg_uma);
    await ui.setSetting(pg_uma, "proof-kinds", "photo");
    await ui.refresh(pg_vic);
    expect(await ui.claimAction(pg_vic, c_ada_1, "settle")).toBe(false);
    expect(await ui.addProof(pg_vic, c_ada_1, "photo")).toBe(true);
    expect(await ui.claimAction(pg_vic, c_ada_1, "settle")).toBe(true);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs")).toHaveText("2");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs-receipt")).toHaveText("1");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs-photo")).toHaveText("1");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("3.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("2");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-receipt")).toHaveText("1");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-photo")).toHaveText("1");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("50.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-kinds value=receipt,photo`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=20.00 date=2026-03-10`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=30.00 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=20.00 date=2026-03-10 number=FY2026-1`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=20.00 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=20.00 due-total=2.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=30.00 date=2026-03-10 number=FY2026-2`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=50.00 due-total=5.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=50.00 due-total=5.00 overdue-total=0.00`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=uma person=Ada amount=20.00 date=2026-03-10 number=FY2026-1 proofs=1 kind=receipt`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=uma person=Ada amount=30.00 date=2026-03-10 number=FY2026-2 proofs=1`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=vic person=Ada amount=20.00 date=2026-03-10 number=FY2026-1 proofs=2 kind=photo`,
      `CLAIM_SETTLED sheet=${sheet} by=vic person=Ada amount=20.00 date=2026-03-10 number=FY2026-1 due=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-kinds value=photo`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=vic person=Ada amount=30.00 date=2026-03-10 number=FY2026-2 proofs=2 kind=photo`,
      `CLAIM_SETTLED sheet=${sheet} by=vic person=Ada amount=30.00 date=2026-03-10 number=FY2026-2 due=3.00`
    ]);
  });
  test("proof kinds scenario 1", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "floor", "2.00");
    await ui.setSetting(pg_uma, "late-pct", "5.00");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-05");
    await ui.setSetting(pg_uma, "period-numbering-from", "2026-03-01");
    await ui.setSetting(pg_uma, "grace-days", "0");
    await ui.setSetting(pg_uma, "grace-C", "2");
    await ui.setSetting(pg_uma, "pot", "100.00");
    await ui.setSetting(pg_uma, "review-threshold", "4.00");
    await ui.setSetting(pg_uma, "escalate-after", "7");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00", "from": "2026-03-16", "to": "2026-03-12"})).toBe(false);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B", "contact": "ADA@X"}));
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C", "terms": "20"}));
    expect(await ui.addPool(pg_uma, "P1")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ben", "share": "50.00"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ada", "share": "50.00"})).toBe(true);
    expect(await ui.editPerson(pg_uma, p_ben, {"terms": "3", "termsFrom": "2026-03-12"})).toBe(true);
    expect(await ui.addAlias(pg_uma, p_ada, "Al")).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.merge(pg_wes, p_ada, "Ben")).toBe(true);
    expect(await ui.setRate(pg_wes, {"grade": "A", "pct": "5.00"})).toBe(true);
    await ui.refresh(pg_wes);
    expect(await ui.delegate(pg_wes, {"user": "vic", "from": "2026-02-25", "to": "2026-03-15"})).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    await ui.setToday(pg_vic, "2026-04-16");
    expect(await ui.statement(pg_vic, p_ben)).toBe(true);
    const c_ben_0 = ui.must(await ui.addClaim(pg_vic, p_ben, {"amount": "7.77", "date": "2026-03-01", "note": "n", "tags": " c "}));
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("100.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("1");
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
    expect(await ui.claimAction(pg_vic, c_ben_0, "delete")).toBe(true);
    expect(await ui.claimAction(pg_vic, c_ben_0, "restore")).toBe(true);
    expect(await ui.search(pg_vic, "e")).toEqual([`${sheet} Ben (B) 0.00`]);
    expect(await ui.addProof(pg_vic, c_ben_0)).toBe(true);
    expect(await ui.claimAction(pg_vic, c_ben_0, "open")).toBe(true);
    await ui.refresh(pg_wes);
    await ui.setSetting(pg_wes, "entry-date", "");
    const c_ben_1 = ui.must(await ui.addClaim(pg_wes, p_ben, {"amount": "10.25", "date": "2026-03-28", "note": "n", "tags": "b,a,a"}));
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("7.77");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("1.05");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("1.05");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("7.77");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("1.05");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("1.05");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("1.05");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("100.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("1.05");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("1.05");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.importRates(pg_wes, "B,5.00\nB,10.00,2026-03-05")).toBe(2);
    expect(await ui.remind(pg_wes, c_ben_0)).toBe(true);
    expect(await ui.editPerson(pg_wes, p_ben, {"grade": "B", "gradeFrom": "2026-02-25"})).toBe(true);
    const c_ben_2 = ui.must(await ui.addClaim(pg_wes, p_ben, {"amount": "10.35", "date": "2026-02-25", "ref": "inv 7"}));
    expect(await ui.claimAction(pg_wes, c_ben_2, "open")).toBe(true);
    expect(await ui.claimAction(pg_wes, c_ben_1, "delete")).toBe(true);
    expect(await ui.claimAction(pg_wes, c_ben_1, "restore")).toBe(true);
    await ui.setAsOf(pg_wes, "2026-03-01");
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("2026-03-01");
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
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-C value=2`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=100.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-threshold value=4.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=escalate-after value=7`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=12.50`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C terms=20`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ben share=50.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=50.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B terms=3`,
      `PERSON_ALIAS_ADDED sheet=${sheet} by=uma name=Ada alias=Al`,
      `PERSON_MERGED sheet=${sheet} by=wes from=Ada into=Ben`,
      `RATE_SET sheet=${sheet} by=wes grade=A rate=5.00`,
      `DELEGATED sheet=${sheet} by=wes user=vic from=2026-02-25 to=2026-03-15`,
      `SNAPSHOT sheet=${sheet} by=vic name=Ben due-total=0.00`,
      `STATEMENT sheet=${sheet} by=vic name=Ben due-total=0.00 claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ben amount=7.77 date=2026-03-01 tags=c`,
      `CLAIM_DELETED sheet=${sheet} by=vic person=Ben amount=7.77 date=2026-03-01`,
      `CLAIM_RESTORED sheet=${sheet} by=vic person=Ben amount=7.77 date=2026-03-01`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=vic person=Ben amount=7.77 date=2026-03-01 proofs=1`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Ben amount=7.77 date=2026-03-01 number=X-1`,
      `ROLLUP sheet=${sheet} by=vic person=Ben claimed=7.77 due-total=1.05 overdue-total=1.05`,
      `TOTALS sheet=${sheet} by=vic claimed-total=7.77 due-total=1.05 overdue-total=1.05`,
      `SETTING_CHANGED sheet=${sheet} by=wes key=entry-date value=`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=10.25 date=2026-03-28 tags=a,b`,
      `RATE_SET sheet=${sheet} by=wes grade=B rate=5.00`,
      `RATE_SET sheet=${sheet} by=wes grade=B rate=10.00 from=2026-03-05`,
      `REMIND sheet=${sheet} by=wes person=Ben amount=7.77 date=2026-03-01 number=X-1`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Ben grade=B`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=10.35 date=2026-02-25 ref=inv 7`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ben amount=10.35 date=2026-02-25 number=X-2`,
      `ROLLUP sheet=${sheet} by=wes person=Ben claimed=18.12 due-total=2.10 overdue-total=2.10`,
      `TOTALS sheet=${sheet} by=wes claimed-total=18.12 due-total=2.10 overdue-total=2.10`,
      `CLAIM_DELETED sheet=${sheet} by=wes person=Ben amount=10.25 date=2026-03-28`,
      `CLAIM_RESTORED sheet=${sheet} by=wes person=Ben amount=10.25 date=2026-03-28`
    ]);
    await ui.clearAsOf(pg_wes);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("2.10");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("2.10");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben (B)");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("18.12");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("2.10");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-statement-date")).toHaveText("2026-04-16");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-total")).toHaveText("2.10");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-active")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aged-31-60")).toHaveText("2.10");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-open-total")).toHaveText("2.10");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-contact")).toHaveText("ada@x");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-aliases")).toHaveText("Ada, Al");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-cut-total")).toHaveText("100.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-snapshot-line")).toHaveText(["2026-03-20 0.00"]);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-statement-line-line")).toHaveText(["2026-04-16 0.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-amount")).toHaveText("10.35");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-date")).toHaveText("2026-02-25");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-due")).toHaveText("1.05");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-number")).toHaveText("X-2");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-opened-by")).toHaveText("wes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-due-by")).toHaveText("2026-03-02");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-04-16 due=1.00", "OPEN by wes on 2026-04-16 due=1.05"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-ref")).toHaveText("inv 7");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-amount")).toHaveText("10.25");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-date")).toHaveText("2026-03-28");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due-by")).toHaveText("2026-04-01");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-04-16 due=2.00", "DELETED by wes on 2026-04-16 due=2.00", "DRAFT by wes on 2026-04-16 due=2.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-tags")).toHaveText("a, b");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-amount")).toHaveText("7.77");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-date")).toHaveText("2026-03-01");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("1.05");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-number")).toHaveText("X-1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-opened-by")).toHaveText("vic");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due-by")).toHaveText("2026-03-04");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by vic on 2026-04-16 due=1.00", "DELETED by vic on 2026-04-16 due=1.00", "DRAFT by vic on 2026-04-16 due=1.00", "OPEN by vic on 2026-04-16 due=1.05"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-proofs")).toHaveText("1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-reminded")).toHaveText("2026-04-16");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-tags")).toHaveText("c");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-proofs-receipt")).toHaveText("1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("18.12");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("2.10");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("2.10");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("2.10");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("100.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("2.10");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("2.10");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("2.10");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("2.10");
    await expect(pg_wes.getByTestId("tag-c-due-total")).toHaveText("1.05");
    await expect(pg_wes.getByTestId("tag-a-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("tag-b-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("month-2026-02-due-total")).toHaveText("1.05");
    await expect(pg_wes.getByTestId("month-2026-03-due-total")).toHaveText("1.05");
    await expect(pg_wes.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_wes.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-share")).toHaveText("100.00");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-cut")).toHaveText("100.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-01")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-02")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-03")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-04")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-05")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-06")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-07")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-08")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-09")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-10")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-11")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-12")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-01")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-02")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-03")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-04")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-05")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-06")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-07")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-08")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-09")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-10")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-11")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-12")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("rate-month-C-2026-01")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-02")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-03")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-04")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-05")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-06")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-07")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-08")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-09")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-10")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-11")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-12")).toHaveText("12.50");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-C value=2`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=100.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-threshold value=4.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=escalate-after value=7`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=12.50`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C terms=20`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ben share=50.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=50.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B terms=3`,
      `PERSON_ALIAS_ADDED sheet=${sheet} by=uma name=Ada alias=Al`,
      `PERSON_MERGED sheet=${sheet} by=wes from=Ada into=Ben`,
      `RATE_SET sheet=${sheet} by=wes grade=A rate=5.00`,
      `DELEGATED sheet=${sheet} by=wes user=vic from=2026-02-25 to=2026-03-15`,
      `SNAPSHOT sheet=${sheet} by=vic name=Ben due-total=0.00`,
      `STATEMENT sheet=${sheet} by=vic name=Ben due-total=0.00 claims=0`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ben amount=7.77 date=2026-03-01 tags=c`,
      `CLAIM_DELETED sheet=${sheet} by=vic person=Ben amount=7.77 date=2026-03-01`,
      `CLAIM_RESTORED sheet=${sheet} by=vic person=Ben amount=7.77 date=2026-03-01`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=vic person=Ben amount=7.77 date=2026-03-01 proofs=1`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Ben amount=7.77 date=2026-03-01 number=X-1`,
      `ROLLUP sheet=${sheet} by=vic person=Ben claimed=7.77 due-total=1.05 overdue-total=1.05`,
      `TOTALS sheet=${sheet} by=vic claimed-total=7.77 due-total=1.05 overdue-total=1.05`,
      `SETTING_CHANGED sheet=${sheet} by=wes key=entry-date value=`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=10.25 date=2026-03-28 tags=a,b`,
      `RATE_SET sheet=${sheet} by=wes grade=B rate=5.00`,
      `RATE_SET sheet=${sheet} by=wes grade=B rate=10.00 from=2026-03-05`,
      `REMIND sheet=${sheet} by=wes person=Ben amount=7.77 date=2026-03-01 number=X-1`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Ben grade=B`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=10.35 date=2026-02-25 ref=inv 7`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ben amount=10.35 date=2026-02-25 number=X-2`,
      `ROLLUP sheet=${sheet} by=wes person=Ben claimed=18.12 due-total=2.10 overdue-total=2.10`,
      `TOTALS sheet=${sheet} by=wes claimed-total=18.12 due-total=2.10 overdue-total=2.10`,
      `CLAIM_DELETED sheet=${sheet} by=wes person=Ben amount=10.25 date=2026-03-28`,
      `CLAIM_RESTORED sheet=${sheet} by=wes person=Ben amount=10.25 date=2026-03-28`
    ]);
  });
  test("proof kinds scenario 2", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    await ui.setSetting(pg_uma, "period-numbering-from", "2026-03-01");
    await ui.setSetting(pg_uma, "cap", "2.00");
    await ui.setSetting(pg_uma, "proof-threshold", "1.00");
    await ui.setSetting(pg_uma, "grace-days", "0");
    await ui.setSetting(pg_uma, "note-threshold", "2.50");
    await ui.setSetting(pg_uma, "entry-date", "2026-03-05");
    await ui.setSetting(pg_uma, "grace-A", "2");
    await ui.setSetting(pg_uma, "pot", "7.77");
    await ui.setSetting(pg_uma, "fiscal-start-month", "4");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "12.50", "from": "2026-03-10", "to": "2026-03-25"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "C", "contact": "ben@x"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "C", "tags": "c"}));
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C", "terms": "3"}));
    const pl_ada_1 = ui.must(await ui.addPlan(pg_uma, p_ada, {"amount": "0.40", "start": "2026-03-01", "end": "2026-04-30", "day": "15"}));
    expect(await ui.statement(pg_uma, p_ben)).toBe(true);
    expect(await ui.ratePreview(pg_uma, "B", "5.00")).toEqual({ count: 0, diff: "0.00" });
    expect(await ui.addHoliday(pg_uma, "2026-03-18")).toBe(true);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "7.77", "date": "2026-02-25", "note": "n"}));
    expect(await ui.movePerson(pg_uma, p_ada, "up")).toBe(true);
    expect(await ui.periodAction(pg_uma, "P1", "soft-close")).toBe(true);
    expect(await ui.hold(pg_uma, p_ada, {"from": "2026-02-10", "to": "2026-03-01"})).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
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
    await ui.setToday(pg_uma, "2026-03-26");
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "0.04", "date": "2026-03-05", "note": "n", "ref": "R-2"}));
    expect(await ui.addLine(pg_uma, c_ada_0, {"label": "y", "qty": "1", "unit": "4.00"})).toBe(true);
    const c_ada_2 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "12.50"}));
    expect(await ui.addAlias(pg_uma, p_ben, " ada ")).toBe(false);
    expect(await ui.importOpenings(pg_uma, "Ben,P1,x")).toBeNull();
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("3");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("3");
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
    expect(await ui.search(pg_wes, "zz")).toEqual([]);
    expect(await ui.claimAction(pg_wes, c_ada_2, "open")).toBe(true);
    expect(await ui.addAlias(pg_wes, p_ada, " ada ")).toBe(false);
    expect(await ui.pasteClaims(pg_wes, "Zed,7.77,,a, b\nZed,0.40,2026-03-01,")).toBeNull();
    expect(await ui.bulkOpen(pg_wes, [c_ada_1, c_ada_0])).toEqual({ opened: 2, refused: 0 });
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("3");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (C)");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("n/a");
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
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-terms")).toHaveText("");
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
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-snapshot-line")).toHaveText(["2026-03-20 0.00"]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (C)");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("16.54");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("yes");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-count")).toHaveText("3");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-total")).toHaveText("3.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("yes");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("3.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("3.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText(["2026-03-20 0.00"]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-amount")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-number")).toHaveText("P1-1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-opened-by")).toHaveText("wes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due-by")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-26 due=1.00", "OPEN by wes on 2026-03-26 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-late-entry")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("0.04");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("P1-2");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("wes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due-by")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-26 due=1.00", "OPEN by wes on 2026-03-26 due=1.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-late-entry")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-ref")).toHaveText("R-2");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-02-25");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("P1-3");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("wes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("P1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-03-02");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-20 due=1.00", "OPEN by wes on 2026-03-26 due=1.00"]);
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
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText(["y 1 x 4.00"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben (C)");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-statement-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-statement-date")).toHaveText("2026-03-20");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-terms")).toHaveText("");
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
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-tags")).toHaveText("c");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-snapshot-line")).toHaveText(["2026-03-20 0.00"]);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-statement-line-line")).toHaveText(["2026-03-20 0.00"]);
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("16.54");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("3");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("3.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("3");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("3");
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
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2025");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("3");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("3");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("tag-c-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("month-2026-02-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("month-2026-03-due-total")).toHaveText("2.00");
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
    await expect(pg_wes.getByTestId("rate-month-C-2026-01")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-02")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-03")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-04")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-05")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-06")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-07")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-08")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-09")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-10")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-11")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-12")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("plan-row-" + pl_ada_1).getByTestId("plan-generated")).toHaveText("0");
    await expect(pg_wes.getByTestId("plan-row-" + pl_ada_1).getByTestId("plan-next-dates")).toHaveText("2026-04-15");
    await ui.expectAudit(sheet, [
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=2.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-A value=2`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=7.77`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=fiscal-start-month value=4`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=12.50 from=2026-03-10 to=2026-03-25`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C contact=ben@x`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=C`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Ada amount=0.40 start=2026-03-01 day=15 end=2026-04-30`,
      `STATEMENT sheet=${sheet} by=uma name=Ben due-total=0.00 claims=0`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-18`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-02-25`,
      `PERSON_MOVED sheet=${sheet} by=uma name=Ada position=2`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `PERSON_HELD sheet=${sheet} by=uma name=Ada from=2026-02-10`,
      `SNAPSHOT sheet=${sheet} by=uma name=Cam due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=0.00`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=n/a overdue-total=0.00`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=n/a overdue-total=0.00`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=n/a overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=0.04 date=2026-03-05 ref=R-2`,
      `LATE_ENTRY sheet=${sheet} by=uma person=Ada amount=0.04 date=2026-03-05`,
      `CLAIM_LINE_ADDED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-02-25 label=y qty=1 unit=4.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=12.50 date=2026-03-05`,
      `LATE_ENTRY sheet=${sheet} by=uma person=Ada amount=12.50 date=2026-03-05`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ada amount=12.50 date=2026-03-05 number=P1-1`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=12.50 due-total=1.00 overdue-total=1.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=12.50 due-total=1.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ada amount=0.04 date=2026-03-05 number=P1-2`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=12.54 due-total=2.00 overdue-total=2.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=12.54 due-total=2.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ada amount=4.00 date=2026-02-25 number=P1-3`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=16.54 due-total=2.00 overdue-total=3.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=16.54 due-total=2.00 overdue-total=0.00`
    ]);
  });
  test("proof kinds scenario 3", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "clerk-limit", "1.50");
    await ui.setSetting(pg_uma, "terms", "30");
    await ui.setSetting(pg_uma, "late-pct", "10.00");
    await ui.setSetting(pg_uma, "terms-A", "3");
    await ui.setSetting(pg_uma, "perm-void", "steward");
    await ui.setSetting(pg_uma, "note-threshold", "1.00");
    expect(await ui.addHoliday(pg_uma, "2026-04-03")).toBe(true);
    expect(await ui.addHoliday(pg_uma, "2026-03-24")).toBe(true);
    await ui.setSetting(pg_uma, "proof-threshold-A", "0.50");
    expect(await ui.addVoidReason(pg_uma, "error")).toBe(true);
    await ui.setSetting(pg_uma, "alert-threshold", "3.00");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "7.50", "from": "2026-03-16"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B", "tags": "a"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "A"}));
    expect(await ui.addCrew(pg_uma, "C1", "Ada")).toBe(true);
    expect(await ui.addCrewMember(pg_uma, "C1", "Cam")).toBe(true);
    expect(await ui.addCrewMember(pg_uma, "C1", "Ben")).toBe(true);
    expect(await ui.movePerson(pg_uma, p_cam, "up")).toBe(true);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "7.77"}));
    await ui.expectAuditView(pg_uma, "", [
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-10`,
      `PERSON_MOVED sheet=${sheet} by=uma name=Cam position=1`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Ben`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Cam`,
      `CREW_ADDED sheet=${sheet} by=uma name=C1 lead=Ada`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=7.50 from=2026-03-16`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=3.00`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-A value=0.50`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-24`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-03`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-void value=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-A value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=30`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=1.50`,
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`
    ]);
    expect(await ui.addHoliday(pg_uma, "2026-03-27")).toBe(true);
    expect(await ui.addProof(pg_uma, c_ada_0)).toBe(true);
    expect(await ui.claimEditOpen(pg_uma, c_ada_0)).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.claimEditOpen(pg_wes, c_ada_0)).toBe(false);
    await ui.refresh(pg_uma);
    expect(await ui.claimEditSave(pg_uma, c_ada_0, {"amount": "4.00"})).toBe(true);
    await ui.refresh(pg_wes);
    expect(await ui.merge(pg_wes, p_ben, "Cam")).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
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
    await ui.refresh(pg_uma);
    expect(await ui.editPerson(pg_uma, p_ada, {"terms": ""})).toBe(true);
    const c_cam_0 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "25.00", "note": "n"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_cam_0, "open")).toBe(true);
    const c_cam_1 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "7.77", "note": "n"}));
    const c_cam_2 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "99.95", "note": "n"}));
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("25.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("1.25");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-due")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.25");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("29.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("2.25");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("2.25");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("2.25");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.bulkGrade(pg_uma, [p_ada, p_cam], {"grade": "C", "from": "2026-02-10"})).toBe(2);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "20.00"})).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.bulkSettle(pg_vic, [c_ada_0, c_cam_0])).toEqual({ settled: 2, refused: 0 });
    await ui.expectAuditView(pg_vic, "", [
      `BATCH_SETTLED sheet=${sheet} by=vic batch=1 count=2 total=0.00`,
      `CLAIM_SETTLED sheet=${sheet} by=vic person=Ada amount=4.00 date=2026-03-10 number=FY2026-1 due=n/a`,
      `CLAIM_SETTLED sheet=${sheet} by=vic person=Cam amount=25.00 date=2026-03-10 number=FY2026-2 due=n/a`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=29.00 due-total=0.00 overdue-total=0.00`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=4.00 due-total=n/a overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C`,
      `TOTALS sheet=${sheet} by=uma claimed-total=29.00 due-total=1.00 overdue-total=0.00`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=25.00 due-total=n/a overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=C`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=99.95 date=2026-03-10`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=7.77 date=2026-03-10`,
      `TOTALS sheet=${sheet} by=uma claimed-total=29.00 due-total=2.25 overdue-total=0.00`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=25.00 due-total=1.25 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Cam amount=25.00 date=2026-03-10 number=FY2026-2`,
      `TOTALS sheet=${sheet} by=uma claimed-total=4.00 due-total=1.00 overdue-total=0.00`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=4.00 due-total=1.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-10 number=FY2026-1`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=25.00 date=2026-03-10`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=B terms=`,
      `PERSON_MERGED sheet=${sheet} by=wes from=Ben into=Cam`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-10`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-10 proofs=1`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-27`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-10`,
      `PERSON_MOVED sheet=${sheet} by=uma name=Cam position=1`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Ben`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Cam`,
      `CREW_ADDED sheet=${sheet} by=uma name=C1 lead=Ada`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=7.50 from=2026-03-16`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=3.00`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-A value=0.50`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-24`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-03`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-void value=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-A value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=30`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=1.50`,
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`
    ]);
    expect(await ui.bulkOpen(pg_vic, [c_cam_2, c_cam_1])).toEqual({ opened: 2, refused: 0 });
    await ui.refresh(pg_wes);
    expect(await ui.transfer(pg_wes, p_cam, `${sheet}-t`)).toBe(true);
    await ui.setAsOf(pg_wes, "2026-03-01");
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("2026-03-01");
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
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=1.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=30`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-A value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-void value=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-03`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-24`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-A value=0.50`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=3.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=7.50 from=2026-03-16`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CREW_ADDED sheet=${sheet} by=uma name=C1 lead=Ada`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Cam`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Ben`,
      `PERSON_MOVED sheet=${sheet} by=uma name=Cam position=1`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-10`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-27`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-10 proofs=1`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-10`,
      `PERSON_MERGED sheet=${sheet} by=wes from=Ben into=Cam`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=B terms=`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=25.00 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-10 number=FY2026-1`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=4.00 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=4.00 due-total=1.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Cam amount=25.00 date=2026-03-10 number=FY2026-2`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=25.00 due-total=1.25 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=29.00 due-total=2.25 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=7.77 date=2026-03-10`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=99.95 date=2026-03-10`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=C`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=25.00 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=29.00 due-total=1.00 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=4.00 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=29.00 due-total=0.00 overdue-total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `CLAIM_SETTLED sheet=${sheet} by=vic person=Cam amount=25.00 date=2026-03-10 number=FY2026-2 due=n/a`,
      `CLAIM_SETTLED sheet=${sheet} by=vic person=Ada amount=4.00 date=2026-03-10 number=FY2026-1 due=n/a`,
      `BATCH_SETTLED sheet=${sheet} by=vic batch=1 count=2 total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Cam amount=99.95 date=2026-03-10 number=FY2026-3`,
      `ROLLUP sheet=${sheet} by=vic person=Cam claimed=124.95 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=128.95 due-total=0.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Cam amount=7.77 date=2026-03-10 number=FY2026-4`,
      `ROLLUP sheet=${sheet} by=vic person=Cam claimed=132.72 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=136.72 due-total=0.00 overdue-total=0.00`,
      `PERSON_TRANSFERRED sheet=${sheet} by=wes name=Cam to=${sheet}-t`,
      `TOTALS sheet=${sheet} by=wes claimed-total=4.00 due-total=0.00 overdue-total=0.00`
    ]);
    await ui.clearAsOf(pg_wes);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (C)");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("");
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
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-03-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("FY2026-1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-04-24");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=1.00", "OPEN by uma on 2026-03-10 due=1.00", "SETTLED by vic on 2026-03-10 due=n/a"]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-receipt")).toHaveText("1");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("1");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-void-error-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("month-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("pool-row-C1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_wes.getByTestId("pool-row-C1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_wes.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-share")).toHaveText("100.00");
    await expect(pg_wes.getByTestId("pool-member-C1-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("crew-row-C1").getByTestId("crew-lead")).toHaveText("Ada (C)");
    await expect(pg_wes.getByTestId("crew-row-C1").getByTestId("crew-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-01")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-02")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-03")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-04")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-05")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-06")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-07")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-08")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-09")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-10")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-11")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-A-2026-12")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-01")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-month-B-2026-02")).toHaveText("20.00");
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
    await expect(pg_wes.getByTestId("rate-month-C-2026-01")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-02")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-03")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("rate-month-C-2026-04")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-05")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-06")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-07")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-08")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-09")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-10")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-11")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-month-C-2026-12")).toHaveText("7.50");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=1.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=30`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-A value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-void value=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-03`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-24`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-A value=0.50`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=alert-threshold value=3.00`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=7.50 from=2026-03-16`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CREW_ADDED sheet=${sheet} by=uma name=C1 lead=Ada`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Cam`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=C1 name=Ben`,
      `PERSON_MOVED sheet=${sheet} by=uma name=Cam position=1`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-10`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-27`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-10 proofs=1`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-10`,
      `PERSON_MERGED sheet=${sheet} by=wes from=Ben into=Cam`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=B terms=`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=25.00 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-10 number=FY2026-1`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=4.00 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=4.00 due-total=1.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Cam amount=25.00 date=2026-03-10 number=FY2026-2`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=25.00 due-total=1.25 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=29.00 due-total=2.25 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=7.77 date=2026-03-10`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=99.95 date=2026-03-10`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=C`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=25.00 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=29.00 due-total=1.00 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=4.00 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=29.00 due-total=0.00 overdue-total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `CLAIM_SETTLED sheet=${sheet} by=vic person=Cam amount=25.00 date=2026-03-10 number=FY2026-2 due=n/a`,
      `CLAIM_SETTLED sheet=${sheet} by=vic person=Ada amount=4.00 date=2026-03-10 number=FY2026-1 due=n/a`,
      `BATCH_SETTLED sheet=${sheet} by=vic batch=1 count=2 total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Cam amount=99.95 date=2026-03-10 number=FY2026-3`,
      `ROLLUP sheet=${sheet} by=vic person=Cam claimed=124.95 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=128.95 due-total=0.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Cam amount=7.77 date=2026-03-10 number=FY2026-4`,
      `ROLLUP sheet=${sheet} by=vic person=Cam claimed=132.72 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=136.72 due-total=0.00 overdue-total=0.00`,
      `PERSON_TRANSFERRED sheet=${sheet} by=wes name=Cam to=${sheet}-t`,
      `TOTALS sheet=${sheet} by=wes claimed-total=4.00 due-total=0.00 overdue-total=0.00`
    ]);
  });
});
