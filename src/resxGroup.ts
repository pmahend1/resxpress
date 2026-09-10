import * as path from "path";
import * as vscode from "vscode";
import { emptyString } from "./constants";
import { ResxFileName } from "./resxFileName";

const notAResxFile = (fileName: string) => `${fileName} is not a resx file`;

/**
 * Every culture variant of one resource - `Foo.resx`, `Foo.de.resx`,
 * `Foo.fr.resx` - resolved from any one of them.
 */
export class ResxGroup {
    public readonly baseName: string;
    public readonly directory: vscode.Uri;

    /** Neutral first, then alphabetical. */
    public readonly cultures: string[];

    private readonly filesByCulture: Map<string, vscode.Uri>;

    private constructor(baseName: string, directory: vscode.Uri, filesByCulture: Map<string, vscode.Uri>) {
        this.baseName = baseName;
        this.directory = directory;
        this.filesByCulture = filesByCulture;
        this.cultures = Array.from(filesByCulture.keys()).sort(ResxFileName.compareCultures);
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

        /*
         * A dotted segment only names a culture if the neutral file is actually
         * there to be a variant of. Without this check `My.App.resx` would read
         * as the culture "App" of a resource "My" that does not exist, and the
         * panel would go looking for siblings of a made up base name.
         */
        const neutralUri = vscode.Uri.joinPath(directory, ResxFileName.toFileName(parsed.baseName, emptyString));
        if (parsed.culture.length > 0 && await ResxGroup.exists(neutralUri) === false) {
            const standalone = ResxFileName.neutral(`${parsed.baseName}.${parsed.culture}`);
            return new ResxGroup(standalone.baseName, directory, new Map([[standalone.culture, uri]]));
        }

        const filesByCulture = new Map<string, vscode.Uri>();
        for (const [entryName, fileType] of await ResxGroup.readDirectory(directory)) {
            if ((fileType & vscode.FileType.File) === 0) {
                continue;
            }

            const sibling = ResxFileName.parse(entryName);
            if (sibling === undefined || sibling.baseName !== parsed.baseName) {
                continue;
            }

            filesByCulture.set(sibling.culture, vscode.Uri.joinPath(directory, entryName));
        }

        // The file the command was invoked on belongs even if the listing failed.
        filesByCulture.set(parsed.culture, uri);

        return new ResxGroup(parsed.baseName, directory, filesByCulture);
    }

    public uriFor(culture: string): vscode.Uri | undefined {
        return this.filesByCulture.get(culture);
    }

    public fileNameFor(culture: string): string {
        return ResxFileName.toFileName(this.baseName, culture);
    }

    /** Identifies the group, so one resource never opens two panels. */
    public get key(): string {
        return vscode.Uri.joinPath(this.directory, this.baseName).toString();
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
