import assert from "node:assert/strict";
import test from "node:test";
import { resolveAllowedLoginUsername } from "./login-users";
import { usernameToEmail } from "./auth-helpers";

test("the two Turkish usernames resolve to distinct accounts", () => {
  assert.equal(resolveAllowedLoginUsername("bakalım"), "bakalım");
  assert.equal(resolveAllowedLoginUsername(" BAKALIM2 "), "bakalım2");
  assert.equal(resolveAllowedLoginUsername("bakalim2"), "bakalım2");
  assert.equal(resolveAllowedLoginUsername("bakalım3"), null);
  assert.notEqual(usernameToEmail("bakalım"), usernameToEmail("bakalım2"));
});
