import * as vscode from "vscode";
import { CommandId } from "./commandId";
import { Constants, emptyString } from "./constants";
import { setNewNamespace, sortByKeys } from "./extension";
import { FileHelper } from "./fileHelper";
import { IndentPreference } from "./indentPreference";
import { Logger } from "./logger";
import { ResxDocumentWriter } from "./resxDocumentWriter";
import { ResxEditor } from "./resxEditor";
import type { ResxEntry } from "./resxEntry";
import { ResxFile } from "./resxFile";
import { ResxGroup } from "./resxGroup";
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
        const resolveStarted = Date.now();

        /*
         * Not awaited before the HTML: without a mapping entry the lookup walks the
         * workspace, and the tab stayed blank for as long as that took. The shell
         * shows a spinner in its place until postNamespace answers it.
         */
        let namespace = FileHelper.tryGetNamespace(document).then(resolved => {
            Logger.instance.info(`Namespace resolved ${Date.now() - resolveStarted} ms after resolve`);
            return resolved ?? emptyString;
        });

        const hasCultureSiblings = await ResxEditorProvider.hasCultureSiblings(document.uri);
        webviewPanel.webview.html = this.resxEditor.getHtmlForWebview(webviewPanel.webview, hasCultureSiblings);

        let isWritingWebviewEdit = false;

        // Receive message from the webview.
        let webviewListener = webviewPanel.webview.onDidReceiveMessage(async (e) => {
            Logger.instance.info(`webviewPanel.webview.onDidReceiveMessage: ${JSON.stringify(e)}`);
            switch (e.type) {
                case WebpanelPostMessageKind.Ready:
                    Logger.instance.info(`Webview ready ${Date.now() - resolveStarted} ms after resolve`);
                    updateWebview();
                    postNamespace();
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
                        namespace = Promise.resolve(newNamespace);
                        setNewNamespaceInWebview(newNamespace);
                    }
                    break;
                case WebpanelPostMessageKind.SortByKeys:
                    await sortByKeys(document);
                    updateWebview();
                    break;
                case WebpanelPostMessageKind.OpenAllLanguages:
                    await vscode.commands.executeCommand(CommandId.combinedEditor, document.uri);
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

        /*
         * On every Ready, since a webview rebuilt after its tab was hidden comes back
         * with the spinner in its HTML. A lookup overtaken by Change Namespace is dropped.
         */
        function postNamespace() {
            const pending = namespace;
            pending.then(resolved => {
                if (pending === namespace) {
                    setNewNamespaceInWebview(resolved);
                }
            });
        }

        function updateWebview() {
            try {
                const parseStarted = Date.now();
                const entries = ResxFile.parse(document.getText(), IndentPreference.resolve(document.uri)).entries;
                webviewPanel.webview.postMessage(new WebpanelPostMessage(WebpanelPostMessageKind.UpdateWebPanel, JSON.stringify(entries)));
                Logger.instance.info(`Parsed and posted ${entries.length} entries in ${Date.now() - parseStarted} ms`);
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

    /* Whether this resource has more than the one file, and so anything to combine. */
    public static async hasCultureSiblings(uri: vscode.Uri): Promise<boolean> {
        try {
            return (await ResxGroup.resolve(uri)).cultures.length > 1;
        }
        catch (error) {
            if (error instanceof Error) {
                Logger.instance.warning(error.message);
            }

            return false;
        }
    }
}
