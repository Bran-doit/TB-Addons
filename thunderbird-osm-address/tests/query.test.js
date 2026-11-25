import test from "node:test";
import assert from "node:assert/strict";
import { titleSuggestion, searchQueries } from "../services/query.js";

test("Schulname aus Termintitel vorbereiten, Uhrzeit und TdA entfernen", () => {
  const suggestion = titleSuggestion("10-13 Uhr TdA ev. GS Potsdam Babelsberg Kopf, Herz & Hand");
  assert.equal(suggestion, "Evangelische Grundschule Potsdam Babelsberg Kopf Herz Hand");
  assert.deepEqual(searchQueries(suggestion), [suggestion,
    "Evangelische Grundschule Potsdam Babelsberg Kopf",
    "Evangelische Grundschule Potsdam Babelsberg"]);
});
test("Abgekürzte manuelle Namenssuche und begrenzte Varianten", () => {
  assert.ok(searchQueries("GS Potsdam Babelsberg Kopf Herz Hand").includes("Grundschule Potsdam Babelsberg"));
  assert.ok(searchQueries("Museum mit einem sehr langen Namen in einem Ort").length <= 3);
});
test("Straßenadressen und kurze Namen nicht verkürzen", () => {
  for (const text of ["Unter den Linden 6 Berlin", "Schule Straße 12 Berlin", "Hotel Berlin", "Berlin"]) {
    assert.deepEqual(searchQueries(text), [text]);
  }
});
