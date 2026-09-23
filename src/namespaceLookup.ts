import { ResxFileName } from "./resxFileName";

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
}
