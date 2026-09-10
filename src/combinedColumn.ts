/**
 * One culture's column in the combined table.
 */
export interface CombinedColumn {
    /** The culture tag, or the empty string for the neutral file. */
    culture: string;

    /** Header text - the culture tag, or "Default" for the neutral file. */
    label: string;

    /** The file this column writes to, shown as the header's tooltip. */
    fileName: string;
}
