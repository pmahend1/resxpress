import assert from "node:assert/strict";
import { test } from "node:test";
import { CellEdit } from "../cellEdit.ts";
import type { CombinedEntry } from "../combinedEntry.ts";
import type { ResxEntry } from "../resxEntry.ts";

const multiLine = "<table>\r\n  <tr>\r\n    <td>{{{Content}}}</td>\r\n  </tr>\r\n</table>";

test("editing a key leaves a multi-line value exactly as it was", () => {
    const entry: ResxEntry = { key: "Template", value: multiLine, comment: "html" };
    assert.deepEqual(CellEdit.apply(entry, CellEdit.keyField, "Renamed"),
                     { key: "Renamed", value: multiLine, comment: "html" });
});

test("editing a comment leaves a multi-line value exactly as it was", () => {
    const entry: ResxEntry = { key: "Template", value: multiLine };
    assert.deepEqual(CellEdit.apply(entry, CellEdit.commentField, "note"),
                     { key: "Template", value: multiLine, comment: "note" });
});

test("an emptied comment is dropped rather than written blank", () => {
    const edited = CellEdit.apply({ key: "A", value: "a", comment: "c" }, CellEdit.commentField, "");
    assert.deepEqual(edited, { key: "A", value: "a" });
    assert.equal(Object.hasOwn(edited!, "comment"), false);
});

test("editing a cell does not mutate the row it was given", () => {
    const entry: ResxEntry = { key: "A", value: "a", comment: "c" };
    CellEdit.apply(entry, CellEdit.commentField, "");
    assert.deepEqual(entry, { key: "A", value: "a", comment: "c" });
});

test("an unknown field is refused", () => {
    assert.equal(CellEdit.apply({ key: "A", value: "a" }, "delete", "x"), undefined);
    assert.equal(CellEdit.applyCombined({ key: "A", values: {}, comments: {} }, "delete", "", "x"), undefined);
});

function combinedEntry(): CombinedEntry {
    return {
        key: "Template",
        values: { "": multiLine, "fr": `${multiLine} fr`, "de": "" },
        comments: { "": "neutral", "fr": "traduction" }
    };
}

test("editing one culture's value leaves every other culture's multi-line value alone", () => {
    const edited = CellEdit.applyCombined(combinedEntry(), CellEdit.valueField, "de", "hallo");
    assert.deepEqual(edited, {
        key: "Template",
        values: { "": multiLine, "fr": `${multiLine} fr`, "de": "hallo" },
        comments: { "": "neutral", "fr": "traduction" }
    });
});

test("editing a combined key leaves every value and comment alone", () => {
    const edited = CellEdit.applyCombined(combinedEntry(), CellEdit.keyField, "", "Renamed");
    assert.deepEqual(edited, { ...combinedEntry(), key: "Renamed" });
});

test("clearing a translation removes it from that culture", () => {
    const edited = CellEdit.applyCombined(combinedEntry(), CellEdit.valueField, "fr", "");
    assert.equal(Object.hasOwn(edited!.values, "fr"), false);
    assert.equal(edited!.values[""], multiLine);
});

test("a deliberately blank translation stays present", () => {
    const edited = CellEdit.applyCombined(combinedEntry(), CellEdit.valueField, "de", "");
    assert.equal(edited!.values["de"], "");
});

test("an emptied cell in a culture without the key does not add it", () => {
    const edited = CellEdit.applyCombined(combinedEntry(), CellEdit.valueField, "es", "");
    assert.equal(Object.hasOwn(edited!.values, "es"), false);
});

test("clearing one culture's comment leaves the others", () => {
    const edited = CellEdit.applyCombined(combinedEntry(), CellEdit.commentField, "fr", "");
    assert.deepEqual(edited!.comments, { "": "neutral" });
});

test("editing a combined cell does not mutate the row it was given", () => {
    const entry = combinedEntry();
    CellEdit.applyCombined(entry, CellEdit.valueField, "fr", "");
    CellEdit.applyCombined(entry, CellEdit.commentField, "", "");
    assert.deepEqual(entry, combinedEntry());
});
