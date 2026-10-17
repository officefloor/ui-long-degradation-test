import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.describe("import upserts", () => {
  test("import upserts", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "12.50"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    const imp = await ui.importPeople(pg_uma, "ada,C\nCam,A\n cam ,B");
    expect(imp).toEqual({"added": 0, "errors": [3], "updated": 0});
    const imp_2 = await ui.importPeople(pg_uma, " ada ,C\nDot,A");
    expect(imp_2).toEqual({"added": 1, "errors": [], "updated": 1});
    const p_dot = await ui.personId(pg_uma, "Dot");
    const imp_3 = await ui.importPeople(pg_uma, "Ben,A");
    expect(imp_3).toEqual({"added": 0, "errors": [], "updated": 1});
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("C");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Ben");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_uma.getByTestId("person-row-" + p_dot).getByTestId("person-name")).toHaveText("Dot");
    await expect(pg_uma.getByTestId("person-row-" + p_dot).getByTestId("person-grade")).toHaveText("A");
    ui.expectAudit(sheet, [
      `RATE_SET sheet=${sheet} by=uma grade=A rate=10.00`,
      `RATE_SET sheet=${sheet} by=uma grade=B rate=12.50`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ada grade=A`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Ben grade=B`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ada grade=C`,
      `PERSON_ADDED sheet=${sheet} by=uma name=Dot grade=A`,
      `PERSON_EDITED sheet=${sheet} by=uma name=Ben grade=A`
    ]);
  });
});
