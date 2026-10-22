import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("plan preview", () => {
  test("plan preview", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-01");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    const pl_ada_1 = ui.must(await ui.addPlan(pg_uma, p_ada, {"amount": "10.00", "start": "2026-02-20", "end": "2026-04-15", "every": "7"}));
    const pl_ada_2 = ui.must(await ui.addPlan(pg_uma, p_ada, {"amount": "1.00", "start": "2026-03-31", "end": "2026-12-31", "day": "31"}));
    const pl_ada_3 = ui.must(await ui.addPlan(pg_uma, p_ada, {"amount": "1.00", "start": "2026-03-01", "end": "2026-03-05", "every": "10"}));
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_1).getByTestId("plan-generated")).toHaveText("0");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_1).getByTestId("plan-next-dates")).toHaveText("2026-03-06, 2026-03-13, 2026-03-20, 2026-03-27, 2026-04-03");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_2).getByTestId("plan-generated")).toHaveText("0");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_2).getByTestId("plan-next-dates")).toHaveText("2026-03-31, 2026-04-30, 2026-05-31, 2026-06-30, 2026-07-31");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_3).getByTestId("plan-generated")).toHaveText("0");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_3).getByTestId("plan-next-dates")).toHaveText("");
    expect(await ui.generatePlans(pg_uma)).toBe(3);
    const c_ada_0 = await ui.claimAt(pg_uma, p_ada, 0);
    const c_ada_1 = await ui.claimAt(pg_uma, p_ada, 1);
    const c_ada_2 = await ui.claimAt(pg_uma, p_ada, 2);
    await ui.setToday(pg_uma, "2026-03-20");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_1).getByTestId("plan-generated")).toHaveText("2");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_1).getByTestId("plan-next-dates")).toHaveText("2026-03-27, 2026-04-03, 2026-04-10");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_2).getByTestId("plan-generated")).toHaveText("0");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_2).getByTestId("plan-next-dates")).toHaveText("2026-03-31, 2026-04-30, 2026-05-31, 2026-06-30, 2026-07-31");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_3).getByTestId("plan-generated")).toHaveText("1");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_3).getByTestId("plan-next-dates")).toHaveText("");
    await ui.setToday(pg_uma, "2026-04-20");
    expect(await ui.generatePlans(pg_uma)).toBe(7);
    const c_ada_3 = await ui.claimAt(pg_uma, p_ada, 3);
    const c_ada_4 = await ui.claimAt(pg_uma, p_ada, 4);
    const c_ada_5 = await ui.claimAt(pg_uma, p_ada, 5);
    const c_ada_6 = await ui.claimAt(pg_uma, p_ada, 6);
    const c_ada_7 = await ui.claimAt(pg_uma, p_ada, 7);
    const c_ada_8 = await ui.claimAt(pg_uma, p_ada, 8);
    const c_ada_9 = await ui.claimAt(pg_uma, p_ada, 9);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_9).getByTestId("claim-date")).toHaveText("2026-03-31");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_8).getByTestId("claim-date")).toHaveText("2026-04-10");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_7).getByTestId("claim-date")).toHaveText("2026-04-03");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_6).getByTestId("claim-date")).toHaveText("2026-03-27");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_5).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-date")).toHaveText("2026-03-13");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-date")).toHaveText("2026-03-06");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-date")).toHaveText("2026-03-01");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-02-27");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-02-20");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_1).getByTestId("plan-generated")).toHaveText("8");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_1).getByTestId("plan-next-dates")).toHaveText("");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_2).getByTestId("plan-generated")).toHaveText("1");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_2).getByTestId("plan-next-dates")).toHaveText("2026-04-30, 2026-05-31, 2026-06-30, 2026-07-31, 2026-08-31");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_3).getByTestId("plan-generated")).toHaveText("1");
    await expect(pg_uma.getByTestId("plan-row-" + pl_ada_3).getByTestId("plan-next-dates")).toHaveText("");
    await ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Ada amount=10.00 start=2026-02-20 every=7 end=2026-04-15`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Ada amount=1.00 start=2026-03-31 day=31 end=2026-12-31`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Ada amount=1.00 start=2026-03-01 every=10 end=2026-03-05`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-02-20`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-02-27`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=1.00 date=2026-03-01`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`,
      `SNAPSHOT sheet=${sheet} by=uma name=Ada due-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-03-06`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-03-13`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-03-20`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-03-27`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-04-03`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.00 date=2026-04-10`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=1.00 date=2026-03-31`
    ]);
  });
  test("plan preview scenario 1", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "clerk-limit", "3.00");
    await ui.setSetting(pg_uma, "late-pct", "10.00");
    await ui.setSetting(pg_uma, "period-numbering-from", "2026-03-01");
    await ui.setSetting(pg_uma, "terms-C", "20");
    await ui.setSetting(pg_uma, "cap", "2.00");
    await ui.setSetting(pg_uma, "grace-days", "3");
    expect(await ui.addHoliday(pg_uma, "2026-04-03")).toBe(true);
    await ui.setSetting(pg_uma, "proof-threshold-A", "4.00");
    expect(await ui.addVoidReason(pg_uma, "error")).toBe(true);
    expect(await ui.addVoidReason(pg_uma, "dup")).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "33.33", "from": "2026-03-10"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C", "contact": "ADA@X"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "C", "terms": "3"}));
    expect(await ui.addPool(pg_uma, "P1")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ada", "share": "50.00"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Cam", "share": "50.00", "from": "2026-03-01", "to": "2026-04-30"})).toBe(true);
    expect(await ui.addPool(pg_uma, "P2")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P2", {"member": "Ada", "share": "100.00"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "pool:P2", "share": "10.00"})).toBe(true);
    const pl_ada_1 = ui.must(await ui.addPlan(pg_uma, p_ada, {"amount": "10.35", "start": "2026-02-20", "end": "2026-04-30", "every": "7"}));
    const c_ben_0 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "25.00", "date": "2026-03-15", "ref": "R-1", "tags": "a"}));
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00"})).toBe(true);
    expect(await ui.ratePreview(pg_uma, "C", "20.00")).toEqual({ count: 0, diff: "0.00" });
    expect(await ui.ratePreview(pg_uma, "B", "20.00")).toEqual({ count: 0, diff: "0.00" });
    const c_cam_0 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "7.77", "date": "2026-03-15", "note": "n", "tags": "a, B"}));
    await ui.expectAuditView(pg_uma, "Ada", [
      `PLAN_ADDED sheet=${sheet} by=uma name=Ada amount=10.35 start=2026-02-20 every=7 end=2026-04-30`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P2 name=Ada share=100.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=50.00`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=n/a overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C contact=ada@x`
    ]);
    expect(await ui.editInline(pg_uma, c_cam_0, "12.50")).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("3");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    expect(await ui.hold(pg_uma, p_cam, {"from": "2026-03-15", "to": "2026-03-28"})).toBe(true);
    expect(await ui.periodAction(pg_uma, "P1", "close")).toBe(true);
    expect(await ui.retire(pg_uma, p_ben, "2026-03-15")).toBe(true);
    await ui.showRetired(pg_uma, true);
    expect(await ui.watch(pg_uma, p_cam, true)).toBe(true);
    expect(await ui.inlineGrade(pg_uma, p_ada, "A")).toBe(true);
    expect(await ui.addHoliday(pg_uma, "2026-04-06")).toBe(true);
    expect(await ui.editClaim(pg_uma, c_cam_0, {"amount": "25.00"})).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.88");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("3");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    expect(await ui.addClaim(pg_uma, p_ben, {"amount": "99.95", "date": "2026-03-01", "note": "n", "ref": "R-1"})).toBeNull();
    expect(await ui.addClaim(pg_uma, p_ben, {"amount": "7.77", "date": "2026-04-02", "ref": "inv 7"})).toBeNull();
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00"})).toBe(true);
    expect(await ui.addProof(pg_uma, c_ben_0)).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.archive(pg_wes)).toBe(true);
    expect(await ui.addClaim(pg_wes, p_cam, {"amount": "7.77"})).toBeNull();
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("sheet-archived")).toHaveText("yes");
    await expect(pg_wes.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_wes.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_wes.getByTestId("consolidated-people-count")).toHaveText("3");
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
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam (B)");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
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
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-amount")).toHaveText("25.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-date")).toHaveText("2026-03-15");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("1.88");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-number")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due-by")).toHaveText("2026-04-02");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-20 due=1.00"]);
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
    await expect(pg_wes.getByTestId("person-row-" + p_ben)).toHaveCount(0);
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("3");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("33.33");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("7.50");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("n/a");
    await expect(pg_wes.getByTestId("summary-grade-A-count")).toHaveText("1");
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
    await expect(pg_wes.getByTestId("summary-status-DRAFT-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("summary-status-OPEN-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-void-error-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("summary-void-dup-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("tag-a-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("tag-b-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("month-2026-03-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("110.00");
    await expect(pg_wes.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("no");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-share")).toHaveText("50.00");
    await expect(pg_wes.getByTestId("pool-member-P1-" + p_cam).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-share")).toHaveText("10.00");
    await expect(pg_wes.getByTestId("pool-member-P1-pool-P2").getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("pool-row-P2").getByTestId("pool-total-share")).toHaveText("100.00");
    await expect(pg_wes.getByTestId("pool-row-P2").getByTestId("pool-balanced")).toHaveText("yes");
    await expect(pg_wes.getByTestId("pool-member-P2-" + p_ada).getByTestId("pool-share")).toHaveText("100.00");
    await expect(pg_wes.getByTestId("pool-member-P2-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_wes.getByTestId("plan-row-" + pl_ada_1).getByTestId("plan-generated")).toHaveText("0");
    await expect(pg_wes.getByTestId("plan-row-" + pl_ada_1).getByTestId("plan-next-dates")).toHaveText("2026-03-27, 2026-04-03, 2026-04-10, 2026-04-17, 2026-04-24");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=late-pct value=10.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=period-numbering-from value=2026-03-01`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms-C value=20`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=cap value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=3`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-03`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-A value=4.00`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=error`,
      `VOID_REASON_ADDED sheet=${sheet} by=uma reason=dup`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=33.33 from=2026-03-10`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C contact=ada@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=n/a overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B`,
      `ROLLUP sheet=${sheet} by=uma person=Cam claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=C terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=n/a overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=50.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Cam share=50.00 from=2026-03-01 to=2026-04-30`,
      `POOL_ADDED sheet=${sheet} by=uma name=P2`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P2 name=Ada share=100.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=P2 share=10.00`,
      `PLAN_ADDED sheet=${sheet} by=uma name=Ada amount=10.35 start=2026-02-20 every=7 end=2026-04-30`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=25.00 date=2026-03-15 ref=R-1 tags=a`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=7.77 date=2026-03-15 tags=a,b`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Cam amount=12.50 date=2026-03-15`,
      `PERSON_HELD sheet=${sheet} by=uma name=Cam from=2026-03-15`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `PERSON_RETIRED sheet=${sheet} by=uma name=Ben from=2026-03-15`,
      `PERSON_WATCHED sheet=${sheet} by=uma name=Cam`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `HOLIDAY_ADDED sheet=${sheet} by=uma date=2026-04-06`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Cam amount=25.00 date=2026-03-15`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `CLAIM_PROOF_ADDED sheet=${sheet} by=uma person=Ben amount=25.00 date=2026-03-15 proofs=1`,
      `SHEET_ARCHIVED sheet=${sheet} by=wes`
    ]);
  });
  test("plan preview scenario 2", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-04-05");
    expect(await ui.setRole(pg_uma, "wes", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "floor", "2.00");
    await ui.setSetting(pg_uma, "terms", "10");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-05");
    await ui.setSetting(pg_uma, "perm-close", "clerk");
    expect(await ui.setRole(pg_uma, "vic", "viewer")).toBe(true);
    await ui.setSetting(pg_uma, "grace-days", "3");
    await ui.setSetting(pg_uma, "note-threshold", "1.00");
    await ui.setSetting(pg_uma, "grace-B", "5");
    await ui.loadSheet(pg_uma, `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "7.50"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    await ui.loadSheet(pg_uma, sheet);
    await ui.setSetting(pg_uma, "parent", `${sheet}-p`);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "7.50", "from": "2026-03-10", "to": "2026-03-25"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "A", "terms": "20", "contact": " Ada@x ", "tags": "a"})).toBeNull();
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A", "contact": "ben@x"}));
    expect(await ui.periodAction(pg_uma, "P1", "soft-close")).toBe(true);
    expect(await ui.statementAsOf(pg_uma, p_ada, "2026-03-09")).toBe(false);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "33.33"})).toBe(true);
    expect(await ui.pasteClaims(pg_uma, "Ada,0.40,,\nAda,4.00,2026-03-15,paste\nAda,4.00,,a, b")).toBeNull();
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.transfer(pg_wes, p_ada, `${sheet}-t`)).toBe(true);
    const p_fay = ui.must(await ui.addPerson(pg_wes, {"name": "Fay", "grade": "C"}));
    const c_fay_0 = ui.must(await ui.addClaim(pg_wes, p_fay, {"amount": "99.95", "date": "2026-03-05", "note": "n", "ref": "inv 7"}));
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-due")).toHaveText("33.31");
    await expect(pg_wes.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-stated")).toHaveText("no");
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
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    expect(await ui.addLine(pg_wes, c_fay_0, {"label": "y", "qty": "3", "unit": "4.00"})).toBe(true);
    await ui.expectAuditView(pg_wes, "Fay", [
      `CLAIM_LINE_ADDED sheet=${sheet} by=wes person=Fay amount=12.00 date=2026-03-05 label=y qty=3 unit=4.00`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Fay amount=99.95 date=2026-03-05 ref=inv 7`,
      `ROLLUP sheet=${sheet} by=wes person=Fay claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=wes name=Fay grade=C`
    ]);
    expect(await ui.claimAction(pg_wes, c_fay_0, "open")).toBe(true);
    await ui.setSetting(pg_wes, "policy-date", "2026-03-15");
    await ui.expectAuditView(pg_wes, "Fay", [
      `ROLLUP sheet=${sheet} by=wes person=Fay claimed=12.00 due-total=4.00 overdue-total=4.00`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Fay amount=12.00 date=2026-03-05 number=FY2026-1`,
      `CLAIM_LINE_ADDED sheet=${sheet} by=wes person=Fay amount=12.00 date=2026-03-05 label=y qty=3 unit=4.00`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Fay amount=99.95 date=2026-03-05 ref=inv 7`,
      `ROLLUP sheet=${sheet} by=wes person=Fay claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=wes name=Fay grade=C`
    ]);
    expect(await ui.setRate(pg_wes, {"grade": "C", "pct": "5.00"})).toBe(true);
    await ui.setToday(pg_wes, "2026-04-27");
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("12.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("12.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await ui.refresh(pg_wes);
    expect(await ui.periodAction(pg_wes, "P1", "reopen")).toBe(true);
    expect(await ui.addComment(pg_wes, c_fay_0, "see note")).toBe(true);
    expect(await ui.setRate(pg_wes, {"grade": "A", "pct": "5.00"})).toBe(true);
    const c_fay_1 = ui.must(await ui.quickAdd(pg_wes, {"name": "Fay", "amount": "3.33"}));
    expect(await ui.setRate(pg_wes, {"grade": "C", "pct": "33.33", "from": "2026-03-01", "to": "2026-03-12"})).toBe(true);
    expect(await ui.addLine(pg_wes, c_fay_1, {"label": "y", "qty": "3", "unit": "4.00"})).toBe(true);
    const c_fay_2 = ui.must(await ui.split(pg_wes, p_fay, c_fay_0, "4.00"));
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("12.00");
    await expect(pg_wes.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-due")).toHaveText("1.33");
    await expect(pg_wes.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_wes.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-due")).toHaveText("2.67");
    await expect(pg_wes.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_wes.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("12.00");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("rollup-overdue-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("rollup-overdue-total")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-open-total")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_wes.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_wes.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_wes.getByTestId("header-due-total")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("header-overdue-total")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_wes.getByTestId("my-overdue-total")).toHaveText("");
    await ui.refresh(pg_uma);
    expect(await ui.claimAction(pg_uma, c_fay_1, "open")).toBe(false);
    await ui.setAsOf(pg_uma, "2026-02-10");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("2026-02-10");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
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
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
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
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-close value=clerk`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-B value=5`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=7.50 from=2026-03-10 to=2026-03-25`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A contact=ben@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=33.33`,
      `PERSON_TRANSFERRED sheet=${sheet} by=wes name=Ada to=${sheet}-t`,
      `PERSON_ADDED sheet=${sheet} by=wes name=Fay grade=C`,
      `ROLLUP sheet=${sheet} by=wes person=Fay claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Fay amount=99.95 date=2026-03-05 ref=inv 7`,
      `CLAIM_LINE_ADDED sheet=${sheet} by=wes person=Fay amount=12.00 date=2026-03-05 label=y qty=3 unit=4.00`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Fay amount=12.00 date=2026-03-05 number=FY2026-1`,
      `ROLLUP sheet=${sheet} by=wes person=Fay claimed=12.00 due-total=4.00 overdue-total=4.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=12.00 due-total=4.00 overdue-total=4.00`,
      `SETTING_CHANGED sheet=${sheet} by=wes key=policy-date value=2026-03-15`,
      `RATE_SET sheet=${sheet} by=wes grade=C rate=5.00`,
      `ROLLUP sheet=${sheet} by=wes person=Fay claimed=12.00 due-total=1.00 overdue-total=1.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=12.00 due-total=1.00 overdue-total=1.00`,
      `SNAPSHOT sheet=${sheet} by=wes name=Fay due-total=1.00`,
      `PERIOD_REOPENED sheet=${sheet} by=wes period=P1`,
      `COMMENT_ADDED sheet=${sheet} by=wes person=Fay amount=12.00 date=2026-03-05 number=FY2026-1 text=see note`,
      `RATE_SET sheet=${sheet} by=wes grade=A rate=5.00`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Fay amount=3.33 date=2026-04-27`,
      `RATE_SET sheet=${sheet} by=wes grade=C rate=33.33 from=2026-03-01 to=2026-03-12`,
      `ROLLUP sheet=${sheet} by=wes person=Fay claimed=12.00 due-total=4.00 overdue-total=4.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=12.00 due-total=4.00 overdue-total=4.00`,
      `CLAIM_LINE_ADDED sheet=${sheet} by=wes person=Fay amount=12.00 date=2026-04-27 label=y qty=3 unit=4.00`,
      `CLAIM_SPLIT sheet=${sheet} by=wes person=Fay amount=8.00 date=2026-03-05 number=FY2026-1 into=FY2026-2`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Fay amount=4.00 date=2026-03-05 number=FY2026-2`
    ]);
    await ui.clearAsOf(pg_uma);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("__SHEET__-p");
    await expect(pg_uma.getByTestId("consolidated-people-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("consolidated-due-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("consolidated-overdue-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-name")).toHaveText("Fay (C)");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-claimed")).toHaveText("12.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-due-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-overdue-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-overdue-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-terms")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-active")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-aged-31-60")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-open-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-contact")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_fay).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-amount")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-due")).toHaveText("1.33");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-number")).toHaveText("FY2026-2");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-opened-by")).toHaveText("wes");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-due-by")).toHaveText("2026-03-19");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-log-line")).toHaveText(["OPEN by wes on 2026-04-27 due=1.33"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-split-from")).toHaveText("FY2026-1");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_2).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-amount")).toHaveText("12.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-date")).toHaveText("2026-04-27");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-due")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-number")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-opened-by")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-due-by")).toHaveText("2026-05-11");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-04-27 due=2.00"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_1).getByTestId("claim-lines-line")).toHaveText(["y 3 x 4.00"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-amount")).toHaveText("8.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-due")).toHaveText("2.67");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-number")).toHaveText("FY2026-1");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-opened-by")).toHaveText("wes");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-due-by")).toHaveText("2026-03-19");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-overdue")).toHaveText("yes");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by wes on 2026-04-05 due=33.31", "OPEN by wes on 2026-04-05 due=4.00"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-ref")).toHaveText("inv 7");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-comments-line")).toHaveText(["wes on 2026-04-27: see note"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_fay_0).getByTestId("claim-lines-line")).toHaveText(["y 3 x 4.00"]);
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("12.00");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("no");
    await expect(pg_uma.getByTestId("rate-current-A")).toHaveText("5.00");
    await expect(pg_uma.getByTestId("rate-current-B")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-current-C")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-C-due-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("month-2026-03-due-total")).toHaveText("4.00");
    await expect(pg_uma.getByTestId("month-2026-04-due-total")).toHaveText("0.00");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=wes role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=floor value=2.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=10`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-05`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=perm-close value=clerk`,
      `ROLE_SET sheet=${sheet} by=uma user=vic role=viewer`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=3`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=note-threshold value=1.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-B value=5`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=parent value=${sheet}-p`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=7.50 from=2026-03-10 to=2026-03-25`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A contact=ben@x`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERIOD_SOFT_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=33.33`,
      `PERSON_TRANSFERRED sheet=${sheet} by=wes name=Ada to=${sheet}-t`,
      `PERSON_ADDED sheet=${sheet} by=wes name=Fay grade=C`,
      `ROLLUP sheet=${sheet} by=wes person=Fay claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Fay amount=99.95 date=2026-03-05 ref=inv 7`,
      `CLAIM_LINE_ADDED sheet=${sheet} by=wes person=Fay amount=12.00 date=2026-03-05 label=y qty=3 unit=4.00`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Fay amount=12.00 date=2026-03-05 number=FY2026-1`,
      `ROLLUP sheet=${sheet} by=wes person=Fay claimed=12.00 due-total=4.00 overdue-total=4.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=12.00 due-total=4.00 overdue-total=4.00`,
      `SETTING_CHANGED sheet=${sheet} by=wes key=policy-date value=2026-03-15`,
      `RATE_SET sheet=${sheet} by=wes grade=C rate=5.00`,
      `ROLLUP sheet=${sheet} by=wes person=Fay claimed=12.00 due-total=1.00 overdue-total=1.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=12.00 due-total=1.00 overdue-total=1.00`,
      `SNAPSHOT sheet=${sheet} by=wes name=Fay due-total=1.00`,
      `PERIOD_REOPENED sheet=${sheet} by=wes period=P1`,
      `COMMENT_ADDED sheet=${sheet} by=wes person=Fay amount=12.00 date=2026-03-05 number=FY2026-1 text=see note`,
      `RATE_SET sheet=${sheet} by=wes grade=A rate=5.00`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Fay amount=3.33 date=2026-04-27`,
      `RATE_SET sheet=${sheet} by=wes grade=C rate=33.33 from=2026-03-01 to=2026-03-12`,
      `ROLLUP sheet=${sheet} by=wes person=Fay claimed=12.00 due-total=4.00 overdue-total=4.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=12.00 due-total=4.00 overdue-total=4.00`,
      `CLAIM_LINE_ADDED sheet=${sheet} by=wes person=Fay amount=12.00 date=2026-04-27 label=y qty=3 unit=4.00`,
      `CLAIM_SPLIT sheet=${sheet} by=wes person=Fay amount=8.00 date=2026-03-05 number=FY2026-1 into=FY2026-2`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Fay amount=4.00 date=2026-03-05 number=FY2026-2`
    ]);
  });
  test("plan preview scenario 3", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRole(pg_uma, "vic", "steward")).toBe(true);
    await ui.setSetting(pg_uma, "clerk-limit", "3.00");
    await ui.setSetting(pg_uma, "terms", "30");
    await ui.setSetting(pg_uma, "policy-date", "2026-03-15");
    await ui.setSetting(pg_uma, "grace-days", "0");
    await ui.setSetting(pg_uma, "grace-A", "2");
    await ui.setSetting(pg_uma, "proof-threshold-B", "0.50");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "7.50", "from": "2026-03-16"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P1", "from": "2026-03-01", "to": "2026-03-15"})).toBe(true);
    expect(await ui.addPeriod(pg_uma, {"name": "P2", "from": "2026-03-16", "to": "2026-03-31"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B", "terms": "20"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "A", "terms": "3"}));
    expect(await ui.addPool(pg_uma, "P1")).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ada", "share": "70.00"})).toBe(true);
    expect(await ui.addPoolMember(pg_uma, "P1", {"member": "Ben", "share": "20.00"})).toBe(true);
    expect(await ui.editPerson(pg_uma, p_ben, {"grade": "C", "gradeFrom": "2026-03-01"})).toBe(true);
    await ui.sortBy(pg_uma, "name");
    expect(await ui.statementAsOf(pg_uma, p_ben, "2026-03-09")).toBe(false);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "0.40", "date": "2026-03-09", "tags": "a"}));
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "5.00", "from": "2026-03-16"})).toBe(true);
    expect(await ui.editPerson(pg_uma, p_ada, {"terms": ""})).toBe(true);
    expect(await ui.editPerson(pg_uma, p_ada, {"grade": "B", "gradeFrom": "2026-03-01"})).toBe(true);
    await ui.refresh(pg_uma);
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
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    expect(await ui.addLine(pg_uma, c_ada_0, {"label": "y", "qty": "3", "unit": "2.50"})).toBe(true);
    expect(await ui.periodAction(pg_uma, "P2", "close")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "0.40", "note": "n", "ref": "R-2"}));
    await ui.setSetting(pg_uma, "proof-threshold", "1.00");
    await ui.expectAuditView(pg_uma, "Ben", [
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=C`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ben share=20.00`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A terms=3`
    ]);
    expect(await ui.periodAction(pg_uma, "P1", "close")).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("DRAFT");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    expect(await ui.claimAction(pg_wes, c_ada_1, "open")).toBe(true);
    expect(await ui.claimAction(pg_wes, c_ada_0, "settle")).toBe(true);
    await ui.refresh(pg_uma);
    expect(await ui.ratePreview(pg_uma, "A", "12.50")).toEqual({ count: 0, diff: "0.00" });
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("sheet-archived")).toHaveText("no");
    await expect(pg_uma.getByTestId("sheet-asof")).toHaveText("");
    await expect(pg_uma.getByTestId("sheet-parent")).toHaveText("");
    await expect(pg_uma.getByTestId("consolidated-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("consolidated-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("consolidated-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (B)");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("7.90");
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
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-terms")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-active")).toHaveText("yes");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-0-30")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-settled-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-open-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-contact")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("0.40");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-03-10");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("n");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-status")).toHaveText("OPEN");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-number")).toHaveText("FY2026-2");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-opened-by")).toHaveText("wes");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due-by")).toHaveText("2026-04-21");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=1.00", "OPEN by wes on 2026-03-10 due=1.00"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-ref")).toHaveText("R-2");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-lines-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("7.50");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-03-09");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-status")).toHaveText("SETTLED");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-number")).toHaveText("FY2026-1");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-opened-by")).toHaveText("uma");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-stated")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-period")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due-by")).toHaveText("2026-04-06");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-overdue")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-corrects")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-log-line")).toHaveText(["DRAFT by uma on 2026-03-10 due=1.00", "OPEN by uma on 2026-03-10 due=1.00", "SETTLED by wes on 2026-03-10 due=1.00"]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-deferred-until")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-proofs")).toHaveText("0");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-split-from")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-late-entry")).toHaveText("no");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-reminded")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-ref")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-tags")).toHaveText("a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-comments-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-lines-line")).toHaveText(["y 3 x 2.50"]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben (C)");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-stated-total")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-statement-date")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retired")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retired-from")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-hold")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-patrons")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-backing")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-excess")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-watched")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-terms")).toHaveText("3");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-active")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-0-30")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-31-60")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aged-61")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-settled-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-open-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-contact")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-aliases")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-clashing")).toHaveText("no");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-origin")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-retirement-line")).toHaveText([]);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-tags")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("7.90");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("rollup-overdue-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("rollup-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-settled-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("rollup-open-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("bulk-settle-batch")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-cut-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("header-people-count")).toHaveText("2");
    await expect(pg_uma.getByTestId("header-claims-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-claims-SETTLED-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("header-claims-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("header-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("header-overdue-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("my-due-total")).toHaveText("");
    await expect(pg_uma.getByTestId("my-overdue-total")).toHaveText("");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P1").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("period-row-P2").getByTestId("period-closed")).toHaveText("yes");
    await expect(pg_uma.getByTestId("rate-current-A")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("rate-current-B")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-current-C")).toHaveText("33.33");
    await expect(pg_uma.getByTestId("summary-grade-A-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-A-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-A-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-grade-B-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-B-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("summary-grade-B-active")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-C-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-grade-C-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-grade-C-active")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-period-P1-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P2-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-period-P1-change")).toHaveText("");
    await expect(pg_uma.getByTestId("summary-period-P2-change")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("summary-status-DRAFT-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-OPEN-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-status-PENDING-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("summary-status-SETTLED-count")).toHaveText("1");
    await expect(pg_uma.getByTestId("summary-status-VOID-count")).toHaveText("0");
    await expect(pg_uma.getByTestId("tag-a-due-total")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("month-2026-03-due-total")).toHaveText("2.00");
    await expect(pg_uma.getByTestId("pool-row-P1").getByTestId("pool-total-share")).toHaveText("90.00");
    await expect(pg_uma.getByTestId("pool-row-P1").getByTestId("pool-balanced")).toHaveText("no");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-share")).toHaveText("70.00");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_ada).getByTestId("pool-cut")).toHaveText("");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-share")).toHaveText("20.00");
    await expect(pg_uma.getByTestId("pool-member-P1-" + p_ben).getByTestId("pool-cut")).toHaveText("");
    await ui.expectAudit(sheet, [
      `ROLE_SET sheet=${sheet} by=uma user=vic role=steward`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=clerk-limit value=3.00`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=terms value=30`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=policy-date value=2026-03-15`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-days value=0`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=grace-A value=2`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold-B value=0.50`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=7.50 from=2026-03-16`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P1 from=2026-03-01 to=2026-03-15`,
      `PERIOD_ADDED sheet=${sheet} by=uma period=P2 from=2026-03-16 to=2026-03-31`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B terms=20`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A terms=3`,
      `ROLLUP sheet=${sheet} by=uma person=Ben claimed=0.00 due-total=0.00 overdue-total=0.00`,
      `POOL_ADDED sheet=${sheet} by=uma name=P1`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ada share=70.00`,
      `POOL_MEMBER_ADDED sheet=${sheet} by=uma pool=P1 name=Ben share=20.00`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=C`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=0.40 date=2026-03-09 tags=a`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=5.00 from=2026-03-16`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=B terms=`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=B`,
      `CLAIM_LINE_ADDED sheet=${sheet} by=uma person=Ada amount=7.50 date=2026-03-09 label=y qty=3 unit=2.50`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P2 total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=uma person=Ada amount=7.50 date=2026-03-09 number=FY2026-1`,
      `ROLLUP sheet=${sheet} by=uma person=Ada claimed=7.50 due-total=1.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=uma claimed-total=7.50 due-total=1.00 overdue-total=0.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=0.40 date=2026-03-10 ref=R-2`,
      `SETTING_CHANGED sheet=${sheet} by=uma key=proof-threshold value=1.00`,
      `PERIOD_CLOSED sheet=${sheet} by=uma period=P1 total=0.00`,
      `CLAIM_OPENED sheet=${sheet} by=wes person=Ada amount=0.40 date=2026-03-10 number=FY2026-2`,
      `ROLLUP sheet=${sheet} by=wes person=Ada claimed=7.90 due-total=2.00 overdue-total=0.00`,
      `TOTALS sheet=${sheet} by=wes claimed-total=7.90 due-total=2.00 overdue-total=0.00`,
      `CLAIM_SETTLED sheet=${sheet} by=wes person=Ada amount=7.50 date=2026-03-09 number=FY2026-1 due=1.00`
    ]);
  });
});
