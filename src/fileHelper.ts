import * as vscode from "vscode";
import path = require("path");
import { writeFile } from "fs/promises";
import { readFileSync } from "fs";

export class FileHelper {
    public static getFileName(): (string | null) {
        if (vscode.window.activeTextEditor?.document) {
            let parsedPath = path.parse(vscode.window.activeTextEditor.document.fileName);
            var fileName = parsedPath.name;
            return fileName;
        }
        return null;
    }

    public static getDirectory(): (string | null) {
        if (vscode.window.activeTextEditor?.document) {
            let parsedPath = path.parse(vscode.window.activeTextEditor.document.fileName);
            return parsedPath.dir
        }
        return null;
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
            await writeFile(filePath, text);
        }
    }

    public static async tryGetNamespace(): Promise<string | null> {
        try {
            let fileName = FileHelper.getFileName();
            var namespace = "Unknown";
            if (fileName != null && fileName != "") {
                let fileUrls = await vscode.workspace.findFiles(`**/${fileName}.Designer.cs`, null, 1);
                

                if (fileUrls.length > 0) {
                    const fileContent = readFileSync(fileUrls[0].fsPath, "utf-8");

                    if (fileContent && fileContent != "") {
                        var lines = fileContent.split("\r\n");
                        if (lines.length == 1) {
                            lines = fileContent.split("\n");
                        }
                        var newLines = lines.filter(x => x.startsWith("namespace ")).map(x => x.trim().replace("namespace ", "").replace(" ", "").replace("{", ""));
                        if (newLines.length > 0) {
                            namespace = newLines[0];
                            return namespace;
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
}
