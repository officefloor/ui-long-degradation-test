import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("rates and due", () => {
  test("rates and due", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "12.50"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "C"}));
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.25", "date": "2026-03-01"}));
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.25", "date": "2026-03-02"}));
    const c_ben_0 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "4.00"}));
    const c_cam_0 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "4.00"}));
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("2.05");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.03");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.03");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.50");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("28.50");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("2.55");
    await expect(pg_uma.getByTestId("rate-current-A")).toHaveText("10.00");
    await expect(pg_uma.getByTestId("rate-current-B")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("rate-current-C")).toHaveText("n/a");
    expect(await ui.editPerson(pg_uma, p_ada, {"grade": "B"})).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("2.56");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.28");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.28");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("0.50");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("28.50");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("3.06");
    await ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-03-01`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-03-02`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=4.00 date=2026-03-10`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=4.00 date=2026-03-10`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=B`
    ]);
  });
  test("rates and due scenario 1", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-04-05");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "12.50"})).toBe(true);
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B"}));
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C"}));
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "25.00"}));
    const c_cam_0 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "99.95", "date": "2026-03-09"}));
    const c_cam_1 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "1.00"}));
    await ui.setToday(pg_uma, "2026-05-14");
    const c_cam_2 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "10.25"}));
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "7.77", "date": "2026-03-28"}));
    await ui.setToday(pg_uma, "2026-05-20");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("111.20");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("13.90");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-due")).toHaveText("1.28");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due")).toHaveText("0.13");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("12.49");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("32.77");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("n/a");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("143.97");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("13.90");
    const c_ada_2 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "3.33", "date": "2026-03-20"}));
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.setRate(pg_vic, {"grade": "C", "pct": "20.00"})).toBe(true);
    const c_ada_3 = ui.must(await ui.addClaim(pg_vic, p_ada, {"amount": "20.00"}));
    const c_cam_3 = ui.must(await ui.addClaim(pg_vic, p_cam, {"amount": "99.95"}));
    expect(await ui.editClaim(pg_vic, c_cam_3, {"amount": "4.00"})).toBe(true);
    const c_ada_4 = ui.must(await ui.addClaim(pg_vic, p_ada, {"amount": "10.35"}));
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("115.20");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("14.40");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-due")).toHaveText("0.50");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-due")).toHaveText("1.28");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due")).toHaveText("0.13");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("12.49");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("66.45");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("13.29");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-due")).toHaveText("2.07");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-due")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("0.67");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("181.65");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("27.69");
    const c_cam_4 = ui.must(await ui.addClaim(pg_vic, p_cam, {"amount": "1.00", "date": "2026-03-01"}));
    expect(await ui.editPerson(pg_vic, p_cam, {"grade": "C"})).toBe(true);
    const c_cam_5 = ui.must(await ui.addClaim(pg_vic, p_cam, {"amount": "25.00"}));
    expect(await ui.setRate(pg_vic, {"grade": "B", "pct": "12.50"})).toBe(true);
    const c_cam_6 = ui.must(await ui.addClaim(pg_vic, p_cam, {"amount": "3.33", "date": "2026-02-25"}));
    const c_ada_5 = ui.must(await ui.addClaim(pg_vic, p_ada, {"amount": "20.00"}));
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("144.53");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("28.91");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-amount")).toHaveText("3.33");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-date")).toHaveText("2026-02-25");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_6).getByTestId("claim-due")).toHaveText("0.67");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-amount")).toHaveText("25.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-date")).toHaveText("2026-05-20");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_5).getByTestId("claim-due")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-amount")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-date")).toHaveText("2026-03-01");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_4).getByTestId("claim-due")).toHaveText("0.20");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-amount")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-date")).toHaveText("2026-05-20");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-due")).toHaveText("0.80");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-amount")).toHaveText("10.25");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-date")).toHaveText("2026-05-14");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-due")).toHaveText("2.05");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-amount")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-date")).toHaveText("2026-04-05");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-due")).toHaveText("0.20");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-amount")).toHaveText("99.95");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-date")).toHaveText("2026-03-09");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("19.99");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("86.45");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("17.29");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_5).getByTestId("claim-amount")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_5).getByTestId("claim-date")).toHaveText("2026-05-20");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_5).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_5).getByTestId("claim-due")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-amount")).toHaveText("10.35");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-date")).toHaveText("2026-05-20");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-due")).toHaveText("2.07");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-amount")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-date")).toHaveText("2026-05-20");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-due")).toHaveText("4.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-amount")).toHaveText("3.33");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("0.67");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("7.77");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-03-28");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("1.55");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("25.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-04-05");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("230.98");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("46.20");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("5.00");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("12.50");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("20.00");
    await ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=5.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=25.00 date=2026-04-05`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=99.95 date=2026-03-09`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=1.00 date=2026-04-05`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=10.25 date=2026-05-14`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-03-28`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=3.33 date=2026-03-20`,
      `RATE_SET sheet=${sheet} by=vic grade=C rate=20.00`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ada amount=20.00 date=2026-05-20`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Cam amount=99.95 date=2026-05-20`,
      `CLAIM_EDITED sheet=${sheet} by=vic person=Cam amount=4.00 date=2026-05-20`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ada amount=10.35 date=2026-05-20`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Cam amount=1.00 date=2026-03-01`,
      `PERSON_EDITED sheet=${sheet} by=vic name=Cam grade=C`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Cam amount=25.00 date=2026-05-20`,
      `RATE_SET sheet=${sheet} by=vic grade=B rate=12.50`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Cam amount=3.33 date=2026-02-25`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ada amount=20.00 date=2026-05-20`
    ]);
  });
  test("rates and due scenario 2", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "20.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "20.00"})).toBe(true);
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "A"}));
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    expect(await ui.editPerson(pg_uma, p_ada, {"grade": "C"})).toBe(true);
    await ui.setToday(pg_uma, "2026-04-08");
    expect(await ui.editPerson(pg_uma, p_ben, {"grade": "C"})).toBe(true);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "1.00", "date": "2026-04-02"}));
    const c_ben_0 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "10.35", "date": "2026-03-01"}));
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "7.50"})).toBe(true);
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.25", "date": "2026-02-10"}));
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("10.35");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("2.07");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("2.07");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("11.25");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("2.25");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("2.05");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("0.20");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("21.60");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("4.32");
    const c_ben_1 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "10.35", "date": "2026-03-28"}));
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "12.50"})).toBe(true);
    const c_ada_2 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "20.00", "date": "2026-03-01"}));
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "20.00"})).toBe(true);
    const c_ben_2 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "0.04"}));
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "7.50"})).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("20.74");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("1.56");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-due")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due")).toHaveText("0.78");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("0.78");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("31.25");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("2.34");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("1.50");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("0.77");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("0.08");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("51.99");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("3.90");
    await ui.setToday(pg_uma, "2026-04-28");
    const c_ben_3 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "10.35"}));
    expect(await ui.editClaim(pg_uma, c_ben_0, {"amount": "1.00"})).toBe(true);
    const c_ada_3 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "7.77", "date": "2026-02-10"}));
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    expect(await ui.editClaim(pg_vic, c_ada_2, {"amount": "0.40"})).toBe(true);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("21.74");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("1.63");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-amount")).toHaveText("10.35");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-date")).toHaveText("2026-04-28");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-due")).toHaveText("0.78");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-amount")).toHaveText("0.04");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-date")).toHaveText("2026-04-08");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-due")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-amount")).toHaveText("10.35");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-date")).toHaveText("2026-03-28");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due")).toHaveText("0.78");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-amount")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-date")).toHaveText("2026-03-01");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("0.08");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("19.42");
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("1.46");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-amount")).toHaveText("7.77");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-date")).toHaveText("2026-02-10");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-due")).toHaveText("0.58");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-amount")).toHaveText("0.40");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-date")).toHaveText("2026-03-01");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("0.03");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("10.25");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-02-10");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("0.77");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("1.00");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-04-02");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_vic.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("0.08");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("41.16");
    await expect(pg_vic.getByTestId("rollup-due-total")).toHaveText("3.09");
    await expect(pg_vic.getByTestId("rate-current-A")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-current-B")).toHaveText("20.00");
    await expect(pg_vic.getByTestId("rate-current-C")).toHaveText("7.50");
    await ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=20.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=20.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=C`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=1.00 date=2026-04-02`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=10.35 date=2026-03-01`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=7.50`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-02-10`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=10.35 date=2026-03-28`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=12.50`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=20.00 date=2026-03-01`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=20.00`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=0.04 date=2026-04-08`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=7.50`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=10.35 date=2026-04-28`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Ben amount=1.00 date=2026-03-01`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=7.77 date=2026-02-10`,
      `CLAIM_EDITED sheet=${sheet} by=vic person=Ada amount=0.40 date=2026-03-01`
    ]);
  });
  test("rates and due scenario 3", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-04-05");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "10.00"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "C"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "A"}));
    expect(await ui.editPerson(pg_uma, p_cam, {"grade": "B"})).toBe(true);
    const c_ben_0 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "99.95", "date": "2026-03-05"}));
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "3.33", "date": "2026-02-10"}));
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "7.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "12.50"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "C", "pct": "7.50"})).toBe(true);
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.25", "date": "2026-03-05"}));
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("13.58");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("1.02");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("0.77");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("0.25");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("99.95");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("12.49");
    await expect(pg_uma.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("12.49");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("113.53");
    await expect(pg_uma.getByTestId("rollup-due-total")).toHaveText("13.51");
    const c_ben_1 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "10.25"}));
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    const c_ben_2 = ui.must(await ui.addClaim(pg_vic, p_ben, {"amount": "7.77", "date": "2026-03-05"}));
    expect(await ui.setRate(pg_vic, {"grade": "B", "pct": "5.00"})).toBe(true);
    expect(await ui.setRate(pg_vic, {"grade": "C", "pct": "33.33"})).toBe(true);
    expect(await ui.setRate(pg_vic, {"grade": "A", "pct": "12.50"})).toBe(true);
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("13.58");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("4.53");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("3.42");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.11");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("117.97");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("14.75");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-due")).toHaveText("0.97");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due")).toHaveText("1.28");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("12.49");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("131.55");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("19.28");
    await ui.setToday(pg_wes, "2026-05-05");
    expect(await ui.editClaim(pg_wes, c_ada_1, {"amount": "10.35"})).toBe(true);
    const c_ada_2 = ui.must(await ui.addClaim(pg_wes, p_ada, {"amount": "20.00"}));
    expect(await ui.setRate(pg_wes, {"grade": "A", "pct": "20.00"})).toBe(true);
    const c_ben_3 = ui.must(await ui.addClaim(pg_wes, p_ben, {"amount": "4.00", "date": "2026-03-20"}));
    const c_ada_3 = ui.must(await ui.addClaim(pg_wes, p_ada, {"amount": "4.00", "date": "2026-03-20"}));
    const c_cam_0 = ui.must(await ui.addClaim(pg_wes, p_cam, {"amount": "0.40", "date": "2026-03-05"}));
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("37.68");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("12.56");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-due")).toHaveText("1.33");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("6.67");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("3.45");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.11");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.40");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.02");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("0.02");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("121.97");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("24.39");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-due")).toHaveText("0.80");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-due")).toHaveText("1.55");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due")).toHaveText("2.05");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("19.99");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("160.05");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("36.97");
    await ui.setToday(pg_wes, "2026-05-23");
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("37.68");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-due-total")).toHaveText("12.56");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-amount")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-due")).toHaveText("1.33");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-amount")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-date")).toHaveText("2026-05-05");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-due")).toHaveText("6.67");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("10.35");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-due")).toHaveText("3.45");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("3.33");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-02-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-due")).toHaveText("1.11");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.40");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-due-total")).toHaveText("0.02");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-amount")).toHaveText("0.40");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-due")).toHaveText("0.02");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("121.97");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-due-total")).toHaveText("24.39");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-amount")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_3).getByTestId("claim-due")).toHaveText("0.80");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-amount")).toHaveText("7.77");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_2).getByTestId("claim-due")).toHaveText("1.55");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-amount")).toHaveText("10.25");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-date")).toHaveText("2026-04-05");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-due")).toHaveText("2.05");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-amount")).toHaveText("99.95");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-due")).toHaveText("19.99");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("160.05");
    await expect(pg_wes.getByTestId("rollup-due-total")).toHaveText("36.97");
    await expect(pg_wes.getByTestId("rate-current-A")).toHaveText("20.00");
    await expect(pg_wes.getByTestId("rate-current-B")).toHaveText("5.00");
    await expect(pg_wes.getByTestId("rate-current-C")).toHaveText("33.33");
    await ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=33.33`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=10.00`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=C`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=A`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=B`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=99.95 date=2026-03-05`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=3.33 date=2026-02-10`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=7.50`,
      `RATE_SET sheet=${sheet} by=uma grade=A rate=12.50`,
      `RATE_SET sheet=${sheet} by=uma grade=C rate=7.50`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-03-05`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=10.25 date=2026-04-05`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ben amount=7.77 date=2026-03-05`,
      `RATE_SET sheet=${sheet} by=vic grade=B rate=5.00`,
      `RATE_SET sheet=${sheet} by=vic grade=C rate=33.33`,
      `RATE_SET sheet=${sheet} by=vic grade=A rate=12.50`,
      `CLAIM_EDITED sheet=${sheet} by=wes person=Ada amount=10.35 date=2026-03-05`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ada amount=20.00 date=2026-05-05`,
      `RATE_SET sheet=${sheet} by=wes grade=A rate=20.00`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=4.00 date=2026-03-20`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ada amount=4.00 date=2026-03-20`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Cam amount=0.40 date=2026-03-05`
    ]);
  });
});
