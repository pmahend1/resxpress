const resourceHeaders: ReadonlyArray<readonly [string, string]> = [
    ["resmimetype", "text/microsoft-resx"],
    ["version", "2.0"],
    ["reader", "System.Resources.ResXResourceReader, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089"],
    ["writer", "System.Resources.ResXResourceWriter, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089"]
];

/**
 * The contents of a newly created resx. `<!--Data-->` is the marker the editor
 * adds the first entry below, and the file deliberately ends without a trailing
 * newline so a later round trip does not grow one.
 */
export function createResxTemplate(indent: string): string {
    const headers = resourceHeaders.map(([name, value]) =>
        `${indent}<resheader name="${name}">\n${indent}${indent}<value>${value}</value>\n${indent}</resheader>`);

    return `<?xml version="1.0" encoding="utf-8"?>\n<root>\n${headers.join("\n")}\n${indent}<!--Data-->\n</root>`;
}
