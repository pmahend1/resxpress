import { CultureNames } from "./cultureNames";

const resxExtension = ".resx";
const neutralCulture = "";
const neutralLabel = "Default";
const separator = ".";

/**
 * A resx file name split into `<baseName>[.<culture>].resx`.
 */
export class ResxFileName {
    public readonly baseName: string;

    /** The culture tag, or the empty string for the neutral file. */
    public readonly culture: string;

    private constructor(baseName: string, culture: string) {
        this.baseName = baseName;
        this.culture = culture;
    }

    /**
     * Splits a resx file name, or returns undefined when it is not a resx.
     *
     * A dotted segment is a culture only when {@link CultureNames} has it - and
     * `no` and `my` are languages as well as English, so `ResxGroup` trusts the
     * split only once it has seen the neutral file beside it too.
     */
    public static parse(fileName: string): ResxFileName | undefined {
        if (fileName.toLowerCase().endsWith(resxExtension) === false) {
            return undefined;
        }

        const withoutExtension = fileName.slice(0, fileName.length - resxExtension.length);
        const lastSeparator = withoutExtension.lastIndexOf(separator);

        // A leading dot is a hidden file, not a culture, hence <= rather than <.
        if (lastSeparator <= 0) {
            return new ResxFileName(withoutExtension, neutralCulture);
        }

        const candidate = withoutExtension.slice(lastSeparator + 1);
        if (CultureNames.has(candidate) === false) {
            return new ResxFileName(withoutExtension, neutralCulture);
        }

        return new ResxFileName(withoutExtension.slice(0, lastSeparator), candidate);
    }

    public static neutral(baseName: string): ResxFileName {
        return new ResxFileName(baseName, neutralCulture);
    }

    public static toFileName(baseName: string, culture: string): string {
        return culture.length === 0
             ? `${baseName}${resxExtension}`
             : `${baseName}${separator}${culture}${resxExtension}`;
    }

    /** What a column header shows for a culture. */
    public static label(culture: string): string {
        return culture.length === 0 ? neutralLabel : culture;
    }

    /**
     * Whether two base names name the same resource. Folded because `fs.stat`
     * is: comparing exactly loses the Default column, and says nothing.
     */
    public static sameBaseName(first: string, second: string): boolean {
        return first.toLowerCase() === second.toLowerCase();
    }

    /** Folded like the base name: `fr-CA` and `fr-ca` are one culture to .NET. */
    public static cultureKey(culture: string): string {
        return culture.toLowerCase();
    }

    /**
     * Orders two spellings of one file name, best first: the one the group was
     * resolved from, then ordinal, so a listing's order never decides it.
     */
    public static compareSpellings(first: string, second: string, resolvedFrom: string): number {
        if (first === second) {
            return 0;
        }

        if (first === resolvedFrom) {
            return -1;
        }

        if (second === resolvedFrom) {
            return 1;
        }

        return first < second ? -1 : 1;
    }

    /** Neutral first, then alphabetical, so the key authority heads the table. */
    public static compareCultures(first: string, second: string): number {
        if (first.length === 0 || second.length === 0) {
            return first.length - second.length;
        }

        return first < second ? -1 : first > second ? 1 : 0;
    }

    /**
     * The segment that would have made `fileName` a variant of `baseName` had it
     * been a culture. Only for reporting a column that went missing.
     */
    public static unknownCultureOf(fileName: string, baseName: string): string | undefined {
        const parsed = ResxFileName.parse(fileName);
        if (parsed === undefined || parsed.culture.length > 0) {
            return undefined;
        }

        const lastSeparator = parsed.baseName.lastIndexOf(separator);
        if (lastSeparator <= 0
         || ResxFileName.sameBaseName(parsed.baseName.slice(0, lastSeparator), baseName) === false) {
            return undefined;
        }

        return parsed.baseName.slice(lastSeparator + 1);
    }

    public get fileName(): string {
        return ResxFileName.toFileName(this.baseName, this.culture);
    }
}
