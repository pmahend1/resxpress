import { readFileSync } from "fs";
import * as path from "path";

const svgOpenTag = "<svg";
const iconDirectory = "styles";

// Inlined rather than an <img> so the icon takes currentColor from its button;
// an <img> can only be recoloured by a fixed filter, which vanished on light themes.
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
