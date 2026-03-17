const test = require("node:test");
const assert = require("node:assert/strict");
const { enforceMaxLen } = require("../src/utils/maxlen");

test("enforceMaxLen truncates over limit", () => {
  const result = enforceMaxLen("abcd", 3);
  assert.equal(result.value, "abc");
  assert.equal(result.truncated, true);
});

test("normalizeValue handles null and numbers", () => {
  assert.equal(enforceMaxLen(null, 3).value, "");
  assert.equal(enforceMaxLen(12345, 3).value, "123");
  assert.equal(enforceMaxLen("abc", 0).value, "");
});
