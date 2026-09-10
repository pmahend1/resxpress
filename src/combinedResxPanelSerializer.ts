import * as vscode from "vscode";
import { CombinedResxPanel } from "./combinedResxPanel";
import { Logger } from "./logger";

/**
 * Brings the combined panel back after a reload. With nothing claiming the view
 * type, VS Code restores the tab and finds nobody to fill it.
 */
export class CombinedResxPanelSerializer implements vscode.WebviewPanelSerializer {

    private readonly extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri) {
        this.extensionUri = extensionUri;
    }

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        return vscode.window.registerWebviewPanelSerializer(CombinedResxPanel.viewType,
                                                            new CombinedResxPanelSerializer(context.extensionUri));
    }

    public async deserializeWebviewPanel(panel: vscode.WebviewPanel, state: unknown): Promise<void> {
        const groupUri = CombinedResxPanelSerializer.groupUriFrom(state);
        if (groupUri === undefined) {
            panel.dispose();
            return;
        }

        try {
            await CombinedResxPanel.revive(this.extensionUri, panel, groupUri);
        }
        catch (error) {
            /*
             * Renamed or deleted while the window was closed, or state left by
             * an older version. Closing the tab is the honest outcome.
             */
            if (error instanceof Error) {
                Logger.instance.warning(error.message);
            }

            panel.dispose();
        }
    }

    /* Written by the webview and outlives an upgrade, so it is read, not cast. */
    private static groupUriFrom(state: unknown): vscode.Uri | undefined {
        const groupUri = (state as { groupUri?: unknown } | null | undefined)?.groupUri;
        if (typeof groupUri !== "string" || groupUri.length === 0) {
            return undefined;
        }

        try {
            return vscode.Uri.parse(groupUri, true);
        }
        catch {
            return undefined;
        }
    }
}
