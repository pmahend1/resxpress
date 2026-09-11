import assert from "node:assert/strict";
import { test } from "node:test";
import { ResxFile } from "../resxFile.ts";
import { createResxTemplate } from "../resxTemplate.ts";

test("a created file is indented with the unit it was given", () => {
    const twoSpaces = createResxTemplate("  ");
    assert.ok(twoSpaces.includes(`\n  <resheader name="resmimetype">\n    <value>text/microsoft-resx</value>\n  </resheader>`));

    const fourSpaces = createResxTemplate("    ");
    assert.ok(fourSpaces.includes(`\n    <resheader name="resmimetype">\n        <value>text/microsoft-resx</value>\n    </resheader>`));

    const tabbed = createResxTemplate("\t");
    assert.ok(tabbed.includes(`\n\t<resheader name="resmimetype">\n\t\t<value>text/microsoft-resx</value>\n\t</resheader>`));

    assert.equal(twoSpaces.includes("\t"), false, "a space indented file contains no tab");
});

// Creation picks the indent and detection preserves it, so a new file's first edit
// must not rewrite every line of it.
const createdIndents: ReadonlyArray<readonly [string, string]> = [
    ["2 spaces", "  "],
    ["4 spaces", "    "],
    ["8 spaces", "        "],
    ["a tab", "\t"]
];

for (const [label, indent] of createdIndents) {
    test(`a file created with ${label} round trips byte identically`, () => {
        const template = createResxTemplate(indent);
        assert.equal(ResxFile.parse(template).toXml(), template);
    });

    test(`the first entry added to a file created with ${label} copies that indent`, () => {
        const resxFile = ResxFile.parse(createResxTemplate(indent));
        assert.deepEqual(resxFile.entries, []);

        resxFile.applyEntries([{ key: "Hello", value: "World", comment: "first one" }]);
        const xml = resxFile.toXml();

        assert.ok(xml.indexOf("<!--Data-->") < xml.indexOf("<data "), "the marker still introduces the data block");
        assert.ok(
            xml.includes(`${indent}<data name="Hello" xml:space="preserve">\n${indent}${indent}<value>World</value>`),
            "the entry copies the template's indent"
        );
    });
}

test("the template ends without a trailing newline, and adding an entry does not grow one", () => {
    const template = createResxTemplate("    ");
    assert.ok(template.endsWith("</root>"));

    const resxFile = ResxFile.parse(template);
    resxFile.applyEntries([{ key: "Hello", value: "World" }]);
    assert.ok(resxFile.toXml().endsWith("</root>"));
});
