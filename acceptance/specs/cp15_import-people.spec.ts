import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.describe("import people", () => {
  test("import people", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "12.50"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    const imp = await ui.importPeople(pg_uma, "Ben,B\nCam,C");
    expect(imp).toEqual({"added": 2, "errors": []});
    const p_ben = await ui.personId(pg_uma, "Ben");
    const p_cam = await ui.personId(pg_uma, "Cam");
    const imp_2 = await ui.importPeople(pg_uma, "Dot,A\n,B");
    expect(imp_2).toEqual({"added": 0, "errors": [2]});
    const imp_3 = await ui.importPeople(pg_uma, "Eve,A\nADA,B");
    expect(imp_3).toEqual({"added": 0, "errors": [2]});
    const imp_4 = await ui.importPeople(pg_uma, "Fay,D");
    expect(imp_4).toEqual({"added": 0, "errors": [1]});
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("B");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-name")).toHaveText("Cam");
    await expect(pg_uma.getByTestId("person-row-" + p_cam).getByTestId("person-grade")).toHaveText("C");
    ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Cam grade=C`
    ]);
  });
});
