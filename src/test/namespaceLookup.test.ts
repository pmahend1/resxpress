import assert from "node:assert/strict";
import { test } from "node:test";
import { NamespaceLookup } from "../namespaceLookup.ts";

/*
 * The second argument is ResxGroup.baseName, which is the neutral file's
 * spelling on disk when there is one and the whole file name when there is
 * not. That is where the "is this really a culture" rule is decided; these
 * pin only what is done with the answer.
 */

test("the neutral file is looked up under its own name alone", () => {
    assert.deepEqual(NamespaceLookup.candidates("Resource", "Resource"), ["Resource"]);
});

test("a culture file falls back to the neutral file's name, but only second", () => {
    // Own name first, so an explicit "Resource.es" mapping entry still wins.
    assert.deepEqual(NamespaceLookup.candidates("Resource.es", "Resource"), ["Resource.es", "Resource"]);
    assert.deepEqual(NamespaceLookup.candidates("Resource.fr-CA", "Resource"), ["Resource.fr-CA", "Resource"]);
});

test("a dotted name with no neutral sibling is looked up whole", () => {
    // ResxGroup reports "My.App" for My.App.resx with no My.resx beside it.
    assert.deepEqual(NamespaceLookup.candidates("My.App", "My.App"), ["My.App"]);
    assert.deepEqual(NamespaceLookup.candidates("Resource.es", "Resource.es"), ["Resource.es"]);
});

test("the neutral spelling on disk is what is looked up, not the culture file's", () => {
    // fs.stat is case-insensitive on macOS and Windows, so the two can differ.
    assert.deepEqual(NamespaceLookup.candidates("Resources.de", "resources"), ["Resources.de", "resources"]);
});

test("a base name differing only in case is not looked up twice", () => {
    assert.deepEqual(NamespaceLookup.candidates("Resource", "resource"), ["Resource"]);
});

test("an unresolvable group leaves the file's own name as the only candidate", () => {
    assert.deepEqual(NamespaceLookup.candidates("Resource.es", ""), ["Resource.es"]);
});
