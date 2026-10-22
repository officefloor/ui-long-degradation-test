import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("name uniqueness", () => {
  test("name uniqueness", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    expect(await ui.addPerson(pg_uma, {"name": "ADA", "grade": "B"})).toBeNull();
    expect(await ui.addPerson(pg_uma, {"name": " Ada ", "grade": "C"})).toBeNull();
    const p_ben = ui.must(await ui.addPerson(pg_uma, {"name": "Ben", "grade": "B"}));
    expect(await ui.editPerson(pg_uma, p_ben, {"name": "ada"})).toBe(false);
    expect(await ui.editPerson(pg_uma, p_ben, {"name": " Cam "})).toBe(true);
    expect(await ui.addPerson(pg_uma, {"name": "cam", "grade": "A"})).toBeNull();
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-name")).toHaveText("Ada (A)");
    await expect(pg_uma.getByTestId("person-row-" + p_ada).getByTestId("person-grade")).toHaveText("A");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-name")).toHaveText("Cam (B)");
    await expect(pg_uma.getByTestId("person-row-" + p_ben).getByTestId("person-grade")).toHaveText("B");
  });
});
