import * as vscode from "vscode";
import { emptyString } from "./constants";
import { Logger } from "./logger";
import { computeMinimalTextEdit } from "./minimalTextEdit";
import { nameof } from "./nameof";
import type { ResxEntry } from "./resxEntry";
import { ResxFile } from "./resxFile";
import { Settings } from "./settings";

/**
 * Writes resx changes back to a document as the smallest edit that produces
 * them, so an edit shows up in a diff as the lines it touched and nothing more.
 */
export class ResxDocumentWriter {
    public static async applyEntries(document: vscode.TextDocument, entries: ResxEntry[]): Promise<boolean> {
        return ResxDocumentWriter.rewrite(document, resxFile => resxFile.applyEntries(entries));
    }

    public static async sortByKey(document: vscode.TextDocument): Promise<boolean> {
        return ResxDocumentWriter.rewrite(document, resxFile => resxFile.sortEntriesByKey());
    }

    private static async rewrite(document: vscode.TextDocument, change: (resxFile: ResxFile) => void): Promise<boolean> {
        try {
            const currentText = document.getText();
            const resxFile = ResxFile.parse(currentText, Settings.indentSpaceLength);
            change(resxFile);
            return await ResxDocumentWriter.write(document, currentText, resxFile.toXml());
        }
        catch (error) {
            let errorMessage = emptyString;
            if (error instanceof Error) {
                Logger.instance.error(error);
                errorMessage = error.message;
            }
            else if (typeof error === "string") {
                errorMessage = error;
            }
            vscode.window.showErrorMessage(errorMessage);
            return false;
        }
    }

    private static async write(document: vscode.TextDocument, currentText: string, newText: string): Promise<boolean> {
        const minimalEdit = computeMinimalTextEdit(currentText, newText);

        // Opening a file and moving around it must not be enough to mark it dirty.
        if (minimalEdit === undefined) {
            Logger.instance.info(`${nameof(ResxDocumentWriter)}.${nameof(this.write)}: document already up to date`);
            return true;
        }

        const range = new vscode.Range(document.positionAt(minimalEdit.start), document.positionAt(minimalEdit.end));
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, range, minimalEdit.newText);
        return vscode.workspace.applyEdit(edit);
    }
}
