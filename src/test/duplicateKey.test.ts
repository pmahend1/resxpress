import assert from "node:assert/strict";
import { test } from "node:test";
import { DuplicateKey } from "../duplicateKey.ts";

test("a duplicate takes the key with Copy appended", () => {
    assert.equal(DuplicateKey.for("Greeting", ["Greeting", "Farewell"]), "GreetingCopy");
});

test("a taken Copy key is numbered from 2, skipping every number in use", () => {
    assert.equal(DuplicateKey.for("Greeting", ["Greeting", "GreetingCopy"]), "GreetingCopy2");
    assert.equal(DuplicateKey.for("Greeting", ["Greeting", "GreetingCopy", "GreetingCopy2", "GreetingCopy3"]), "GreetingCopy4");
});

test("duplicating a copy appends again rather than guessing at a number", () => {
    assert.equal(DuplicateKey.for("GreetingCopy", ["Greeting", "GreetingCopy"]), "GreetingCopyCopy");
});

// validate() in both webviews compares keys ordinally, so a case variant is not a clash.
test("keys are compared case-sensitively", () => {
    assert.equal(DuplicateKey.for("Greeting", ["Greeting", "greetingcopy"]), "GreetingCopy");
});

test("an empty key still yields a key the file can hold", () => {
    assert.equal(DuplicateKey.for("", [""]), "Copy");
});
