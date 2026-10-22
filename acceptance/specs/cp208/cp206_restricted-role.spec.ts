import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("restricted role", () => {
  test("restricted role", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "20.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    const p_wes = ui.must(await ui.addPerson(pg_uma, {"name": "wes", "grade": "C"}));
    const p_dot = ui.must(await ui.addPerson(pg_uma, {"name": "Dot", "grade": "A"}));
    expect(await ui.setRole(pg_uma, "wes", "restricted")).toBe(true);
    expect(await ui.setRole(pg_uma, "wes", "x")).toBe(false);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.00"}));
    const c_wes_0 = ui.must(await ui.addClaim(pg_uma, p_wes, {"amount": "20.00"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_wes_0, "open")).toBe(true);
    expect(await ui.addCrew(pg_uma, "Red", "Ada")).toBe(true);
    expect(await ui.addCrewMember(pg_uma, "Red", "wes")).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    await expect(pg_wes.getByTestId("person-row-" + p_ben)).toHaveCount(0);
    await expect(pg_wes.getByTestId("person-row-" + p_dot)).toHaveCount(0);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (A)");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben)).toHaveCount(0);
    await expect(pg_wes.getByTestId("person-row-" + p_wes).getByTestId("person-name")).toHaveText("wes (C)");
    await expect(pg_wes.getByTestId("person-row-" + p_wes).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("person-row-" + p_dot)).toHaveCount(0);
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("30.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-0-30")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("4");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("summary-grade-A-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("summary-grade-A-active")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("summary-grade-C-active")).toHaveText("1");
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("classic-due-total")).toHaveText("1.00");
    await ui.refresh(pg_uma);
    expect(await ui.addCrew(pg_uma, "Blue", "wes")).toBe(true);
    expect(await ui.addCrewMember(pg_uma, "Blue", "Dot")).toBe(true);
    expect(await ui.setRole(pg_uma, "vic", "restricted")).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ben)).toHaveCount(0);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (A)");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben)).toHaveCount(0);
    await expect(pg_wes.getByTestId("person-row-" + p_wes).getByTestId("person-name")).toHaveText("wes (C)");
    await expect(pg_wes.getByTestId("person-row-" + p_wes).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-name")).toHaveText("Dot (A)");
    await expect(pg_wes.getByTestId("person-row-" + p_dot).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("30.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-0-30")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-aged-61")).toHaveText("0.00");
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    await expect(pg_vic.getByTestId("person-row-" + p_ada)).toHaveCount(0);
    await expect(pg_vic.getByTestId("person-row-" + p_ben)).toHaveCount(0);
    await expect(pg_vic.getByTestId("person-row-" + p_wes)).toHaveCount(0);
    await expect(pg_vic.getByTestId("person-row-" + p_dot)).toHaveCount(0);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("30.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-0-30")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=wes grade=C`,
      `ROLLUP sheet=${sheet} by=uma person=wes claimed=0.00 due-total=n/a overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Dot grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Dot claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `ROLE_SET sheet=${sheet} by=uma user=wes role=restricted`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-03-10`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=wes amount=20.00 date=2026-03-10`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-03-10`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=10.00 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=10.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=wes amount=20.00 date=2026-03-10`,
      `ROLLUP sheet=${sheet} by=uma person=wes claimed=20.00 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=30.00 due-total=0.00 overdue-total=0.00`,
      `CREW_ADDED sheet=${sheet} by=uma name=Red lead=Ada`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=Red name=wes`,
      `CREW_ADDED sheet=${sheet} by=uma name=Blue lead=wes`,
      `CREW_MEMBER_ADDED sheet=${sheet} by=uma crew=Blue name=Dot`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=restricted`
    ]);
  });
  test("restricted role scenario 1", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-04-05");
    await ui.setSetting(pg_uma, "clerk-limit", "1.50");
    await ui.setSetting(pg_uma, "floor", "2.00");
    await ui.setSetting(pg_uma, "late-pct", "5.00");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-05");
    await ui.setSetting(pg_uma, "terms-C", "20");
    await ui.setSetting(pg_uma, "cap", "2.00");
    await ui.setSetting(pg_uma, "proof-threshold", "1.00");
    await ui.setSetting(pg_uma, "grace-days", "3");
    expect(await ui.addHoliday(pg_uma, "2026-04-03")).toBe(true);
    await ui.setSetting(pg_uma, "grace-A", "5");
    expect(await ui.addVoidReason(pg_uma, "dup")).toBe(true);
    expect(await ui.saveTemplate(pg_uma, {"name": "T1", "amount": "4.00", "note": "tpl"})).toBe(true);
    await ui.setSetting(pg_uma, "review-sla", "1");
    await ui.setSetting(pg_uma, "escalate-after", "7");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "5.00", "from": "2026-03-01"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P2", "from": "2026-03-16", "to": "2026-03-31"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C", "terms": "20", "tags": "c"}));
    expect(await ui.editPerson(pg_uma, p_ben, {"terms": "20", "termsFrom": "2026-03-01"})).toBe(true);
    const pl_ben_1 = ui.must(await ui.addPlan(pg_uma, p_ben, {"amount": "99.95", "start": "2026-03-09", "end": "2026-04-30", "every": "10"}));
    const c_ada_0 = ui.must(await ui.claimFromTemplate(pg_uma, p_ada, "T1"));
    const c_ben_0 = ui.must(await ui.quickAdd(pg_uma, {"name": "Ben", "amount": "10.25"}));
    expect(await ui.hold(pg_uma, p_ben, {"from": "2026-02-25"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "12.50", "from": "2026-03-16"})).toBe(true);
    expect(await ui.periodAction(pg_uma, "P1", "soft-close")).toBe(true);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.claimAction(pg_vic, c_ada_0, "open")).toBe(true);
    expect(await ui.statementAsOf(pg_vic, p_ben, "2026-02-25")).toBe(false);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-0-30")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("2.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.claimAction(pg_vic, c_ben_0, "open")).toBe(true);
    await ui.refresh(pg_uma);
    expect(await ui.claimAction(pg_uma, c_ben_0, "settle")).toBe(false);
    expect(await ui.inlineGrade(pg_uma, p_ben, "B")).toBe(true);
    await ui.setToday(pg_uma, "2026-04-23");
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "25.00", "note": "n", "ref": "R-1", "tags": " c "}));
    expect(await ui.planAmount(pg_uma, pl_ben_1, "3.33")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_1, "open")).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("10.25");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("29.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("39.25");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("6.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("6.00");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("3");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    const c_ada_2 = ui.must(await ui.split(pg_uma, p_ada, c_ada_1, "1.00"));
    expect(await ui.bulkGrade(pg_uma, [p_ada, p_ben], {"grade": "B"})).toBe(2);
    expect(await ui.importRates(pg_uma, "C,10.00\nB,20.00,2026-03-05")).toBe(2);
    const c_ada_3 = ui.must(await ui.split(pg_uma, p_ada, c_ada_1, "10.00"));
    await ui.setAsOf(pg_uma, "2026-03-20");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("2026-03-20");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_uma.getByTestId("consolidated-people-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
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
    await expect(pg_uma.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=1.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=3`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-03`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-A value=5`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=dup`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=4.00 note=tpl`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=1`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=escalate-after value=7`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00 from=2026-03-01`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C terms=20`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B terms=20`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Ben amount=99.95 start=2026-03-09 every=10 end=2026-04-30`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-04-05`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=10.25 date=2026-04-05`,
      `PERSON_HELD sheet=${sheet} by=uma name=Ben from=2026-02-25`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50 from=2026-03-16`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Ada amount=4.00 date=2026-04-05`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=4.00 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=4.00 due-total=2.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Ben amount=10.25 date=2026-04-05`,
      `ROLLUP sheet=${sheet} by=vic person=Ben claimed=10.25 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=14.25 due-total=4.00 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=2.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=2.00`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P2 total=0.00 auto=yes`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=25.00 date=2026-04-23 ref=R-1 tags=c`,
      `PLAN_CHANGED sheet=${sheet} by=uma name=Ben start=2026-03-09 amount=3.33`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=25.00 date=2026-04-23`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=29.00 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=39.25 due-total=4.00 overdue-total=0.00`,
      `CLAIM_SPLIT sheet=${sheet} by=uma person=Ada amount=24.00 date=2026-04-23 into=`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=1.00 date=2026-04-23`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=B`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00 from=2026-03-05`,
      `CLAIM_SPLIT sheet=${sheet} by=uma person=Ada amount=14.00 date=2026-04-23 into=`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-04-23`
    ]);
    await ui.clearAsOf(pg_uma);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_uma.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("consolidated-due-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-B-due-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-OPEN-count")).toHaveText("5");
    await expect(pg_uma.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben (B)");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("10.25");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-hold")).toHaveText("yes");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-terms")).toHaveText("20");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-active")).toHaveText("yes");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-0-30")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-open-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-contact")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-snapshot-line")).toHaveText(["2026-04-05 2.00"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-approver")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P2-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-amount")).toHaveText("10.25");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-date")).toHaveText("2026-04-05");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-opened-by")).toHaveText("vic");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due-by")).toHaveText("2026-05-01");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-05 due=2.00", "OPEN by vic on 2026-04-05 due=2.00"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (B)");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("29.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("6.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("20");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("yes");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("8.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("8.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("c");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText(["2026-04-05 2.00"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-approver")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P2-carried")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-amount")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-date")).toHaveText("2026-04-23");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-due-by")).toHaveText("2026-05-21");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-log-line")).toHaveText(["OPEN by uma on 2026-04-23 due=2.00"]);
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
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-amount")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-date")).toHaveText("2026-04-23");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due-by")).toHaveText("2026-05-21");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-log-line")).toHaveText(["OPEN by uma on 2026-04-23 due=2.00"]);
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
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("14.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-04-23");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due-by")).toHaveText("2026-05-21");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-23 due=2.00", "OPEN by uma on 2026-04-23 due=2.00"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-ref")).toHaveText("R-1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-tags")).toHaveText("c");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-04-05");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("tpl");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("vic");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-05-01");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-04-05 due=2.00", "OPEN by vic on 2026-04-05 due=2.00"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("39.25");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-0-30")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("5");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("soft");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_uma.getByTestId("rate-current-A")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-current-B")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-current-C")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("2");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_uma.getByTestId("summary-period-P2-change")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("5");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-void-dup-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("classic-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("classic-due-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("tag-c-due-total")).toHaveText("8.00");
    await expect(pg_uma.getByTestId("month-2026-04-due-total")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-01")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-02")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-03")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-04")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-05")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-06")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-07")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-08")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-09")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-10")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-11")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-12")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-01")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-02")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-03")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-04")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-05")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-06")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-07")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-08")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-09")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-10")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-11")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-B-2026-12")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-month-C-2026-01")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-02")).toHaveText("10.00");
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
    await expect(pg_uma.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-overdue-count")).toHaveText("");
    await expect(pg_uma.getByTestId("note-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("plan-row-" + pl_ben_1).getByTestId("plan-generated")).toHaveText("0");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ben_1).getByTestId("plan-next-dates")).toHaveText("2026-04-28");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ben_1).getByTestId("plan-paused")).toHaveText("no");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ben_1).getByTestId("plan-change-line")).toHaveText(["2026-04-23 amount=3.33"]);
    await ui.expectAudit(sheet, [
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=1.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=5.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=3`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-03`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-A value=5`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=dup`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=4.00 note=tpl`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=review-sla value=1`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=escalate-after value=7`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00 from=2026-03-01`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C terms=20`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B terms=20`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Ben amount=99.95 start=2026-03-09 every=10 end=2026-04-30`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-04-05`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=10.25 date=2026-04-05`,
      `PERSON_HELD sheet=${sheet} by=uma name=Ben from=2026-02-25`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50 from=2026-03-16`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Ada amount=4.00 date=2026-04-05`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=4.00 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=4.00 due-total=2.00 overdue-total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Ben amount=10.25 date=2026-04-05`,
      `ROLLUP sheet=${sheet} by=vic person=Ben claimed=10.25 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=14.25 due-total=4.00 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=2.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=2.00`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P2 total=0.00 auto=yes`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=25.00 date=2026-04-23 ref=R-1 tags=c`,
      `PLAN_CHANGED sheet=${sheet} by=uma name=Ben start=2026-03-09 amount=3.33`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=25.00 date=2026-04-23`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=29.00 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=39.25 due-total=4.00 overdue-total=0.00`,
      `CLAIM_SPLIT sheet=${sheet} by=uma person=Ada amount=24.00 date=2026-04-23 into=`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=1.00 date=2026-04-23`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=B`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00 from=2026-03-05`,
      `CLAIM_SPLIT sheet=${sheet} by=uma person=Ada amount=14.00 date=2026-04-23 into=`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-04-23`
    ]);
  });
  test("restricted role scenario 2", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "clerk-limit", "3.00");
    await ui.setSetting(pg_uma, "floor", "0.50");
    await ui.setSetting(pg_uma, "terms", "10");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-15");
    await ui.setSetting(pg_uma, "period-numbering-from", "2026-03-01");
    await ui.setSetting(pg_uma, "terms-A", "3");
    await ui.setSetting(pg_uma, "perm-open", "clerk");
    await ui.setSetting(pg_uma, "grace-days", "0");
    await ui.setSetting(pg_uma, "grace-C", "2");
    await ui.setSetting(pg_uma, "proof-threshold-B", "0.50");
    expect(await ui.addVoidReason(pg_uma, "error")).toBe(true);
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "20.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "10.00"})).toBe(true);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "A"}));
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B"}));
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    expect(await ui.saveTemplate(pg_uma, {"name": "T1", "amount": "7.77", "note": "tpl"})).toBe(true);
    await ui.setSetting(pg_uma, "pot", "100.00");
    expect(await ui.setRole(pg_uma, "vic", "restricted")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "33.33"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B", "terms": "3", "contact": "ben@x"}));
    expect(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "A"})).toBeNull();
    expect(await ui.editPerson(pg_uma, p_ben, {"terms": "3", "termsFrom": "2026-03-12"})).toBe(true);
    expect(await ui.setSettingDated(pg_uma, "late-pct", "5.00", "2026-03-09", "5.00")).toBe(true);
    expect(await ui.hold(pg_uma, p_ben, {"from": "2026-02-10"})).toBe(true);
    expect(await ui.ratePreview(pg_uma, "A", "7.50")).toEqual({ count: 0, diff: "0.00" });
    expect(await ui.watch(pg_uma, p_ben, true)).toBe(true);
    expect(await ui.statementAsOf(pg_uma, p_ben, "2026-03-05")).toBe(false);
    expect(await ui.setSettingDated(pg_uma, "late-pct", "0.00", "2026-02-10", "5.00")).toBe(true);
    expect(await ui.hold(pg_uma, p_ben, {"from": "2026-03-01"})).toBe(true);
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
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "5.00", "from": "2026-03-10", "to": "2026-03-12"})).toBe(true);
    expect(await ui.periodAction(pg_uma, "P1", "close")).toBe(true);
    expect(await ui.importOpenings(pg_uma, "Ben,P1,1.00")).toBe(1);
    expect(await ui.editPerson(pg_uma, p_ben, {"grade": "C", "gradeFrom": "2026-03-28"}, "B")).toBe(true);
    expect(await ui.statement(pg_uma, p_ben)).toBe(true);
    expect(await ui.statement(pg_uma, p_ben)).toBe(true);
    expect(await ui.addNote(pg_uma, "")).toBe(false);
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
    expect(await ui.addClaim(pg_uma, p_ben, {"amount": "4.00", "date": "2026-03-05", "ref": "inv 7"})).toBeNull();
    await ui.setToday(pg_uma, "2026-03-27");
    expect(await ui.statement(pg_uma, p_ben)).toBe(true);
    expect(await ui.hold(pg_uma, p_ben, {"from": "2026-03-20"})).toBe(true);
    expect(await ui.statement(pg_uma, p_ben)).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_uma.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben (B)");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-count")).toHaveText("4");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-stated-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-date")).toHaveText("2026-03-27");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-hold")).toHaveText("yes");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-watched")).toHaveText("yes");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-active")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-contact")).toHaveText("ben@x");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-snapshot-line")).toHaveText(["2026-03-10 0.00"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-line-line")).toHaveText(["2026-03-10 0.00", "2026-03-10 0.00", "2026-03-27 0.00", "2026-03-27 0.00"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-approver")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-carried")).toHaveText("0.00");
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
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-fy")).toHaveText("FY2026");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-cap")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-locked")).toHaveText("no");
    await expect(pg_uma.getByTestId("rate-current-A")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-current-B")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-current-C")).toHaveText("10.00");
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
    await expect(pg_uma.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-void-error-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("classic-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-01")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-02")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-03")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-04")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-05")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-06")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-07")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-08")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-09")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-10")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-11")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-12")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-01")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-02")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-03")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-04")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-05")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-06")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-07")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-08")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-09")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-10")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-11")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-B-2026-12")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-month-C-2026-01")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-C-2026-02")).toHaveText("10.00");
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
    await expect(pg_uma.getByTestId("dash-pending-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-review-count")).toHaveText("");
    await expect(pg_uma.getByTestId("dash-overdue-count")).toHaveText("");
    await expect(pg_uma.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=0.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-A value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-open value=clerk`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-C value=2`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-B value=0.50`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `TEMPLATE_SAVED sheet=${sheet} by=uma name=T1 amount=7.77 note=tpl`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=pot value=100.00`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=restricted`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=33.33`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B terms=3 contact=ben@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B terms=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=5.00 from=2026-03-09`,
      `PERSON_HELD sheet=${sheet} by=uma name=Ben from=2026-02-10`,
      `PERSON_WATCHED sheet=${sheet} by=uma name=Ben`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=0.00 from=2026-02-10`,
      `PERSON_HELD sheet=${sheet} by=uma name=Ben from=2026-03-01`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00 from=2026-03-10 to=2026-03-12`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `OPENING_SET sheet=${sheet} by=uma name=Ben period=P1 amount=1.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B`,
      `STATEMENT sheet=${sheet} by=uma name=Ben due-total=0.00 claims=0`,
      `STATEMENT sheet=${sheet} by=uma name=Ben due-total=0.00 claims=0`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ben due-total=0.00`,
      `STATEMENT sheet=${sheet} by=uma name=Ben due-total=0.00 claims=0`,
      `PERSON_HELD sheet=${sheet} by=uma name=Ben from=2026-03-20`,
      `STATEMENT sheet=${sheet} by=uma name=Ben due-total=0.00 claims=0`
    ]);
  });
  test("restricted role scenario 3", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "policy-date", "2026-03-05");
    await ui.setSetting(pg_uma, "note-threshold", "2.50");
    await ui.setSetting(pg_uma, "entry-date", "2026-03-05");
    expect(await ui.addHoliday(pg_uma, "2026-04-03")).toBe(true);
    expect(await ui.addHoliday(pg_uma, "2026-03-13")).toBe(true);
    await ui.setSetting(pg_uma, "grace-B", "5");
    await ui.setSetting(pg_uma, "default-grade", "A");
    expect(await ui.setRole(pg_uma, "wes", "restricted")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "5.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C", "terms": "3"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B", "terms": "20", "tags": "b, a"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "C", "terms": "20", "contact": "ADA@X"}));
    expect(await ui.addPool(pg_uma, "P1")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ada", "share": "50.00"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Cam", "share": "50.00"})).toBe(true);
    expect(await ui.statementAsOf(pg_uma, p_cam, "2026-03-05")).toBe(false);
    const c_cam_0 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "4.00", "note": "n", "ref": "R-2", "tags": "a, B"}));
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.claimAction(pg_vic, c_cam_0, "open")).toBe(true);
    expect(await ui.setRate(pg_vic, {"grade": "C", "pct": "20.00", "from": "2026-03-25", "to": "2026-03-12"})).toBe(false);
    const c_ada_0 = ui.must(await ui.addClaim(pg_vic, p_ada, {"amount": "0.04", "date": "2026-04-02", "note": "n"}));
    const c_ada_1 = ui.must(await ui.quickAdd(pg_vic, {"name": "Ada", "amount": "1.00"}));
    expect(await ui.addComment(pg_vic, c_ada_1, "")).toBe(false);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-0-30")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("3");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
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
    expect(await ui.claimAction(pg_vic, c_ada_1, "open")).toBe(true);
    expect(await ui.split(pg_vic, p_ada, c_ada_1, "4.00")).toBeNull();
    expect(await ui.split(pg_vic, p_cam, c_cam_0, "10.00")).toBeNull();
    expect(await ui.addHoliday(pg_vic, "2026-04-06")).toBe(true);
    expect(await ui.bulkVoid(pg_vic, [c_ada_1, c_ada_0])).toEqual({ voided: 2, refused: 0 });
    await ui.refresh(pg_vic);
    expect(await ui.merge(pg_vic, p_ben, "Ada")).toBe(true);
    expect(await ui.setRate(pg_vic, {"grade": "B", "pct": "20.00"})).toBe(true);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-open-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_vic.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-0-30")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("rollup-aged-31-60")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-aged-61")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_vic.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-claims-VOID-count")).toHaveText("2");
    await expect(pg_vic.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_vic.getByTestId("header-due-total")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_vic.getByTestId("my-crew-due-total")).toHaveText("");
    expect(await ui.setApprover(pg_vic, p_ada, "wes")).toBe(true);
    await ui.refresh(pg_vic);
    expect(await ui.merge(pg_vic, p_cam, "Ada")).toBe(true);
    const c_ada_2 = await ui.claimAt(pg_vic, p_ada, 2);
    await ui.refresh(pg_uma);
    expect(await ui.claimAction(pg_uma, c_ada_2, "settle")).toBe(true);
    const c_ada_3 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "7.77", "note": "n", "tags": "a, B"}));
    expect(await ui.statementAsOf(pg_uma, p_ada, "2026-02-10")).toBe(false);
    const c_ada_4 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.35", "date": "2026-03-20"}));
    expect(await ui.addAlias(pg_uma, p_ada, "")).toBe(false);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("4.00");
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
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await ui.setAsOf(pg_uma, "2026-03-05");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("2026-03-05");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_uma.getByTestId("consolidated-people-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
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
    await expect(pg_uma.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=2.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-05`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-03`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-B value=5`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=default-grade value=A`,
      `ROLE_SET sheet=${sheet} by=uma user=wes role=restricted`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=n/a overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B terms=20`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=C terms=20 contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=n/a overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=50.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Cam share=50.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=4.00 date=2026-03-05 ref=R-2 tags=a,b`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Cam amount=4.00 date=2026-03-05`,
      `ROLLUP sheet=${sheet} by=vic person=Cam claimed=4.00 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=4.00 due-total=1.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ada amount=0.04 date=2026-04-02`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ada amount=1.00 date=2026-03-05`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Ada amount=1.00 date=2026-03-05`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=1.00 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=5.00 due-total=1.00 overdue-total=0.00`,
      `HOLIDAY_ADDED sheet=${sheet} by=vic date=2026-04-06`,
      `CLAIM_VOIDED sheet=${sheet} by=vic person=Ada amount=1.00 date=2026-03-05`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=0.00 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=4.00 due-total=1.00 overdue-total=0.00`,
      `CLAIM_VOIDED sheet=${sheet} by=vic person=Ada amount=0.04 date=2026-04-02`,
      `PERSON_MERGED sheet=${sheet} by=vic from=Ben into=Ada`,
      `RATE_SET sheet=${sheet} by=vic grade=B rate=20.00`,
      `APPROVER_SET sheet=${sheet} by=vic name=Ada user=wes`,
      `PERSON_MERGED sheet=${sheet} by=vic from=Cam into=Ada`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=4.00 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=4.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_SETTLED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-05 number=FY2026-1 due=n/a`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-05 tags=a,b`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.35 date=2026-03-20`
    ]);
    await ui.clearAsOf(pg_uma);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_uma.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("consolidated-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("consolidated-status-DRAFT-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("consolidated-status-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("consolidated-status-SETTLED-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("consolidated-status-VOID-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("consolidated-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (C)");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-date")).toHaveText("");
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
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("Ben, Cam");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-snapshot-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-statement-line-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-flag-shown")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-approver")).toHaveText("wes");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-amount")).toHaveText("10.35");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-due-by")).toHaveText("2026-03-25");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=n/a"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-amount")).toHaveText("7.77");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-due-by")).toHaveText("2026-03-10");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=n/a"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-tags")).toHaveText("a, b");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-amount")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-number")).toHaveText("FY2026-1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-opened-by")).toHaveText("vic");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-due-by")).toHaveText("2026-04-07");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=1.00", "OPEN by vic on 2026-03-10 due=1.00", "SETTLED by uma on 2026-03-10 due=n/a"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-ref")).toHaveText("R-2");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-tags")).toHaveText("a, b");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("vic");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due-by")).toHaveText("2026-03-10");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by vic on 2026-03-10 due=n/a", "OPEN by vic on 2026-03-10 due=n/a", "VOID by vic on 2026-03-10 due=n/a"]);
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
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("0.04");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-04-02");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("VOID");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-04-09");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by vic on 2026-03-10 due=n/a", "VOID by vic on 2026-03-10 due=n/a"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-review-late")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-waived")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-receipt")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs-photo")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-held")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("4.00");
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
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-crew-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("rate-current-A")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-current-B")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-current-C")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("summary-status-REVIEW-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-review-late-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("classic-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("tag-a-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("tag-b-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("month-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("month-2026-04-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_uma.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-share")).toHaveText("100.00");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_uma.getByTestId("rate-month-A-2026-01")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-02")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-03")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-04")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-05")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-06")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-07")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-08")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-09")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-10")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-11")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-A-2026-12")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-01")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-02")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-03")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-04")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-05")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-06")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-07")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-08")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-09")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-10")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-11")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("rate-month-B-2026-12")).toHaveText("20.00");
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
    await expect(pg_uma.getByTestId("note-line")).toHaveText([]);
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=2.50`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=entry-date value=2026-03-05`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-03`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-03-13`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-B value=5`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=default-grade value=A`,
      `ROLE_SET sheet=${sheet} by=uma user=wes role=restricted`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=5.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=n/a overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B terms=20`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=C terms=20 contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=n/a overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=50.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Cam share=50.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=4.00 date=2026-03-05 ref=R-2 tags=a,b`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Cam amount=4.00 date=2026-03-05`,
      `ROLLUP sheet=${sheet} by=vic person=Cam claimed=4.00 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=4.00 due-total=1.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ada amount=0.04 date=2026-04-02`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ada amount=1.00 date=2026-03-05`,
      `CLAIM_OPENED sheet=${sheet} by=vic person=Ada amount=1.00 date=2026-03-05`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=1.00 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=5.00 due-total=1.00 overdue-total=0.00`,
      `HOLIDAY_ADDED sheet=${sheet} by=vic date=2026-04-06`,
      `CLAIM_VOIDED sheet=${sheet} by=vic person=Ada amount=1.00 date=2026-03-05`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=0.00 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=4.00 due-total=1.00 overdue-total=0.00`,
      `CLAIM_VOIDED sheet=${sheet} by=vic person=Ada amount=0.04 date=2026-04-02`,
      `PERSON_MERGED sheet=${sheet} by=vic from=Ben into=Ada`,
      `RATE_SET sheet=${sheet} by=vic grade=B rate=20.00`,
      `APPROVER_SET sheet=${sheet} by=vic name=Ada user=wes`,
      `PERSON_MERGED sheet=${sheet} by=vic from=Cam into=Ada`,
      `ROLLUP sheet=${sheet} by=vic person=Ada claimed=4.00 due-total=n/a overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=vic claimed-total=4.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_SETTLED sheet=${sheet} by=uma person=Ada amount=4.00 date=2026-03-05 number=FY2026-1 due=n/a`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-05 tags=a,b`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.35 date=2026-03-20`
    ]);
  });
});
