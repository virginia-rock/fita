import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

for (const name of ["get-admin-dashboard", "get-admin-users"]) {
  test(`${name} authorizes before listing users`, async () => {
    const source = await readFile(new URL(`../supabase/functions/${name}/index.ts`, import.meta.url), "utf8");
    assert.match(source, /Authorization/);
    assert.match(source, /auth\.getUser\(\)/);
    assert.match(source, /from\("fita_admin_access"\)/);
    assert.match(source, /eq\("role", "admin"\)/);
    assert.match(source, /403/);
    assert.ok(source.indexOf('from("fita_admin_access")') < source.indexOf("admin.auth.admin.listUsers"));
  });
}
