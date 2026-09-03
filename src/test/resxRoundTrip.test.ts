import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { computeMinimalTextEdit } from "../minimalTextEdit.ts";
import { ResxFile } from "../resxFile.ts";

const fixture = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "roundTripFixture.resx"), "utf8");

function changedLines(before: string, after: string): string[] {
    const beforeLines = before.split(/\r?\n/);
    const afterLines = after.split(/\r?\n/);
    const changed: string[] = [];

    for (let index = 0; index < Math.max(beforeLines.length, afterLines.length); index++) {
        if (beforeLines[index] !== afterLines[index]) {
            changed.push(`${index + 1}: ${beforeLines[index] ?? "<absent>"} => ${afterLines[index] ?? "<absent>"}`);
        }
    }

    return changed;
}

test("a round trip with no edits is byte identical", () => {
    assert.equal(ResxFile.parse(fixture).toXml(), fixture);
});

test("re-applying the entries a file already has produces no edit at all", () => {
    const resxFile = ResxFile.parse(fixture);
    resxFile.applyEntries(resxFile.entries);
    assert.equal(computeMinimalTextEdit(fixture, resxFile.toXml()), undefined);
});

test("entries carry key, value and comment with no xml-js shapes attached", () => {
    const entries = ResxFile.parse(fixture).entries;

    assert.deepEqual(entries[0], {
        key: "Padded",
        value: "   leading and trailing   ",
        comment: "padding has to survive"
    });
    assert.equal(entries.find(entry => entry.key === "MultiLine")?.value, "line one\nline two\nline three");
    assert.equal(entries.find(entry => entry.key === "MultiLine")?.comment, undefined);
    assert.equal(entries.find(entry => entry.key === "Empty")?.value, "");
    assert.equal(entries.find(entry => entry.key === "Escaped")?.value, `<b>bold</b> & "quoted" 'single'`);
    assert.equal(entries.find(entry => entry.key === "Unicode")?.value, "café — 日本語 🎉");
    assert.ok(entries.some(entry => entry.key === "Save & Exit"));
});

test("editing one value rewrites one line and leaves every comment in place", () => {
    const resxFile = ResxFile.parse(fixture);
    const entries = resxFile.entries;
    entries[0].value = "edited";
    resxFile.applyEntries(entries);

    const xml = resxFile.toXml();
    assert.deepEqual(changedLines(fixture, xml),
                     ["43:     <value>   leading and trailing   </value> =>     <value>edited</value>"]);

    // The compact-mode bug this replaces hoisted every comment above the schema block.
    assert.ok(xml.indexOf("Microsoft ResX Schema") < xml.indexOf("<!--Data-->"));
    assert.ok(xml.indexOf(`<resheader name="writer">`) < xml.indexOf("<!--Data-->"));
    assert.ok(xml.indexOf("<!--Data-->") < xml.indexOf(`<data name="Padded"`));
});

test("renaming a key rewrites only the data element's own line", () => {
    const resxFile = ResxFile.parse(fixture);
    const entries = resxFile.entries;
    entries[0].key = "Renamed";
    resxFile.applyEntries(entries);

    assert.deepEqual(changedLines(fixture, resxFile.toXml()),
                     [`42:   <data name="Padded" xml:space="preserve"> =>   <data name="Renamed" xml:space="preserve">`]);
});

test("deleting an entry removes that entry's lines and nothing else", () => {
    const resxFile = ResxFile.parse(fixture);
    resxFile.applyEntries(resxFile.entries.filter(entry => entry.key !== "Empty"));

    const emptyEntryBlock = `  <data name="Empty" xml:space="preserve">\n    <value />\n  </data>\n`;
    assert.ok(fixture.includes(emptyEntryBlock));

    const xml = resxFile.toXml();
    assert.equal(xml, fixture.replace(emptyEntryBlock, ""));

    const minimalEdit = computeMinimalTextEdit(fixture, xml);
    assert.equal(minimalEdit?.newText, "");
    assert.equal(minimalEdit!.end - minimalEdit!.start, emptyEntryBlock.length);
});

test("a new entry is appended after the last data element, not at the end of the file", () => {
    const resxFile = ResxFile.parse(fixture);
    resxFile.applyEntries(resxFile.entries.concat({ key: "Added", value: "new value", comment: "added" }));

    const xml = resxFile.toXml();
    const lastDataEnd = fixture.lastIndexOf("</data>") + "</data>".length;
    assert.equal(xml.slice(0, lastDataEnd), fixture.slice(0, lastDataEnd));
    assert.ok(xml.includes(`<data name="Added" xml:space="preserve">\n    <value>new value</value>\n    <comment>added</comment>\n  </data>`));
    assert.ok(xml.indexOf(`name="Added"`) < xml.indexOf("<!--Trailing comment before the close tag-->"));
});

test("the first entry added to a brand new file lands below the Data marker", () => {
    /*
     * Mirrors what createResxFile writes: tab indented, no trailing newline, and
     * <!--Data--> as the last child, so there is no existing <data> element to append
     * after. Every other add test starts from a file that already has entries.
     */
    const created = `<?xml version="1.0" encoding="utf-8"?>\n<root>\n\t<resheader name="resmimetype">\n\t\t<value>text/microsoft-resx</value>\n\t</resheader>\n\t<!--Data-->\n</root>`;
    const resxFile = ResxFile.parse(created, 4);
    assert.deepEqual(resxFile.entries, []);

    resxFile.applyEntries([{ key: "Hello", value: "World", comment: "first one" }]);
    const xml = resxFile.toXml();

    assert.ok(xml.indexOf("<!--Data-->") < xml.indexOf("<data "), "the marker still introduces the data block");
    assert.ok(xml.includes(`\t<data name="Hello" xml:space="preserve">\n\t\t<value>World</value>\n\t\t<comment>first one</comment>\n\t</data>`),
              "the entry copies the template's tabs");
    assert.ok(xml.endsWith("</root>"), "the template has no trailing newline and does not grow one");
});

