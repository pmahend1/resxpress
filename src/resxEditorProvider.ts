import * as vscode from 'vscode';
import { ResxJsonHelper } from './ResxJsonHelper';
import { ResxEditor } from './resxEditor';

/**
 * Provider for Resx editors.
 * 
 * Resx editors are used for `.resx` files, which are just json files.
 * To get started, run this extension and open an empty `.resx` file in VS Code.
 * 
 * This provider demonstrates:
 * 
 * - Setting up the initial webview for a custom editor.
 * - Loading scripts and styles in a custom editor.
 * - Synchronizing changes between a text document and a custom editor.
 */
export class ResxEditorProvider implements vscode.CustomTextEditorProvider {

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new ResxEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(ResxEditorProvider.viewType, provider);
        return providerRegistration;
    }

    private readonly context: vscode.ExtensionContext;

    private static readonly viewType = 'resxpress.editor';
    private readonly resxEditor: ResxEditor;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.resxEditor = new ResxEditor(this.context);
    }

    /**
     * Called when our custom editor is opened.
     */
    public async resolveCustomTextEditor(document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken): Promise<void> {
        // Setup initial content for the webview
        webviewPanel.webview.options = {
            enableScripts: true,
        };

        webviewPanel.webview.html = this.resxEditor.getHtmlForWebview(webviewPanel.webview);

        function updateWebview() {

            var jsonText = JSON.stringify(ResxJsonHelper.getJsonData(document.getText()));
            webviewPanel.webview.postMessage({
                type: 'update',
                text: jsonText
            });

        }

        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === document.uri.toString()) {
                updateWebview();
            }
        });

        // Make sure we get rid of the listener when our editor is closed.
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });

        // Receive message from the webview.
        webviewPanel.webview.onDidReceiveMessage(e => {
            switch (e.type) {
                case 'update':
                    this.resxEditor.updateTextDocument(document, e.json);
                    return;
                case 'add':
                    this.resxEditor.addNewKeyValue(document, e.json);
                    return;

                case 'delete':
                    this.resxEditor.deleteKeyValue(document, e.json);
                    return;
            }
        });

        updateWebview();
    }

    content: string = '';
    /**
     * Get the static html used for the editor webviews.
     */

}
