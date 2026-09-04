import * as xmljs from "xml-js";
import { DATA, emptyString } from "./constants";
import type { ResxEntry } from "./resxEntry";
import { ResxFormat } from "./resxFormat";

const valueElementName = "value";
const commentElementName = "comment";
const nameAttributeName = "name";
const xmlSpaceAttributeName = "xml:space";
const preserveAttributeValue = "preserve";
const elementNodeType = "element";
const textNodeType = "text";
const cdataNodeType = "cdata";
const carriageReturnLineFeed = "\r\n";
const defaultIndentLength = 4;

/**
 * A parsed resx file, and the only place in the extension that knows about
 * xml-js. Everything outside works in terms of {@link ResxEntry}.
 */
export class ResxFile {
    private readonly document: xmljs.Element;
    private readonly format: ResxFormat;

    private constructor(document: xmljs.Element, format: ResxFormat) {
        this.document = document;
        this.format = format;
    }

    /**
     * @throws when the text is not well-formed XML.
     */
    public static parse(text: string, fallbackIndentLength: number = defaultIndentLength): ResxFile {
        const document = xmljs.xml2js(text) as xmljs.Element;
        return new ResxFile(document, ResxFormat.detect(text, fallbackIndentLength));
    }

    public get entries(): ResxEntry[] {
        return this.dataElements.map(toEntry);
    }

    /**
     * Replaces the file's entries, reusing the `<data>` element that already
     * carries each key. Reuse is what keeps an edit, a rename or a delete from
     * rewriting the entries around it.
     */
    public applyEntries(entries: ResxEntry[]): void {
        const root = this.rootElement;
        if (root === undefined) {
            return;
        }

        const children = root.elements ?? [];
        const slots: number[] = [];
        children.forEach((child, index) => {
            if (child.name === DATA) {
                slots.push(index);
            }
        });

        const existing = slots.map(slot => children[slot]);
        const reusableByKey = new Map<string, xmljs.Element[]>();
        for (const element of existing) {
            const queued = reusableByKey.get(readKey(element));
            if (queued === undefined) {
                reusableByKey.set(readKey(element), [element]);
            }
            else {
                queued.push(element);
            }
        }

        const matched = entries.map(entry => reusableByKey.get(entry.key)?.shift());
        const claimed = new Set(matched);

        // An entry whose key is gone was renamed, so it takes over an element nothing else claimed.
        const renameable = existing.filter(element => claimed.has(element) === false);
        let renameableIndex = 0;

        const updated = entries.map((entry, index) => {
            const reused = matched[index]
                ?? (renameableIndex < renameable.length ? renameable[renameableIndex++] : createDataElement());
            applyEntry(reused, entry);
            return reused;
        });

        root.elements = fillSlots(children, slots, updated);
    }

    public sortEntriesByKey(reverse: boolean = false): void {
        const root = this.rootElement;
        if (root?.elements === undefined) {
            return;
        }

        const others = root.elements.filter(element => element.name !== DATA);
        const data = root.elements.filter(element => element.name === DATA);
        data.sort((first, second) => compareKeys(readKey(first), readKey(second), reverse));
        root.elements = others.concat(data);
    }

    public toXml(): string {
        const escaped = structuredClone(this.document);
        escapeAttributes(escaped);

        let xml = xmljs.js2xml(escaped, { spaces: this.format.indent });
        if (this.format.hasSpaceBeforeSelfClosingSlash) {
            xml = addSpaceBeforeSelfClosingSlash(xml);
        }
        if (this.format.eol === carriageReturnLineFeed) {
            xml = xml.replace(/\r\n|\n/g, carriageReturnLineFeed);
        }

        return xml + this.format.trailingWhitespace;
    }

    private get rootElement(): xmljs.Element | undefined {
        return this.document.elements?.find(element => element.type === elementNodeType);
    }

    private get dataElements(): xmljs.Element[] {
        return this.rootElement?.elements?.filter(element => element.name === DATA) ?? [];
    }
}

function toEntry(element: xmljs.Element): ResxEntry {
    const entry: ResxEntry = {
        key: readKey(element),
        value: readText(findChild(element, valueElementName))
    };

    const comment = readText(findChild(element, commentElementName));
    if (comment.length > 0) {
        entry.comment = comment;
    }

    return entry;
}

function applyEntry(element: xmljs.Element, entry: ResxEntry): void {
    const attributes = element.attributes ?? {};
    attributes[nameAttributeName] = entry.key;

    // Without xml:space the reader trims the value, so padding would be lost on reload.
    if (entry.value !== entry.value.trim() && attributes[xmlSpaceAttributeName] === undefined) {
        attributes[xmlSpaceAttributeName] = preserveAttributeValue;
    }
    element.attributes = attributes;

    setChildText(element, valueElementName, entry.value, 0);

    const comment = entry.comment ?? emptyString;
    if (comment.length === 0) {
        removeChild(element, commentElementName);
    }
    else {
        setChildText(element, commentElementName, comment, undefined);
    }
}

