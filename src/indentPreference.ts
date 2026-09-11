import * as vscode from "vscode";
import { Constants } from "./constants";
import { SettingKey } from "./settingKey";

const defaultTabSize = 4;
const tab = "\t";

/** The indent for a resx with none of its own to copy: a new file, or one with no indentation at all. */
export class IndentPreference {
    /** @param uri the resx being written, so a folder or language override applies. */
    public static resolve(uri: vscode.Uri | undefined): string {
        const explicitSpaceLength = IndentPreference.explicitSpaceLength(uri);
        if (explicitSpaceLength !== undefined) {
            return " ".repeat(explicitSpaceLength);
        }

        const editorConfiguration = vscode.workspace.getConfiguration(Constants.editor, uri);
        if (editorConfiguration.get<boolean>("insertSpaces") === false) {
            return tab;
        }

        return " ".repeat(editorConfiguration.get<number>("tabSize") ?? defaultTabSize);
    }

    /*
     * Deprecated, but still honoured where a user set it deliberately. inspect() rather
     * than get(), because get() returns the contributed default of 4 and would outrank
     * the editor for everybody. Delete this when the setting goes.
     */
    private static explicitSpaceLength(uri: vscode.Uri | undefined): number | undefined {
        const inspected = vscode.workspace
                                .getConfiguration(`${Constants.resxpress}.${Constants.configuration}`, uri)
                                .inspect<number>(SettingKey.indentSpaceLength);

        return inspected?.workspaceFolderValue ?? inspected?.workspaceValue ?? inspected?.globalValue;
    }
}
