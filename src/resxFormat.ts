import { emptyString } from "./constants";

const lineFeed = "\n";
const carriageReturnLineFeed = "\r\n";
const maximumIndentLength = 8;

/**
 * The parts of a resx file that xml-js does not carry through a parse and
 * serialize cycle: indentation, line endings, the space in `<value />` and the
 * trailing newline. `ResxFile` captures these on parse and restores them on
 * write, which is what keeps a one-character edit from rewriting every line.
 */
export class ResxFormat {
    public readonly indent: string | number;
    public readonly eol: string;
    public readonly hasSpaceBeforeSelfClosingSlash: boolean;
    public readonly trailingWhitespace: string;

    private constructor(indent: string | number,
                        eol: string,
                        hasSpaceBeforeSelfClosingSlash: boolean,
                        trailingWhitespace: string) {
        this.indent = indent;
        this.eol = eol;
        this.hasSpaceBeforeSelfClosingSlash = hasSpaceBeforeSelfClosingSlash;
        this.trailingWhitespace = trailingWhitespace;
    }

    public static detect(text: string, fallbackIndentLength: number): ResxFormat {
        return new ResxFormat(detectIndent(text) ?? fallbackIndentLength,
                              text.includes(carriageReturnLineFeed) ? carriageReturnLineFeed : lineFeed,
                              detectSpaceBeforeSelfClosingSlash(text),
                              detectTrailingWhitespace(text));
    }
}

/*
 * The shallowest indented markup line sits one level deep, because a resx has
 * a single root element. Taking the minimum is what stops the example XML
 * inside the Microsoft ResX schema comment - indented deeper than the elements
 * around it - from being mistaken for the file's indent unit.
 */
function detectIndent(text: string): string | undefined {
    let indent: string | undefined;
    for (const line of text.split(lineFeed)) {
        const match = /^([ \t]+)</.exec(line);
        if (match === null) {
            continue;
        }

        const candidate = match[1];
        const isUniform = /^ +$/.test(candidate) || /^\t+$/.test(candidate);
        if (isUniform === false || candidate.length > maximumIndentLength) {
            continue;
        }

        if (indent === undefined || candidate.length < indent.length) {
            indent = candidate;
        }
    }

    return indent;
}

// Files with no self-closing tag at all get the `<value />` the .NET resx writer produces.
function detectSpaceBeforeSelfClosingSlash(text: string): boolean {
    const spaced = text.match(/\s\/>/g)?.length ?? 0;
    const tight = text.match(/[^\s]\/>/g)?.length ?? 0;
    return tight === 0 || spaced >= tight;
}

function detectTrailingWhitespace(text: string): string {
    let end = text.length;
    while (end > 0 && /\s/.test(text.charAt(end - 1))) {
        end--;
    }

    return end === 0 ? emptyString : text.slice(end);
}
