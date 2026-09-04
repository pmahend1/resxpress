/**
 * One `<data>` entry of a resx file with the xml-js representation stripped
 * off. This is the only shape that crosses the extension <-> webview boundary.
 */
export interface ResxEntry {
    key: string;
    value: string;
    comment?: string;
}
