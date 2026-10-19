import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("audit", () => {
  test("audit", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    expect(await ui.editPerson(pg_uma, p_ada, {"grade": "B"})).toBe(true);
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "5.00", "date": "2026-03-02", "note": "n"}));
    expect(await ui.addClaim(pg_uma, p_ada, {"amount": "1.005"})).toBeNull();
    expect(await ui.editClaim(pg_uma, c_ada_0, {"amount": "6.00", "note": "m"})).toBe(true);
    expect(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "C"})).toBeNull();
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("6.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("m");
    await ui.expectAudit(sheet, [
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=B`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=5.00 date=2026-03-02`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Ada amount=6.00 date=2026-03-02`
    ]);
  });
  test("audit scenario 1", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-04-05");
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "B"}));
    await ui.setToday(pg_uma, "2026-05-04");
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "25.00"}));
    const c_ada_1 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "0.40", "date": "2026-03-05"}));
    expect(await ui.editPerson(pg_uma, p_cam, {"grade": "A"})).toBe(true);
    const c_ada_2 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "12.50"}));
    expect(await ui.editPerson(pg_uma, p_ada, {"grade": "B"})).toBe(true);
    expect(await ui.editPerson(pg_uma, p_ada, {"grade": "C"})).toBe(true);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    const c_cam_0 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "0.40", "date": "2026-03-28"}));
    const c_ada_3 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.25"}));
    const c_cam_1 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "1.00"}));
    await ui.setToday(pg_uma, "2026-06-13");
    const c_cam_2 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "1.00"}));
    const c_ada_4 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "1.00"}));
    const c_ada_5 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "99.95", "date": "2026-02-25"}));
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    const c_ada_6 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "1.00"}));
    expect(await ui.editClaim(pg_uma, c_ada_6, {"amount": "10.25"})).toBe(true);
    const c_ada_7 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.25"}));
    const c_cam_3 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "0.40"}));
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_7).getByTestId("claim-amount")).toHaveText("10.25");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_7).getByTestId("claim-date")).toHaveText("2026-06-13");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_7).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_6).getByTestId("claim-amount")).toHaveText("10.25");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_6).getByTestId("claim-date")).toHaveText("2026-06-13");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_6).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_5).getByTestId("claim-amount")).toHaveText("99.95");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_5).getByTestId("claim-date")).toHaveText("2026-02-25");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_5).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-amount")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-date")).toHaveText("2026-06-13");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_4).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-amount")).toHaveText("10.25");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-date")).toHaveText("2026-05-04");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_3).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-amount")).toHaveText("12.50");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-date")).toHaveText("2026-05-04");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("0.40");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-03-05");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("25.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-05-04");
    await expect(pg_uma.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-amount")).toHaveText("0.40");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-date")).toHaveText("2026-06-13");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-amount")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-date")).toHaveText("2026-06-13");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-amount")).toHaveText("1.00");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-date")).toHaveText("2026-05-04");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-amount")).toHaveText("0.40");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-date")).toHaveText("2026-03-28");
    await expect(pg_uma.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_uma.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await ui.expectAudit(sheet, [
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`,
      `ROLLUP sheet=${sheet} by=uma`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=B`,
      `ROLLUP sheet=${sheet} by=uma`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=25.00 date=2026-05-04`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=0.40 date=2026-03-05`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Cam grade=A`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=12.50 date=2026-05-04`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=B`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=0.40 date=2026-03-28`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-05-04`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=1.00 date=2026-05-04`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=1.00 date=2026-06-13`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=1.00 date=2026-06-13`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=99.95 date=2026-02-25`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=1.00 date=2026-06-13`,
      `CLAIM_EDITED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-06-13`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ada amount=10.25 date=2026-06-13`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=0.40 date=2026-06-13`
    ]);
  });
  test("audit scenario 2", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "C"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "C"}));
    const c_cam_0 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "99.95"}));
    const c_cam_1 = ui.must(await ui.addClaim(pg_uma, p_cam, {"amount": "25.00", "date": "2026-02-25"}));
    await ui.setToday(pg_uma, "2026-03-26");
    expect(await ui.editPerson(pg_uma, p_ben, {"grade": "B"})).toBe(true);
    await ui.setToday(pg_uma, "2026-05-05");
    const c_ben_0 = ui.must(await ui.addClaim(pg_uma, p_ben, {"amount": "4.00", "date": "2026-02-10"}));
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    expect(await ui.editClaim(pg_wes, c_ben_0, {"amount": "3.33"})).toBe(true);
    const c_ben_1 = ui.must(await ui.addClaim(pg_wes, p_ben, {"amount": "12.50", "date": "2026-02-10"}));
    await ui.setToday(pg_wes, "2026-06-02");
    expect(await ui.editPerson(pg_wes, p_ada, {"grade": "C"})).toBe(true);
    const c_ada_0 = ui.must(await ui.addClaim(pg_wes, p_ada, {"amount": "0.40"}));
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    const c_cam_2 = ui.must(await ui.addClaim(pg_vic, p_cam, {"amount": "0.40"}));
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    expect(await ui.editClaim(pg_vic, c_cam_0, {"amount": "12.50"})).toBe(true);
    await ui.refresh(pg_wes);
    const c_ada_1 = ui.must(await ui.addClaim(pg_wes, p_ada, {"amount": "10.25", "date": "2026-02-25"}));
    const c_cam_3 = ui.must(await ui.addClaim(pg_wes, p_cam, {"amount": "25.00", "date": "2026-04-02"}));
    expect(await ui.editClaim(pg_wes, c_cam_3, {"amount": "4.00"})).toBe(true);
    await ui.setToday(pg_wes, "2026-06-14");
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("10.25");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-02-25");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("0.40");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-06-02");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-amount")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-date")).toHaveText("2026-02-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-amount")).toHaveText("3.33");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-date")).toHaveText("2026-02-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-amount")).toHaveText("4.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-date")).toHaveText("2026-04-02");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_3).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-amount")).toHaveText("0.40");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-date")).toHaveText("2026-06-02");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-amount")).toHaveText("25.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-date")).toHaveText("2026-02-25");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-amount")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-date")).toHaveText("2026-03-20");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await ui.expectAudit(sheet, [
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `ROLLUP sheet=${sheet} by=uma`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=C`,
      `ROLLUP sheet=${sheet} by=uma`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C`,
      `ROLLUP sheet=${sheet} by=uma`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=99.95 date=2026-03-20`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Cam amount=25.00 date=2026-02-25`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=B`,
      `CLAIM_ADDED sheet=${sheet} by=uma person=Ben amount=4.00 date=2026-02-10`,
      `CLAIM_EDITED sheet=${sheet} by=wes person=Ben amount=3.33 date=2026-02-10`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=12.50 date=2026-02-10`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Ada grade=C`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ada amount=0.40 date=2026-06-02`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Cam amount=0.40 date=2026-06-02`,
      `CLAIM_EDITED sheet=${sheet} by=vic person=Cam amount=12.50 date=2026-03-20`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ada amount=10.25 date=2026-02-25`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Cam amount=25.00 date=2026-04-02`,
      `CLAIM_EDITED sheet=${sheet} by=wes person=Cam amount=4.00 date=2026-04-02`
    ]);
  });
  test("audit scenario 3", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-20");
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "B"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    const p_cam = ui.must(await ui.addPerson(pg_uma, {"name": "Cam", "grade": "A"}));
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    await ui.setToday(pg_vic, "2026-04-19");
    const c_ben_0 = ui.must(await ui.addClaim(pg_vic, p_ben, {"amount": "7.77", "date": "2026-03-28"}));
    await ui.setToday(pg_vic, "2026-04-25");
    const c_cam_0 = ui.must(await ui.addClaim(pg_vic, p_cam, {"amount": "1.00"}));
    await ui.setToday(pg_vic, "2026-05-13");
    expect(await ui.editClaim(pg_vic, c_ben_0, {"amount": "4.00"})).toBe(true);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_vic.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    expect(await ui.editClaim(pg_vic, c_ben_0, {"amount": "0.40"})).toBe(true);
    expect(await ui.editPerson(pg_vic, p_ada, {"grade": "B"})).toBe(true);
    const c_ada_0 = ui.must(await ui.addClaim(pg_vic, p_ada, {"amount": "12.50", "date": "2026-02-10"}));
    const c_ada_1 = ui.must(await ui.addClaim(pg_vic, p_ada, {"amount": "12.50", "date": "2026-04-02"}));
    const pg_wes = await ui.userPage(browser, "wes", sheet);
    const c_cam_1 = ui.must(await ui.addClaim(pg_wes, p_cam, {"amount": "10.35", "date": "2026-03-15"}));
    expect(await ui.editClaim(pg_wes, c_ada_0, {"amount": "12.50"})).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    expect(await ui.editClaim(pg_wes, c_ada_0, {"amount": "3.33"})).toBe(true);
    const c_ada_2 = ui.must(await ui.addClaim(pg_wes, p_ada, {"amount": "10.35", "date": "2026-03-28"}));
    const c_ben_1 = ui.must(await ui.addClaim(pg_wes, p_ben, {"amount": "10.35"}));
    const c_cam_2 = ui.must(await ui.addClaim(pg_wes, p_cam, {"amount": "99.95"}));
    expect(await ui.editPerson(pg_wes, p_cam, {"grade": "B"})).toBe(true);
    await ui.refresh(pg_wes);
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_wes.getByTestId("person-row-" + p_ada).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-amount")).toHaveText("10.35");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-date")).toHaveText("2026-03-28");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-amount")).toHaveText("12.50");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-date")).toHaveText("2026-04-02");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-amount")).toHaveText("3.33");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-date")).toHaveText("2026-02-10");
    await expect(pg_wes.getByTestId("claim-row-" + c_ada_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_wes.getByTestId("person-row-" + p_ben).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-amount")).toHaveText("10.35");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-date")).toHaveText("2026-05-13");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-amount")).toHaveText("0.40");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-date")).toHaveText("2026-03-28");
    await expect(pg_wes.getByTestId("claim-row-" + c_ben_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_wes.getByTestId("person-row-" + p_cam).getByTestId("person-claimed")).toHaveText("0.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-amount")).toHaveText("99.95");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-date")).toHaveText("2026-05-13");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_2).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-amount")).toHaveText("10.35");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-date")).toHaveText("2026-03-15");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_1).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-amount")).toHaveText("1.00");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-date")).toHaveText("2026-04-25");
    await expect(pg_wes.getByTestId("claim-row-" + c_cam_0).getByTestId("claim-note")).toHaveText("");
    await expect(pg_wes.getByTestId("rollup-claimed-total")).toHaveText("0.00");
    await ui.expectAudit(sheet, [
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=B`,
      `ROLLUP sheet=${sheet} by=uma`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B`,
      `ROLLUP sheet=${sheet} by=uma`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=A`,
      `ROLLUP sheet=${sheet} by=uma`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ben amount=7.77 date=2026-03-28`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Cam amount=1.00 date=2026-04-25`,
      `CLAIM_EDITED sheet=${sheet} by=vic person=Ben amount=4.00 date=2026-03-28`,
      `CLAIM_EDITED sheet=${sheet} by=vic person=Ben amount=0.40 date=2026-03-28`,
      `PERSON_EDITED sheet=${sheet} by=vic name=Ada grade=B`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ada amount=12.50 date=2026-02-10`,
      `CLAIM_ADDED sheet=${sheet} by=vic person=Ada amount=12.50 date=2026-04-02`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Cam amount=10.35 date=2026-03-15`,
      `CLAIM_EDITED sheet=${sheet} by=wes person=Ada amount=12.50 date=2026-02-10`,
      `CLAIM_EDITED sheet=${sheet} by=wes person=Ada amount=3.33 date=2026-02-10`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ada amount=10.35 date=2026-03-28`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Ben amount=10.35 date=2026-05-13`,
      `CLAIM_ADDED sheet=${sheet} by=wes person=Cam amount=99.95 date=2026-05-13`,
      `PERSON_EDITED sheet=${sheet} by=wes name=Cam grade=B`
    ]);
  });
});
