import assert from "node:assert/strict";
import test from "node:test";
import { can, rolePermissions } from "../src/lib/permissions.ts";

test("receptionists can run front desk tasks but cannot manage staff", () => {
  assert.equal(can("RECEPTIONIST", "reservations:create"), true);
  assert.equal(can("RECEPTIONIST", "guests:update"), true);
  assert.equal(can("RECEPTIONIST", "payments:create"), true);
  assert.equal(can("RECEPTIONIST", "users:view"), false);
  assert.equal(can("RECEPTIONIST", "rooms:delete"), false);
  assert.equal(can("RECEPTIONIST", "settings:update"), false);
});

test("managers get reports and settings but no deletions or staff management", () => {
  assert.equal(can("MANAGER", "reports:view"), true);
  assert.equal(can("MANAGER", "settings:update"), true);
  assert.equal(can("MANAGER", "payments:update"), true);
  assert.equal(can("MANAGER", "users:view"), false);
  assert.equal(can("MANAGER", "guests:delete"), false);
});

test("admins have every permission", () => {
  for (const permission of rolePermissions.ADMIN) {
    assert.equal(can("ADMIN", permission), true);
  }
  assert.equal(can("ADMIN", "users:delete"), true);
});
