import * as vscode from "vscode";
import path = require("path");
import { readFile, writeFile } from "fs/promises";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { resxpress } from "./extension";


export class FileHelper {

    public static getFileNameNoExt(document: vscode.TextDocument): string {
        let parsedPath = path.parse(document.fileName);
        var fileName = parsedPath.name;
        return fileName;
    }

    public static getDirectory(document: vscode.TextDocument): string {
        let parsedPath = path.parse(document.fileName);
        return parsedPath.dir
    }

    public static getActiveDocumentText(): string {
        var text = "";
        if (vscode.window.activeTextEditor?.document) {
            text = vscode.window.activeTextEditor.document.getText();
        }
        return text;
    }

    public static async writeToFile(filePath: string, text: string) {
        if (filePath != "") {
            const dir = path.dirname(filePath);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
            await writeFile(filePath, text);
        }
    }

    public static async tryGetNamespace(document: vscode.TextDocument): Promise<string | null> {
        try {
            var namespace = "Unknown";
            let fileNameNoExt = FileHelper.getFileNameNoExt(document);
            let workspacePath = vscode.workspace.getWorkspaceFolder(document.uri);
            if (workspacePath) {
                let pathToRead = path.join(workspacePath.uri.fsPath, `.${resxpress}/namespace-mapping.json`);
                let content = await this.getFileText(pathToRead);
                if (content.length > 0) {
                    try {
                        var namespaceMappingRec = JSON.parse(content);
                        if (namespaceMappingRec && fileNameNoExt && namespaceMappingRec[fileNameNoExt]) {
                            namespace = namespaceMappingRec[fileNameNoExt];
                        }
                    } catch (error) {
                        if (error instanceof Error) {
                            console.log(error.message);
                        }
                    }
                }
            }
            if ((namespace === "Unknown" || namespace.length === 0) && fileNameNoExt.length > 0) {
                let fileUrls = await vscode.workspace.findFiles(`**/${fileNameNoExt}.Designer.cs`, null, 1);

                if (fileUrls.length > 0) {
                    const fileContent = readFileSync(fileUrls[0].fsPath, "utf-8");

                    if (fileContent && fileContent.length > 0) {
                        var lines = fileContent.split("\r\n");
                        if (lines.length == 1) {
                            lines = fileContent.split("\n");
                        }
                        var newLines = lines.filter(x => x.startsWith("namespace ")).map(x => x.trim().replace("namespace ", "").replace(" ", "").replace("{", ""));
                        if (newLines.length > 0) {
                            namespace = newLines[0];
                        }
                    }
                }
            }
            return namespace;

        } catch (error) {
            if (error instanceof Error) {
                console.log(error.message);
            }
            return null;
        }
    }

    public static async getFileText(filepath: string): Promise<string> {
        if (existsSync(filepath)) {
            let content = await readFile(filepath, { encoding: "utf-8" });
            return content;
        }
        return "";
    }
}
