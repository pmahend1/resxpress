import type { CombinedEntry } from "./combinedEntry";
import { emptyString } from "./constants";
import type { ResxEntry } from "./resxEntry";

/**
 * Applies one edited cell to its row, for both webviews. Every other cell is
 * copied from the row as it was rather than read back out of the DOM, so an
 * edit can only ever change the cell it was made in - reading the whole row
 * let a cell that could not hold its value, an `<input>` stripping a
 * multi-line value's line breaks, overwrite the file on an edit next door.
 *
 * Returns `undefined` for a field it does not know.
 */
export class CellEdit {
    public static readonly keyField = "key";
    public static readonly valueField = "value";
    public static readonly commentField = "comment";

    public static apply(entry: ResxEntry, field: string, text: string): ResxEntry | undefined {
        const edited: ResxEntry = { ...entry };
        switch (field) {
            case CellEdit.keyField:
                edited.key = text;
                break;
            case CellEdit.valueField:
                edited.value = text;
                break;
            case CellEdit.commentField:
                if (text.length > 0) {
                    edited.comment = text;
                }
                else {
                    delete edited.comment;
                }
                break;
            default:
                return undefined;
        }

        return edited;
    }

    /**
     * A cell's *presence* is as meaningful as its text: a missing `values`
     * property means the key is absent from that language's file, and an empty
     * string means it is there and blank. So an emptied cell keeps its property
     * only when it was already blank, which makes clearing a translation the
     * gesture that removes it, and leaves a deliberately blank entry alone.
     */
    public static applyCombined(entry: CombinedEntry, field: string, culture: string, text: string): CombinedEntry | undefined {
        const edited: CombinedEntry = { key: entry.key, values: { ...entry.values }, comments: { ...entry.comments } };
        switch (field) {
            case CellEdit.keyField:
                edited.key = text;
                break;
            case CellEdit.valueField:
                if (text.length > 0) {
                    edited.values[culture] = text;
                }
                else if (entry.values[culture] !== emptyString) {
                    delete edited.values[culture];
                }
                break;
            case CellEdit.commentField:
                if (text.length > 0) {
                    edited.comments[culture] = text;
                }
                else {
                    delete edited.comments[culture];
                }
                break;
            default:
                return undefined;
        }

        return edited;
    }
}
