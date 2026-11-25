import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const catalog = lang => JSON.parse(readFileSync(new URL(`../_locales/${lang}/messages.json`, import.meta.url), "utf8"));
test("Complete German and English catalogs with matching substitutions", () => {
  const de = catalog("de"), en = catalog("en");
  assert.deepEqual(Object.keys(de).sort(), Object.keys(en).sort());
  for (const key of Object.keys(de)) {
    assert.ok(en[key].message.length > 0, key);
    assert.deepEqual(de[key].message.match(/\$[1-9]/g), en[key].message.match(/\$[1-9]/g), key);
    assert.doesNotMatch(de[key].message + en[key].message, /Ã|Â|�/);
  }
});
test("Umlauts and English labels have correct Unicode code points", () => {
  assert.equal(catalog("de").apply.message, "Übernehmen");
  assert.match(catalog("de").readonly.message, /schreibgeschützt/);
  assert.equal(catalog("en").lookup.message, "Find address");
  assert.equal(catalog("en").apply.message, "Use address");
});
