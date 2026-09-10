import * as path from "path";
import * as vscode from "vscode";
import { emptyString } from "./constants";
import { ResxFileName } from "./resxFileName";
import { ResxGroupFile } from "./resxGroupFile";

const notAResxFile = (fileName: string) => `${fileName} is not a resx file`;

/**
 * Every culture variant of one resource - `Foo.resx`, `Foo.de.resx`,
 * `Foo.fr.resx` - resolved from any one of them. Names are matched
 * case-insensitively; see {@link ResxFileName.sameBaseName}.
 */
export class ResxGroup {
    /** The neutral file's spelling when there is one, since it is the key authority. */
    public readonly baseName: string;

    public readonly directory: vscode.Uri;

    /** Neutral first, then alphabetical. */
    public readonly cultures: string[];

    /** Keyed by {@link ResxFileName.cultureKey}, not by the culture as spelled. */
    private readonly filesByCulture: Map<string, ResxGroupFile>;

    private constructor(baseName: string, directory: vscode.Uri, filesByCulture: Map<string, ResxGroupFile>) {
        this.baseName = baseName;
        this.directory = directory;
        this.filesByCulture = filesByCulture;
        this.cultures = Array.from(filesByCulture.values(), file => file.culture).sort(ResxFileName.compareCultures);
    }

    /**
     * @throws when the uri is not a resx file.
     */
    public static async resolve(uri: vscode.Uri): Promise<ResxGroup> {
        const fileName = path.posix.basename(uri.path);
        const parsed = ResxFileName.parse(fileName);
        if (parsed === undefined) {
            throw new Error(notAResxFile(fileName));
        }

        const directory = uri.with({ path: path.posix.dirname(uri.path) });
        const siblings = await ResxGroup.findSiblings(directory, parsed.baseName, fileName);

        /*
         * A dotted segment only names a culture if the neutral file is actually
         * there to be a variant of. Without this check `My.App.resx` would read
         * as the culture "App" of a resource "My" that does not exist, and the
         * panel would go looking for siblings of a made up base name.
         */
        if (parsed.culture.length > 0 && await ResxGroup.hasNeutral(siblings, directory, parsed.baseName) === false) {
            const standalone = ResxFileName.neutral(`${parsed.baseName}.${parsed.culture}`);
            const only = new Map([[ResxFileName.cultureKey(standalone.culture), new ResxGroupFile(standalone, uri)]]);
            return new ResxGroup(standalone.baseName, directory, only);
        }

        // The file the command was invoked on belongs even if the listing failed.
        siblings.set(ResxFileName.cultureKey(parsed.culture), new ResxGroupFile(parsed, uri));

        return new ResxGroup(ResxGroup.neutralOf(siblings)?.name.baseName ?? parsed.baseName, directory, siblings);
    }

    public uriFor(culture: string): vscode.Uri | undefined {
        return this.filesByCulture.get(ResxFileName.cultureKey(culture))?.uri;
    }

    /** The name on disk, which case folding means is not always the group's own spelling. */
    public fileNameFor(culture: string): string {
        return this.filesByCulture.get(ResxFileName.cultureKey(culture))?.fileName
            ?? ResxFileName.toFileName(this.baseName, culture);
    }

    /**
     * A file that resolves back to this same group - the neutral one, since the
     * cultures sort with it first. The panel persists it for restore.
     */
    public get anchorUri(): vscode.Uri | undefined {
        return this.uriFor(this.cultures[0]);
    }

    /**
     * Identifies the group, so one resource never opens two panels. Folded:
     * `Resources.de.resx` and `resources.resx` resolve to the same group.
     */
    public get key(): string {
        return vscode.Uri.joinPath(this.directory, this.baseName.toLowerCase()).toString();
    }

    /** The variants of one resource in `directory`, keyed by culture. */
    private static async findSiblings(directory: vscode.Uri,
                                      baseName: string,
                                      resolvedFrom: string): Promise<Map<string, ResxGroupFile>> {
        const siblings = new Map<string, ResxGroupFile>();

        for (const [entryName, fileType] of await ResxGroup.readDirectory(directory)) {
            if ((fileType & vscode.FileType.File) === 0) {
                continue;
            }

            const sibling = ResxFileName.parse(entryName);
            if (sibling === undefined || ResxFileName.sameBaseName(sibling.baseName, baseName) === false) {
                continue;
            }

            const cultureKey = ResxFileName.cultureKey(sibling.culture);
            const chosen = siblings.get(cultureKey);
            if (chosen !== undefined && ResxFileName.compareSpellings(entryName, chosen.fileName, resolvedFrom) > 0) {
                continue;
            }

            siblings.set(cultureKey, new ResxGroupFile(sibling, vscode.Uri.joinPath(directory, entryName)));
        }

        return siblings;
    }

    /* The listing answers alike everywhere; `fs.stat` only when it failed. */
    private static async hasNeutral(siblings: Map<string, ResxGroupFile>,
                                    directory: vscode.Uri,
                                    baseName: string): Promise<boolean> {
        if (siblings.size > 0) {
            return ResxGroup.neutralOf(siblings) !== undefined;
        }

        return await ResxGroup.exists(vscode.Uri.joinPath(directory, ResxFileName.toFileName(baseName, emptyString)));
    }

    private static neutralOf(siblings: Map<string, ResxGroupFile>): ResxGroupFile | undefined {
        return siblings.get(ResxFileName.cultureKey(emptyString));
    }

    private static async exists(uri: vscode.Uri): Promise<boolean> {
        try {
            await vscode.workspace.fs.stat(uri);
            return true;
        }
        catch {
            return false;
        }
    }

    private static async readDirectory(directory: vscode.Uri): Promise<[string, vscode.FileType][]> {
        try {
            return await vscode.workspace.fs.readDirectory(directory);
        }
        catch {
            return [];
        }
    }
}
