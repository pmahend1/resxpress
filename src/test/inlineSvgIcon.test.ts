import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { toInlineIcon } from "../inlineSvgIcon.ts";

const stylesDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "styles");

test("an inline icon is classed and hidden from screen readers", () => {
    const icon = toInlineIcon('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>');
    assert.equal(icon, '<svg class="icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0"/></svg>');
});

test("anything before the <svg> element is dropped", () => {
    const icon = toInlineIcon('<?xml version="1.0" encoding="UTF-8"?>\n<svg viewBox="0 0 24 24"></svg>');
    assert.equal(icon, '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"></svg>');
});

test("a file with no <svg> element is refused", () => {
    assert.throws(() => toInlineIcon("<html></html>"), /no <svg> element/);
});

/*
 * .icon paints through an inherited fill: currentColor, and a fill set on an
 * inner element beats an inherited one, so that icon would ignore the button's
 * text colour. A fill on the root <svg> is fine; .icon overrides it there.
 */
test("every shipped icon inlines and leaves its fill to currentColor", () => {
    const iconFiles = readdirSync(stylesDirectory).filter(name => name.endsWith(".svg"));
    assert.notEqual(iconFiles.length, 0);

    for (const name of iconFiles) {
        const svg = readFileSync(join(stylesDirectory, name), "utf8");
        assert.doesNotThrow(() => toInlineIcon(svg), name);

        const rootTagEnd = svg.indexOf(">", svg.indexOf("<svg"));
        assert.doesNotMatch(svg.slice(rootTagEnd + 1), /\sfill\s*=/, `${name} sets fill on an inner element`);
    }
});
