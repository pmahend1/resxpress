import * as vscode from "vscode";
import path = require("path");
import { readFile, writeFile } from "fs/promises";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { Constants, emptyString } from "./constants";
import { Logger } from "./logger";
import { NamespaceLookup } from "./namespaceLookup";
import { ResxGroup } from "./resxGroup";

/** What the editor shows when neither lookup answers. */
const unknownNamespace = "Unknown";

const namespaceKeyword = "namespace ";

export class FileHelper {

    public static getFileNameNoExt(document: vscode.TextDocument): string {
        let parsedPath = path.parse(document.fileName);
        var fileName = parsedPath.name;
        return fileName;
    }

    public static getDirectory(document: vscode.TextDocument): string {
        let parsedPath = path.parse(document.fileName);
        return parsedPath.dir;
    }

    public static async writeToFile(filePath: string, text: string) {
        if (filePath !== emptyString) {
            const dir = path.dirname(filePath);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
            await writeFile(filePath, text);
        }
    }

    /**
     * The namespace for a resx, from `.resxpress/namespace-mapping.json` first
     * and a sibling `Designer.cs` second, under each of
     * {@link NamespaceLookup.candidates}. Returns {@link unknownNamespace} when
     * neither answers, and null when the lookup itself failed.
     */
    public static async tryGetNamespace(document: vscode.TextDocument): Promise<string | null> {
        try {
            const fileNameNoExt = FileHelper.getFileNameNoExt(document);
            if (fileNameNoExt.length === 0) {
                return unknownNamespace;
            }

            const neutralBaseName = await FileHelper.tryGetNeutralBaseName(document.uri);
            const candidates = NamespaceLookup.candidates(fileNameNoExt, neutralBaseName);

            return await FileHelper.fromNamespaceMapping(document.uri, candidates)
                ?? await FileHelper.fromDesignerFile(candidates)
                ?? unknownNamespace;
        } catch (error) {
            if (error instanceof Error) {
                Logger.instance.error(error);
            }
            return null;
        }
    }

    public static async getFileText(filepath: string): Promise<string> {
        if (existsSync(filepath)) {
            let content = await readFile(filepath, { encoding: "utf-8" });
            return content;
        }
        return emptyString;
    }

    /**
     * `ResxGroup` owns the rule that a dotted segment only names a culture when
     * the neutral file is there to be a variant of, so the base name it reports
     * is the neutral spelling on disk or the whole file name - never a guess.
     */
    private static async tryGetNeutralBaseName(uri: vscode.Uri): Promise<string> {
        try {
            return (await ResxGroup.resolve(uri)).baseName;
        } catch (error) {
            if (error instanceof Error) {
                Logger.instance.warning(error.message);
            }
            return emptyString;
        }
    }

    private static async fromNamespaceMapping(uri: vscode.Uri, candidates: string[]): Promise<string | undefined> {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (workspaceFolder === undefined) {
            return undefined;
        }

        const mappingPath = path.join(workspaceFolder.uri.fsPath, `.${Constants.namespaceMappingJsonPath}`);
        const content = await FileHelper.getFileText(mappingPath);
        if (content.length === 0) {
            return undefined;
        }

        try {
            const mapping = JSON.parse(content) as Record<string, string> | null;
            if (mapping === null) {
                return undefined;
            }

            for (const candidate of candidates) {
                const mapped = mapping[candidate];
                if (typeof mapped === "string" && mapped.length > 0) {
                    return mapped;
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                Logger.instance.error(error);
            }
        }

        return undefined;
    }

    private static async fromDesignerFile(candidates: string[]): Promise<string | undefined> {
        // With two candidates the walk cannot stop at the first hit, which may be the less specific one.
        const maxResults = candidates.length === 1 ? 1 : undefined;
        const fileUris = await vscode.workspace.findFiles(NamespaceLookup.designerFileGlob(candidates), null, maxResults);

        for (const candidate of candidates) {
            const fileUri = fileUris.find(uri => NamespaceLookup.isDesignerFileOf(candidate, path.basename(uri.fsPath)));
            if (fileUri === undefined) {
                continue;
            }

            const namespace = FileHelper.readNamespaceDeclaration(readFileSync(fileUri.fsPath, "utf-8"));
            if (namespace !== undefined) {
                return namespace;
            }
        }

        return undefined;
    }

    /** The first `namespace Foo` line of a C# file, block or file scoped. */
    private static readNamespaceDeclaration(fileContent: string): string | undefined {
        if (fileContent.length === 0) {
            return undefined;
        }

        var lines = fileContent.split("\r\n");
        if (lines.length === 1) {
            lines = fileContent.split("\n");
        }

        const declarations = lines.filter(line => line.startsWith(namespaceKeyword))
                                  .map(line => line.trim()
                                                   .replace(namespaceKeyword, emptyString)
                                                   .replace(/[\s{;}]/g, emptyString));

        return declarations.length > 0 ? declarations[0] : undefined;
    }
}
