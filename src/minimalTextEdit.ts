const highSurrogateStart = 0xD800;
const highSurrogateEnd = 0xDBFF;

/**
 * A single replacement, expressed as character offsets into the original text.
 */
export interface MinimalTextEdit {
    start: number;
    end: number;
    newText: string;
}

/**
 * Narrows a whole-document rewrite down to the range that actually changed, so
 * that a one-character edit reaches the file as a one-character edit instead of
 * a rewritten document. Returns undefined when the two texts are identical.
 */
export function computeMinimalTextEdit(oldText: string, newText: string): MinimalTextEdit | undefined {
    if (oldText === newText) {
        return undefined;
    }

    const shortestLength = Math.min(oldText.length, newText.length);
    let start = 0;
    while (start < shortestLength && oldText.charCodeAt(start) === newText.charCodeAt(start)) {
        start++;
    }

    let oldEnd = oldText.length;
    let newEnd = newText.length;
    while (oldEnd > start && newEnd > start && oldText.charCodeAt(oldEnd - 1) === newText.charCodeAt(newEnd - 1)) {
        oldEnd--;
        newEnd--;
    }

    /*
     * A boundary landing between the halves of a surrogate pair would hand the
     * editor a position inside a single character. Widen the range by one code
     * unit rather than split it.
     */
    if (start > 0 && isHighSurrogate(oldText.charCodeAt(start - 1))) {
        start--;
    }
    if (oldEnd < oldText.length && isHighSurrogate(oldText.charCodeAt(oldEnd - 1))) {
        oldEnd++;
        newEnd++;
    }

    return { start: start, end: oldEnd, newText: newText.slice(start, newEnd) };
}

function isHighSurrogate(code: number): boolean {
    return code >= highSurrogateStart && code <= highSurrogateEnd;
}
