import assert from "node:assert/strict";
import { test } from "node:test";
import { CultureNames } from "../cultureNames.ts";
import { ResxFileName } from "../resxFileName.ts";

const neutral = "";

// The list is generated: these pin the properties a regeneration must not lose.

test("the generated culture list is there and is the size it should be", () => {
    // Guards a generator that wrote an empty or truncated file.
    assert.ok(CultureNames.count > 1000, `only ${CultureNames.count} cultures`);
});

test("an LCID is not a culture name", () => {
    // The sweep reads each culture's Name; the integer is never stored.
    assert.equal(CultureNames.has("1033"), false);
    assert.equal(CultureNames.has("1028"), false);
    assert.equal(ResxFileName.parse("Resources.1033.resx")?.culture, neutral);

    // Digits in a region subtag are a different thing: UN M.49, and real cultures.
    assert.equal(CultureNames.has("es-419"), true);
    assert.equal(CultureNames.has("ar-001"), true);
});

test("culture names are matched folded, like ResxFileName.cultureKey", () => {
    assert.equal(CultureNames.has("fr-CA"), true);
    assert.equal(CultureNames.has("fr-ca"), true);
    assert.equal(CultureNames.has("FR-CA"), true);
    assert.equal(CultureNames.has("zh-Hans-CN"), true);
});

test("cultures that only the LCID sweep reaches are in the list", () => {
    // ICU canonicalizes these away, which is why the generator sweeps LCIDs too.
    for (const culture of ["zh-TW", "zh-CN", "zh-HK", "zh-SG", "zh-MO", "pa-IN", "ur-PK", "kok-IN"]) {
        assert.equal(CultureNames.has(culture), true, `${culture} is missing`);
    }
});

test("cultures Windows has and ICU does not are in the list", () => {
    for (const culture of ["ca-ES-valencia", "en-029", "fr-029", "iu-Cans-CA", "ku-Arab-IQ", "prs-AF", "sms-FI"]) {
        assert.equal(CultureNames.has(culture), true, `${culture} is missing`);
    }
});

test("a deprecated spelling is dropped, and the name that replaced it is not", () => {
    // The only names the generator removes, each for the one beside it.
    const superseded = { "zh-CHS": "zh-Hans", "zh-CHT": "zh-Hant", "sr-Latn-CS": "sr-Latn-RS", "quz-PE": "qu-PE" };
    for (const [old, replacement] of Object.entries(superseded)) {
        assert.equal(CultureNames.has(old), false, `${old} is deprecated`);
        assert.equal(CultureNames.has(replacement), true, `${replacement} replaces ${old}`);
    }
});

test("pseudo-locales are in the list, since localization testing uses them", () => {
    assert.equal(CultureNames.has("qps-ploc"), true);
    assert.equal(CultureNames.has("qps-Ploc"), true);
    assert.equal(CultureNames.has("qps-plocm"), true);
});

test("ordinary resx cultures are in the list", () => {
    for (const culture of ["de", "es", "fr-CA", "pt-BR", "es-MX", "en-GB", "es-419", "sr-Cyrl-RS", "fil", "haw"]) {
        assert.equal(CultureNames.has(culture), true, `${culture} is missing`);
    }
});

test("a tag that is not a culture is not in the list", () => {
    // Every one passed the regex the list replaced.
    for (const notACulture of ["zz", "xx-YY", "app", "dev", "old", "new", "bak", "tmp", "doc", "web", "api", "qa"]) {
        assert.equal(CultureNames.has(notACulture), false, `${notACulture} is not a culture`);
    }
});

test("a dotted segment that is not a culture stays part of the base name", () => {
    assert.deepEqual({ ...ResxFileName.parse("Resources.bak.resx") },
                     { baseName: "Resources.bak", culture: neutral });
    assert.deepEqual({ ...ResxFileName.parse("Resources.zz.resx") },
                     { baseName: "Resources.zz", culture: neutral });
    assert.deepEqual({ ...ResxFileName.parse("My.App.resx") },
                     { baseName: "My.App", culture: neutral });
});

test("a dotted segment that is a culture still splits, whatever its case", () => {
    assert.deepEqual({ ...ResxFileName.parse("Resources.zh-TW.resx") },
                     { baseName: "Resources", culture: "zh-TW" });
    assert.deepEqual({ ...ResxFileName.parse("Resources.ZH-tw.resx") },
                     { baseName: "Resources", culture: "ZH-tw" });
    assert.deepEqual({ ...ResxFileName.parse("Resources.qps-ploc.resx") },
                     { baseName: "Resources", culture: "qps-ploc" });
});

test("an unrecognised segment is reported against the group it would have joined", () => {
    // What ResxGroup logs, so a column that stopped appearing has a reason.
    assert.equal(ResxFileName.unknownCultureOf("Resources.bak.resx", "Resources"), "bak");
    assert.equal(ResxFileName.unknownCultureOf("resources.zz.resx", "Resources"), "zz");

    // Nothing to report: it is the neutral file, a real culture, or another resource.
    assert.equal(ResxFileName.unknownCultureOf("Resources.resx", "Resources"), undefined);
    assert.equal(ResxFileName.unknownCultureOf("Resources.de.resx", "Resources"), undefined);
    assert.equal(ResxFileName.unknownCultureOf("Other.bak.resx", "Resources"), undefined);
    assert.equal(ResxFileName.unknownCultureOf("notes.txt", "Resources"), undefined);
});
