const test = require("node:test");
const assert = require("node:assert/strict");
const { enforceMaxLen } = require("../src/utils/maxlen");

test("enforceMaxLen truncates over limit", () => {
  const result = enforceMaxLen("abcd", 3);
  assert.equal(result.value, "abc");
  assert.equal(result.truncated, true);
});
