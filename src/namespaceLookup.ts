import { ResxFileName } from "./resxFileName";

const designerSuffix = ".Designer.cs";

/* `[x]` is a literal x to VS Code's matcher and ripgrep's; a lone `]` already is, and `[]]` is not. */
const globSpecial = /[*?[{},]/g;

/**
 * The names a resx's namespace is looked up under, most specific first.
 *
 * A culture file has no `Designer.cs` and is rarely in `namespace-mapping.json`,
 * so under its own name both lookups miss and the editor shows `Unknown`.
 */
export class NamespaceLookup {
    /** `neutralBaseName` is shorter only when `ResxGroup` really found a neutral sibling. */
    public static candidates(fileNameNoExt: string, neutralBaseName: string): string[] {
        if (neutralBaseName.length === 0 || ResxFileName.sameBaseName(neutralBaseName, fileNameNoExt)) {
            return [fileNameNoExt];
        }

        return [fileNameNoExt, neutralBaseName];
    }

    /**
     * One glob for every candidate, so the workspace is walked once. A culture
     * file's own name never has a Designer.cs, and searching it on its own was
     * a full walk that always missed before the neutral name was tried.
     */
    public static designerFileGlob(candidates: string[]): string {
        const names = candidates.map(candidate => candidate.replace(globSpecial, "[$&]"));
        const name = names.length === 1 ? names[0] : `{${names.join(",")}}`;
        return `**/${name}${designerSuffix}`;
    }

    /** Folded, because the glob may match either spelling on a case-insensitive filesystem. */
    public static isDesignerFileOf(candidate: string, fileName: string): boolean {
        if (fileName.toLowerCase().endsWith(designerSuffix.toLowerCase()) === false) {
            return false;
        }

        return ResxFileName.sameBaseName(fileName.slice(0, -designerSuffix.length), candidate);
    }
}