test("indentation comes from the file, not from the setting", () => {
    assert.ok(ResxFile.parse(fixture, 8).toXml().includes(`\n  <data name="Padded"`));

    const tabbed = `<root>\n\t<data name="A" xml:space="preserve">\n\t\t<value>a</value>\n\t</data>\n</root>\n`;
    assert.equal(ResxFile.parse(tabbed, 4).toXml(), tabbed);
});

test("the setting still decides indentation when the file has none to copy", () => {
    const unformatted = `<root><data name="A" xml:space="preserve"><value>a</value></data></root>`;
    assert.ok(ResxFile.parse(unformatted, 2).toXml().includes(`\n  <data name="A"`));
});

test("the trailing newline survives, and so does its absence", () => {
    assert.ok(ResxFile.parse(fixture).toXml().endsWith(">\n"));

    const withoutTrailingNewline = fixture.trimEnd();
    assert.equal(ResxFile.parse(withoutTrailingNewline).toXml(), withoutTrailingNewline);
});

test("CRLF line endings survive", () => {
    const crlfFixture = fixture.replace(/\r?\n/g, "\r\n");
    assert.equal(ResxFile.parse(crlfFixture).toXml(), crlfFixture);
});

test("an empty value keeps the spelling the .NET resx writer uses", () => {
    const resxFile = ResxFile.parse(fixture);
    resxFile.applyEntries(resxFile.entries.concat({ key: "AlsoEmpty", value: "" }));

    const xml = resxFile.toXml();
    assert.equal(xml.includes("<value/>"), false);
    assert.ok(xml.includes(`<data name="AlsoEmpty" xml:space="preserve">\n    <value />\n  </data>`));
});

test("a tightly spelled self closing tag stays tight", () => {
    const tight = `<root>\n  <data name="A" xml:space="preserve">\n    <value/>\n  </data>\n</root>\n`;
    assert.equal(ResxFile.parse(tight).toXml(), tight);
});

test("a key containing markup characters survives a round trip", () => {
    const resxFile = ResxFile.parse(fixture);
    const entries = resxFile.entries.concat({ key: `Tag <b> & "quoted"`, value: "x" });
    resxFile.applyEntries(entries);

    const xml = resxFile.toXml();
    assert.ok(xml.includes(`name="Tag &lt;b&gt; &amp; &quot;quoted&quot;"`));
    assert.deepEqual(ResxFile.parse(xml).entries.map(entry => entry.key), entries.map(entry => entry.key));
});

test("a value that gains padding gains xml:space so the padding is not trimmed on reload", () => {
    const source = `<root>\n  <data name="A">\n    <value>a</value>\n  </data>\n</root>\n`;
    const resxFile = ResxFile.parse(source);
    resxFile.applyEntries([{ key: "A", value: "  a  " }]);

    assert.ok(resxFile.toXml().includes(`<data name="A" xml:space="preserve">`));
});

test("&apos; and &quot; in a value normalize to the characters they encode", () => {
    const source = `<root>\n  <data name="A" xml:space="preserve">\n    <value>&apos;a&apos; &quot;b&quot;</value>\n  </data>\n</root>\n`;
    const resxFile = ResxFile.parse(source);

    assert.equal(resxFile.entries[0].value, `'a' "b"`);
    assert.ok(resxFile.toXml().includes(`<value>'a' "b"</value>`));
});

test("sorting by key reorders entries without reformatting the file", () => {
    const resxFile = ResxFile.parse(fixture);
    resxFile.sortEntriesByKey();

    const xml = resxFile.toXml();
    assert.deepEqual(ResxFile.parse(xml).entries.map(entry => entry.key),
                     ["Empty", "Escaped", "Logo", "MultiLine", "Padded", "Save & Exit", "Unicode"]);
    assert.ok(xml.endsWith(">\n"));
    assert.ok(xml.includes(`\n  <data name="Empty"`));
    assert.ok(xml.includes("<value />"));
    assert.ok(xml.includes(`<value>   leading and trailing   </value>`));
});

test("an unchanged document produces no edit", () => {
    assert.equal(computeMinimalTextEdit("<value>a</value>", "<value>a</value>"), undefined);
});

test("a one character change produces a one character edit", () => {
    assert.deepEqual(computeMinimalTextEdit("<value>abc</value>", "<value>abd</value>"),
                     { start: 9, end: 10, newText: "d" });
});

test("an edit never splits a surrogate pair", () => {
    assert.deepEqual(computeMinimalTextEdit("a🎉", "a🎊"), { start: 1, end: 3, newText: "🎊" });
    assert.deepEqual(computeMinimalTextEdit("🎉a", "🎊a"), { start: 0, end: 2, newText: "🎊" });
});

test("applying the minimal edit reproduces the rewritten document", () => {
    const resxFile = ResxFile.parse(fixture);
    const entries = resxFile.entries;
    entries[3].value = "Saved and exited 🎊";
    resxFile.applyEntries(entries);

    const xml = resxFile.toXml();
    const minimalEdit = computeMinimalTextEdit(fixture, xml);
    assert.notEqual(minimalEdit, undefined);
    assert.equal(fixture.slice(0, minimalEdit!.start) + minimalEdit!.newText + fixture.slice(minimalEdit!.end), xml);
});
