/**
 * One resource key across every culture of a resource. This is the shape the
 * combined panel and its webview trade in, the way {@link ResxEntry} is the
 * shape the single file editor trades in.
 */
export interface CombinedEntry {
    key: string;

    /**
     * culture -> value, keyed by culture tag with the empty string for the
     * neutral file. A **missing property means the entry is absent from that
     * culture's file**; an empty string means it is there and deliberately
     * blank. Everything that writes a culture file depends on that distinction:
     * without it every translation would be seeded with the neutral key set.
     */
    values: Record<string, string>;

    /** culture -> comment, for the cultures that carry one. */
    comments: Record<string, string>;
}
