import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.setTimeout(240_000);
test.describe("sheet today", () => {
  test("sheet today", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("current-user")).toHaveText("uma");
    await expect(pg_uma.getByTestId("sheet-current-id")).toHaveText(sheet);
    await expect(pg_uma.getByTestId("sheet-today")).toHaveText("2026-03-10");
    await ui.setToday(pg_uma, "2024-02-29");
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("current-user")).toHaveText("uma");
    await expect(pg_uma.getByTestId("sheet-current-id")).toHaveText(sheet);
    await expect(pg_uma.getByTestId("sheet-today")).toHaveText("2024-02-29");
  });
});