function createDataElement(): xmljs.Element {
    return {
        type: elementNodeType,
        name: DATA,
        attributes: {
            [nameAttributeName]: emptyString,
            [xmlSpaceAttributeName]: preserveAttributeValue
        },
        elements: []
    };
}

/**
 * Writes `updated` back into the positions `<data>` elements already occupied,
 * so the comments and resheaders around them keep their place.
 */
function fillSlots(children: xmljs.Element[], slots: number[], updated: xmljs.Element[]): xmljs.Element[] {
    const reusedSlotCount = Math.min(slots.length, updated.length);
    for (let index = 0; index < reusedSlotCount; index++) {
        children[slots[index]] = updated[index];
    }

    if (updated.length > slots.length) {
        const insertAt = slots.length === 0 ? children.length : slots[slots.length - 1] + 1;
        children.splice(insertAt, 0, ...updated.slice(slots.length));
        return children;
    }

    // Back to front, so the earlier slot indexes stay valid as entries are removed.
    for (let index = slots.length - 1; index >= updated.length; index--) {
        children.splice(slots[index], 1);
    }

    return children;
}

function setChildText(parent: xmljs.Element, name: string, text: string, insertAt: number | undefined): void {
    const child = findChild(parent, name);
    if (child === undefined) {
        const created: xmljs.Element = { type: elementNodeType, name: name };
        if (text.length > 0) {
            created.elements = [{ type: textNodeType, text: text }];
        }

        const children = parent.elements ?? [];
        if (insertAt === undefined) {
            children.push(created);
        }
        else {
            children.splice(insertAt, 0, created);
        }
        parent.elements = children;
        return;
    }

    // Leaving an unchanged element untouched preserves CDATA and entity spelling.
    if (readText(child) === text) {
        return;
    }

    if (text.length === 0) {
        delete child.elements;
        return;
    }

    child.elements = [{ type: textNodeType, text: text }];
}

function removeChild(parent: xmljs.Element, name: string): void {
    const index = parent.elements?.findIndex(element => element.name === name) ?? -1;
    if (index >= 0) {
        parent.elements?.splice(index, 1);
    }
}

function findChild(parent: xmljs.Element | undefined, name: string): xmljs.Element | undefined {
    return parent?.elements?.find(element => element.name === name);
}

function readKey(element: xmljs.Element): string {
    const name = element.attributes?.[nameAttributeName];
    return name === undefined ? emptyString : String(name);
}

function readText(element: xmljs.Element | undefined): string {
    if (element?.elements === undefined) {
        return emptyString;
    }

    let text = emptyString;
    for (const child of element.elements) {
        if (child.type === textNodeType && child.text !== undefined) {
            text += String(child.text);
        }
        else if (child.type === cdataNodeType && child.cdata !== undefined) {
            text += String(child.cdata);
        }
    }

    return text;
}

function compareKeys(first: string, second: string, reverse: boolean): number {
    const left = first.toLowerCase();
    const right = second.toLowerCase();
    const order = left < right ? -1 : left > right ? 1 : 0;
    return reverse ? -order : order;
}

/*
 * xml-js escapes nothing but the double quote when it writes an attribute, so
 * a key containing & or < is emitted verbatim and the file it produces no
 * longer parses. Escaping up front is safe precisely because the writer leaves
 * every other character alone, and it also restores the entity spelling the
 * parser decoded on the way in.
 */
function escapeAttributes(element: xmljs.Element): void {
    if (element.attributes !== undefined) {
        for (const [name, value] of Object.entries(element.attributes)) {
            if (value !== undefined) {
                element.attributes[name] = escapeAttributeValue(String(value));
            }
        }
    }

    element.elements?.forEach(child => escapeAttributes(child));
}

function escapeAttributeValue(value: string): string {
    return value.replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;");
}

/*
 * `<value />` is how the .NET resx writer spells an empty element and xml-js
 * spells it `<value/>`, so every empty entry would otherwise read as a change.
 * Comment and CDATA bodies are copied through untouched: they are the one
 * place a literal "/>" can survive into the output.
 */
function addSpaceBeforeSelfClosingSlash(xml: string): string {
    const skippedOrSelfClosing = /(<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>)|([^\s/])\/>/g;
    return xml.replace(skippedOrSelfClosing,
                       (_match, skipped: string | undefined, precedingCharacter: string) =>
                           skipped ?? `${precedingCharacter} />`);
}
