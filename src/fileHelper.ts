import * as vscode from "vscode";
import path = require("path");

export class FileHelper {
    public static getFileName(): (string | null) {
        if (vscode.window.activeTextEditor?.document){
            let parsedPath = path.parse(vscode.window.activeTextEditor.document.fileName);

            let document = vscode.window.activeTextEditor.document;
            var fileName = parsedPath.name;
            return fileName;
        }
        return null;
    }

    /**
     * static getActiveDocumentText
     */
    public static getActiveDocumentText() : string {
        var text = "";
        if (vscode.window.activeTextEditor?.document){
            text = vscode.window.activeTextEditor.document.getText();
        }
        return text;
    }

}
