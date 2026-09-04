import * as vscode from "vscode";
import { Constants, emptyString } from "./constants";
import { setNewNamespace, sortByKeys } from "./extension";
import { FileHelper } from "./fileHelper";
import { Logger } from "./logger";
import { ResxDocumentWriter } from "./resxDocumentWriter";
import { ResxEditor } from "./resxEditor";
import type { ResxEntry } from "./resxEntry";
import { ResxFile } from "./resxFile";
import { Settings } from "./settings";
import { WebpanelPostMessageKind } from "./webpanelMessageKind";
import { WebpanelPostMessage } from "./webpanelPostMessage";

export class ResxEditorProvider implements vscode.CustomTextEditorProvider {

    private readonly context: vscode.ExtensionContext;
    private readonly resxEditor: ResxEditor;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.resxEditor = new ResxEditor(this.context);
    }

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new ResxEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(`${Constants.resxpress}.${Constants.editor}`, provider);
        return providerRegistration;
    }

    /**
     * Called when our custom editor is opened.
     */
    public async resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, _token: vscode.CancellationToken): Promise<void> {
        // Setup initial content for the webview
        webviewPanel.webview.options = {
            enableScripts: true,
            enableForms: true,
        };

        if (_token.isCancellationRequested) {
            return;
        }
        const namespace = await FileHelper.tryGetNamespace(document);
        webviewPanel.webview.html = this.resxEditor.getHtmlForWebview(webviewPanel.webview, namespace ?? emptyString);

        let isWritingWebviewEdit = false;

        // Receive message from the webview.
        let webviewListener = webviewPanel.webview.onDidReceiveMessage(async (e) => {
            Logger.instance.info(`webviewPanel.webview.onDidReceiveMessage: ${JSON.stringify(e)}`);
            switch (e.type) {
                case WebpanelPostMessageKind.Ready:
                    updateWebview();
                    break;
                case WebpanelPostMessageKind.TriggerTextDocumentUpdate: {
                    const entries = JSON.parse(e.text) as ResxEntry[];
                    isWritingWebviewEdit = true;
                    try {
                        await ResxDocumentWriter.applyEntries(document, entries);
                    }
                    finally {
                        isWritingWebviewEdit = false;
                    }
                    break;
                }
                case WebpanelPostMessageKind.Switch:
                    vscode.window.showTextDocument(document, vscode.ViewColumn.Active);
                    break;
                case WebpanelPostMessageKind.TriggerNamespaceUpdate:
                    let newNamespace = await setNewNamespace(document);
                    if (newNamespace !== undefined && newNamespace.length > 0) {
                        setNewNamespaceInWebview(newNamespace);
                    }
                    break;
                case WebpanelPostMessageKind.SortByKeys:
                    await sortByKeys(document);
                    updateWebview();
                    break;
            }
        });

        /*
         * Without this the webview and the file diverge as soon as the same
         * resx is touched in a text editor, and the next keystroke in the
         * webview writes the stale copy back over it.
         */
        let documentListener = vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.uri.toString() !== document.uri.toString() || event.contentChanges.length === 0) {
                return;
            }
            if (isWritingWebviewEdit) {
                return;
            }
            updateWebview();
        });

        function setNewNamespaceInWebview(newNamespace: string) {
            webviewPanel.webview.postMessage(new WebpanelPostMessage(WebpanelPostMessageKind.NewNamespace, newNamespace));
        }

        function updateWebview() {
            try {
                const entries = ResxFile.parse(document.getText(), Settings.indentSpaceLength).entries;
                webviewPanel.webview.postMessage(new WebpanelPostMessage(WebpanelPostMessageKind.UpdateWebPanel, JSON.stringify(entries)));
            }
            catch (error) {
                // A resx being edited as text is invalid XML for as long as a tag is half typed.
                if (error instanceof Error) {
                    Logger.instance.warning(`${WebpanelPostMessageKind.UpdateWebPanel} skipped: ${error.message}`);
                }
            }
        }

        // Make sure we get rid of the listeners when our editor is closed.
        webviewPanel.onDidDispose(() => {
            webviewListener.dispose();
            documentListener.dispose();
        });

        updateWebview();
    }
}
