import { readFileSync } from "fs";
import * as path from "path";

const svgOpenTag = "<svg";
const iconDirectory = "styles";

/*
 * Webview icons are inlined as markup rather than loaded through <img>, so they
 * take currentColor from the button they sit in. An <img> can only be recoloured
 * by a fixed filter, which suits one button colour and vanishes on another -
 * Light Modern's secondary button is light grey with dark text. The icon is
 * decorative; the button's text or aria-label is its accessible name.
 */
export function toInlineIcon(svg: string): string {
    const openTagStart = svg.indexOf(svgOpenTag);
    if (openTagStart === -1) {
        throw new Error("The icon file has no <svg> element.");
    }

    const restOfDocument = svg.slice(openTagStart + svgOpenTag.length);
    return `${svgOpenTag} class="icon" aria-hidden="true"${restOfDocument}`;
}

// Icons ship with the extension, so their markup is trusted and goes in unescaped.
export function readInlineIcon(extensionPath: string, fileName: string): string {
    const svg = readFileSync(path.join(extensionPath, iconDirectory, fileName), "utf8");
    return toInlineIcon(svg);
}
