import assert from "node:assert/strict";
import { test } from "node:test";
import { CombinedResx } from "../combinedResx.ts";
import type { CombinedEntry } from "../combinedEntry.ts";
import { computeMinimalTextEdit } from "../minimalTextEdit.ts";
import type { ResxEntry } from "../resxEntry.ts";
import { ResxFile } from "../resxFile.ts";
import { ResxFileName } from "../resxFileName.ts";

const neutral = "";

function resx(...entries: string[]): string {
    return `<?xml version="1.0" encoding="utf-8"?>\n<root>\n${entries.join("\n")}\n</root>\n`;
}

function data(key: string, value: string, comment?: string): string {
    const commentElement = comment === undefined ? "" : `\n    <comment>${comment}</comment>`;
    // <value /> is how the .NET writer spells an empty element, and what ResxFile emits.
    const valueElement = value.length === 0 ? "<value />" : `<value>${value}</value>`;
    return `  <data name="${key}" xml:space="preserve">\n    ${valueElement}${commentElement}\n  </data>`;
}

test("a file name splits into its base name and culture", () => {
    assert.deepEqual({ ...ResxFileName.parse("Resource1.resx") }, { baseName: "Resource1", culture: neutral });
    assert.deepEqual({ ...ResxFileName.parse("Resource1.de.resx") }, { baseName: "Resource1", culture: "de" });
    assert.deepEqual({ ...ResxFileName.parse("Resource1.fr-CA.resx") }, { baseName: "Resource1", culture: "fr-CA" });
    assert.deepEqual({ ...ResxFileName.parse("Resource1.zh-Hans-CN.resx") }, { baseName: "Resource1", culture: "zh-Hans-CN" });
    assert.deepEqual({ ...ResxFileName.parse("Resource1.es-419.resx") }, { baseName: "Resource1", culture: "es-419" });
});

test("a dotted segment that is not a culture stays part of the base name", () => {
    // An uppercase first segment is the tell: culture tags spell the language lowercase.
    assert.equal(ResxFileName.parse("My.App.resx")?.culture, neutral);
    assert.equal(ResxFileName.parse("My.App.resx")?.baseName, "My.App");

    assert.equal(ResxFileName.parse("Resource1.Designer.resx")?.culture, neutral);
    assert.equal(ResxFileName.parse("Resource1.tests.resx")?.culture, neutral);
    assert.equal(ResxFileName.parse(".hidden.resx")?.baseName, ".hidden");
    assert.equal(ResxFileName.parse("notes.txt"), undefined);
});

test("the neutral file sorts ahead of every culture", () => {
    const cultures = ["fr", "de", neutral, "pt-BR", "de-AT"];
    assert.deepEqual(cultures.sort(ResxFileName.compareCultures), [neutral, "de", "de-AT", "fr", "pt-BR"]);
});

test("combining keeps the neutral key order and appends keys only a translation has", () => {
    const combined = CombinedResx.combine([neutral, "de"], {
        "": [{ key: "Hello", value: "Hello" }, { key: "Bye", value: "Bye" }],
        "de": [{ key: "Bye", value: "Tschüss" }, { key: "OnlyGerman", value: "Nur Deutsch" }]
    });

    assert.deepEqual(combined.map(entry => entry.key), ["Hello", "Bye", "OnlyGerman"]);
    assert.deepEqual(combined[1].values, { "": "Bye", "de": "Tschüss" });

    // Hello has no German entry at all, which is a missing property rather than a blank one.
    assert.equal("de" in combined[0].values, false);
    assert.equal("" in combined[2].values, false);
});

test("a blank translation is combined as present and blank, not as absent", () => {
    const combined = CombinedResx.combine([neutral, "de"], {
        "": [{ key: "Hello", value: "Hello" }],
        "de": [{ key: "Hello", value: "" }]
    });

    assert.equal("de" in combined[0].values, true);
    assert.equal(combined[0].values["de"], "");
});

test("comments are kept per culture even though the panel can collapse them", () => {
    const combined = CombinedResx.combine([neutral, "de"], {
        "": [{ key: "Hello", value: "Hello", comment: "greeting" }],
        "de": [{ key: "Hello", value: "Hallo", comment: "Begrüßung" }]
    });

    assert.deepEqual(combined[0].comments, { "": "greeting", "de": "Begrüßung" });
});

test("splitting writes a culture only the keys that culture actually has", () => {
    const entries: CombinedEntry[] = [
        { key: "Hello", values: { "": "Hello" }, comments: {} },
        { key: "Bye", values: { "": "Bye", "de": "Tschüss" }, comments: {} }
    ];

    assert.deepEqual(CombinedResx.split(entries, "de"), [{ key: "Bye", value: "Tschüss" }]);
    assert.deepEqual(CombinedResx.split(entries, neutral),
                     [{ key: "Hello", value: "Hello" }, { key: "Bye", value: "Bye" }]);
});

