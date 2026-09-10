const resxExtension = ".resx";
const neutralCulture = "";
const neutralLabel = "Default";
const separator = ".";

/*
 * A culture as .NET spells it in a satellite resx name: a two or three letter
 * language subtag followed by any number of script, region or variant subtags.
 * The language subtag has to be lowercase, which is what stops "My.App.resx"
 * from reading as the culture "App". A lowercase three letter segment is
 * genuinely ambiguous with an ISO 639-3 code, so ResxGroup only trusts this
 * once it has also seen the neutral file sitting next to it.
 */
const cultureTagPattern = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

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
     * Splits a resx file name, or returns undefined when it is not a resx at
     * all. The culture is only a candidate - see {@link cultureTagPattern}.
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
        if (cultureTagPattern.test(candidate) === false) {
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

    public get fileName(): string {
        return ResxFileName.toFileName(this.baseName, this.culture);
    }
}
