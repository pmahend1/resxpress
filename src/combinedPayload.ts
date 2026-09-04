import type { CombinedColumn } from "./combinedColumn";
import type { CombinedEntry } from "./combinedEntry";

/**
 * The whole combined table, as it crosses the extension <-> webview boundary.
 * The columns travel with the entries because the webview builds its own
 * header: how many columns there are is data, not markup.
 */
export interface CombinedPayload {
    columns: CombinedColumn[];
    entries: CombinedEntry[];
}
