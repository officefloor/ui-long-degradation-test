import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.describe("signin and sheet", () => {
  test("signin and sheet", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.refresh(pg_uma);
    await expect(pg_uma.getByTestId("current-user")).toHaveText("uma");
    await expect(pg_uma.getByTestId("sheet-current-id")).toHaveText(sheet);
    const pg_vic = await ui.userPage(browser, "vic", sheet);
    await ui.refresh(pg_vic);
    await expect(pg_vic.getByTestId("current-user")).toHaveText("vic");
    await expect(pg_vic.getByTestId("sheet-current-id")).toHaveText(sheet);
  });
});
