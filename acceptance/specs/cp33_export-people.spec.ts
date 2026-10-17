import { test, expect } from '@playwright/test';
import * as ui from '../support/ui';

test.describe("export people", () => {
  test("export people", { tag: '@functionality' }, async ({ browser }) => {
    const sheet = ui.sheetId();
    const pg_uma = await ui.userPage(browser, "uma", sheet);
    await ui.setToday(pg_uma, "2026-03-10");
    expect(await ui.setRate(pg_uma, {"grade": "A", "pct": "10.00"})).toBe(true);
    expect(await ui.setRate(pg_uma, {"grade": "B", "pct": "12.50"})).toBe(true);
    const p_ada = ui.must(await ui.addPerson(pg_uma, {"name": "Ada", "grade": "A"}));
    const p_lee_jo = ui.must(await ui.addPerson(pg_uma, {"name": "Lee, Jo", "grade": "B"}));
    const p_ann_q = ui.must(await ui.addPerson(pg_uma, {"name": "Ann \"Q\"", "grade": "C"}));
    const c_ada_0 = ui.must(await ui.addClaim(pg_uma, p_ada, {"amount": "10.00"}));
    const c_lee_jo_0 = ui.must(await ui.addClaim(pg_uma, p_lee_jo, {"amount": "10.00"}));
    expect(await ui.claimAction(pg_uma, c_ada_0, "open")).toBe(true);
    expect(await ui.claimAction(pg_uma, c_lee_jo_0, "open")).toBe(true);
    expect(await ui.retire(pg_uma, p_ann_q, "2026-03-01")).toBe(true);
    expect(await ui.exportCsv(pg_uma)).toBe("name,grade,retired-from,due-total\nAda,A,,1.00\n\"Lee, Jo\",B,,1.25\n\"Ann \"\"Q\"\"\",C,2026-03-01,n/a\n");
  });
});
