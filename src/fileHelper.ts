import * as vscode from "vscode";
import path = require("path");
import { writeFile } from "fs/promises";

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
}
