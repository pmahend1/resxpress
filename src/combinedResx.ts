import type { CombinedEntry } from "./combinedEntry";
import { emptyString } from "./constants";
import type { ResxEntry } from "./resxEntry";

/**
 * Folds several cultures' entry lists into one keyed table and back again.
 * Pure and vscode-free, so the union model is unit testable on its own.
 */
export class CombinedResx {

    /**
     * Builds the union of every culture's entries. Keys keep the order of the
     * first culture that carries them, so passing the neutral culture first
     * makes the neutral file the key authority and appends keys that only a
     * translation has after it.
     */
    public static combine(cultures: string[], entriesByCulture: Record<string, ResxEntry[]>): CombinedEntry[] {
        const rows = new Map<string, CombinedEntry>();

        for (const culture of cultures) {
            for (const entry of entriesByCulture[culture] ?? []) {
                let row = rows.get(entry.key);
                if (row === undefined) {
                    row = { key: entry.key, values: {}, comments: {} };
                    rows.set(entry.key, row);
                }

                row.values[culture] = entry.value;
                if (entry.comment !== undefined && entry.comment.length > 0) {
                    row.comments[culture] = entry.comment;
                }
            }
        }

        return Array.from(rows.values());
    }

    /**
     * Projects the table back onto one culture, producing exactly the entries
     * that culture's file should hold.
     *
     * `existingKeys` are the keys that file already holds, in its own order,
     * and the projection is laid back out along them. The table is ordered by
     * the *neutral* file, so without this the first edit anywhere in the panel
     * would reorder every translation whose keys happen to sit in a different
     * order, rewriting files nobody asked to restructure.
     *
     * A key the file no longer has leaves its place open, and the keys that are
     * new to the file fill those places first. That is what keeps a rename a
     * rename: the new name lands exactly where the old one sat, so `applyEntries`
     * rewrites that one `<data>` element instead of shuffling every element
     * after it.
     *
     * Any other new key - a duplicate, or a first translation - goes next to its
     * neighbour in the table: after the nearest key above it that the file holds,
     * else before the nearest one below it. Appending instead would leave it
     * wherever the file happens to end, and move its row on the next load.
     */
    public static split(entries: CombinedEntry[], culture: string, existingKeys: string[] = []): ResxEntry[] {
        const projected = new Map<string, ResxEntry>();

        for (const combined of entries) {
            if (combined.key.length === 0) {
                continue;
            }

            const value = combined.values[culture];
            const comment = combined.comments[culture] ?? emptyString;

            /*
             * An absent cell is not an entry. Writing one anyway is the failure
             * mode this whole model exists to avoid: it would copy the neutral
             * file's every key into every translation as a blank string the
             * moment anything else on the row was edited. A comment on its own
             * still counts, because typing one is a deliberate act.
             */
            if (value === undefined && comment.length === 0) {
                continue;
            }

            // Property order matches ResxFile's own entries so the two compare as JSON.
            const entry: ResxEntry = { key: combined.key, value: value ?? emptyString };
            if (comment.length > 0) {
                entry.comment = comment;
            }

            projected.set(combined.key, entry);
        }

        const places: (ResxEntry | undefined)[] = [];
        for (const key of existingKeys) {
            const entry = projected.get(key);
            places.push(entry);
            projected.delete(key);
        }

        const added = Array.from(projected.values());
        const ordered: ResxEntry[] = [];
        let addedIndex = 0;

        for (const place of places) {
            if (place !== undefined) {
                ordered.push(place);
            }
            else if (addedIndex < added.length) {
                ordered.push(added[addedIndex++]);
            }
        }

        // In table order, so a run of new keys lands in that order behind one neighbour.
        const tableKeys = entries.map(combined => combined.key);
        while (addedIndex < added.length) {
            const entry = added[addedIndex++];
            ordered.splice(CombinedResx.neighbourPosition(entry.key, tableKeys, ordered), 0, entry);
        }

        return ordered;
    }

    private static neighbourPosition(key: string, tableKeys: string[], ordered: ResxEntry[]): number {
        const orderedKeys = ordered.map(entry => entry.key);
        const row = tableKeys.indexOf(key);

        for (let above = row - 1; above >= 0; above--) {
            const position = orderedKeys.indexOf(tableKeys[above]);
            if (position !== -1) {
                return position + 1;
            }
        }

        for (let below = row + 1; below < tableKeys.length; below++) {
            const position = orderedKeys.indexOf(tableKeys[below]);
            if (position !== -1) {
                return position;
            }
        }

        return ordered.length;
    }
}