test("a comment with no value still creates the entry, and an empty row creates nothing", () => {
    const entries: CombinedEntry[] = [
        { key: "Documented", values: {}, comments: { "de": "needs translating" } },
        { key: "", values: { "": "orphan value" }, comments: {} }
    ];

    assert.deepEqual(CombinedResx.split(entries, "de"), [{ key: "Documented", value: "", comment: "needs translating" }]);
    assert.deepEqual(CombinedResx.split(entries, neutral), []);
});

test("a split entry is shaped exactly like one ResxFile hands out", () => {
    const source = resx(data("Hello", "Hello", "greeting"), data("Bye", "Bye"));
    const fileEntries = ResxFile.parse(source).entries;
    const combined = CombinedResx.combine([neutral], { "": fileEntries });

    // Same properties in the same order, so the panel can compare the two as JSON.
    const existingKeys = fileEntries.map((entry: ResxEntry) => entry.key);
    assert.equal(JSON.stringify(CombinedResx.split(combined, neutral, existingKeys)), JSON.stringify(fileEntries));
});

test("round tripping a culture through the table leaves its file untouched", () => {
    const german = resx(data("Bye", "Tschüss"), data("Blank", ""), data("Documented", "Wert", "Hinweis"));
    const neutralFile = resx(data("Hello", "Hello"), data("Bye", "Bye"), data("Blank", "blank"), data("Documented", "value"));

    const combined = CombinedResx.combine([neutral, "de"], {
        "": ResxFile.parse(neutralFile).entries,
        "de": ResxFile.parse(german).entries
    });

    /*
     * The whole point of the presence rules: editing anything must not seed the
     * German file with the neutral file's keys, and must not drop the entry that
     * is deliberately blank.
     */
    const germanEntries = ResxFile.parse(german).entries;
    const germanFile = ResxFile.parse(german);
    germanFile.applyEntries(CombinedResx.split(combined, "de", germanEntries.map((entry: ResxEntry) => entry.key)));
    assert.equal(computeMinimalTextEdit(german, germanFile.toXml()), undefined);
});

test("typing a translation adds it to that file alone", () => {
    const german = resx(data("Bye", "Tschüss"));
    const combined: CombinedEntry[] = [
        { key: "Hello", values: { "": "Hello", "de": "Hallo" }, comments: {} },
        { key: "Bye", values: { "": "Bye", "de": "Tschüss" }, comments: {} }
    ];

    const germanFile = ResxFile.parse(german);
    germanFile.applyEntries(CombinedResx.split(combined, "de", ["Bye"]));

    const written = germanFile.toXml();
    // Hello is new to this file, so it lands after the entry the file already had.
    assert.deepEqual(ResxFile.parse(written).entries.map((entry: ResxEntry) => entry.key), ["Bye", "Hello"]);
    assert.ok(written.includes("<value>Hallo</value>"));
});

test("renaming a key rewrites that entry in place in every language", () => {
    const german = resx(data("Alpha", "Alpha"), data("Beta", "Beta"), data("Gamma", "Gamma"));

    // The table renames Beta; the row stays where it was, and so must the element.
    const combined: CombinedEntry[] = [
        { key: "Alpha", values: { "de": "Alpha" }, comments: {} },
        { key: "Renamed", values: { "de": "Beta" }, comments: {} },
        { key: "Gamma", values: { "de": "Gamma" }, comments: {} }
    ];

    const germanFile = ResxFile.parse(german);
    germanFile.applyEntries(CombinedResx.split(combined, "de", ["Alpha", "Beta", "Gamma"]));

    const written = germanFile.toXml();
    assert.deepEqual(ResxFile.parse(written).entries.map((entry: ResxEntry) => entry.key),
                     ["Alpha", "Renamed", "Gamma"]);

    // One attribute on one line, not a reshuffle of everything after it.
    assert.equal(written, german.replace(`name="Beta"`, `name="Renamed"`));
});

test("a translation keeps its own key order when the table is laid out in another", () => {
    // The table is ordered by the neutral file; this file disagrees, and gets to.
    const german = resx(data("Zebra", "Zebra"), data("Apple", "Apfel"));
    const combined: CombinedEntry[] = [
        { key: "Apple", values: { "": "Apple", "de": "Apfel" }, comments: {} },
        { key: "Zebra", values: { "": "Zebra", "de": "Zebra" }, comments: {} }
    ];

    const germanFile = ResxFile.parse(german);
    germanFile.applyEntries(CombinedResx.split(combined, "de", ["Zebra", "Apple"]));
    assert.equal(computeMinimalTextEdit(german, germanFile.toXml()), undefined);
});

test("clearing a translation removes just that entry from just that file", () => {
    const german = resx(data("Hello", "Hallo"), data("Bye", "Tschüss"));

    // The webview drops the property when a cell that had text is cleared.
    const combined: CombinedEntry[] = [
        { key: "Hello", values: { "": "Hello" }, comments: {} },
        { key: "Bye", values: { "": "Bye", "de": "Tschüss" }, comments: {} }
    ];

    const germanFile = ResxFile.parse(german);
    germanFile.applyEntries(CombinedResx.split(combined, "de", ["Hello", "Bye"]));

    assert.deepEqual(ResxFile.parse(germanFile.toXml()).entries, [{ key: "Bye", value: "Tschüss" }]);
});
