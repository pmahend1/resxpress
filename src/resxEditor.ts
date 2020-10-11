import * as path from 'path';
import * as vscode from 'vscode';
import { getNonce } from './util';

/**
 * Provider for cat scratch editors.
 * 
 * Cat scratch editors are used for `.cscratch` files, which are just json files.
 * To get started, run this extension and open an empty `.cscratch` file in VS Code.
 * 
 * This provider demonstrates:
 * 
 * - Setting up the initial webview for a custom editor.
 * - Loading scripts and styles in a custom editor.
 * - Synchronizing changes between a text document and a custom editor.
 */
export class ResxEditorProvider implements vscode.CustomTextEditorProvider
{

    public static register(context: vscode.ExtensionContext): vscode.Disposable
    {
        const provider = new ResxEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(ResxEditorProvider.viewType, provider);
        return providerRegistration;
    }

    private static readonly viewType = 'resx.editor';

    // private static readonly scratchCharacters = ['😸', '😹', '😺', '😻', '😼', '😽', '😾', '🙀', '😿', '🐱'];

    constructor(
        private readonly context: vscode.ExtensionContext
    ) { }

    /**
     * Called when our custom editor is opened.
     * 
     * 
     */
    public async resolveCustomTextEditor(
        document: vscode.TextDocument,
        webviewPanel: vscode.WebviewPanel,
        _token: vscode.CancellationToken
    ): Promise<void>
    {
        // Setup initial content for the webview
        webviewPanel.webview.options = {
            enableScripts: true,
        };
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        function updateWebview()
        {
            webviewPanel.webview.postMessage({
                type: 'update',
                text: document.getText(),
            });
        }

        // Hook up event handlers so that we can synchronize the webview with the text document.
        //
        // The text document acts as our model, so we have to sync change in the document to our
        // editor and sync changes in the editor back to the document.
        // 
        // Remember that a single text document can also be shared between multiple custom
        // editors (this happens for example when you split a custom editor)

        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e =>
        {
            if (e.document.uri.toString() === document.uri.toString())
            {
                updateWebview();
            }
        });

        // Make sure we get rid of the listener when our editor is closed.
        webviewPanel.onDidDispose(() =>
        {
            changeDocumentSubscription.dispose();
        });

        // Receive message from the webview.
        webviewPanel.webview.onDidReceiveMessage(e =>
        {
            switch (e.type)
            {
                case 'add':
                    this.addNewKeyValue(document);
                    return;

                case 'delete':
                    this.deleteKeyValue(document, e.id);
                    return;
            }
        });

        updateWebview();
    }

    /**
     * Get the static html used for the editor webviews.
     */
    private getHtmlForWebview(webview: vscode.Webview): string
    {
        // Local path to script and css for the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'media', 'catScratch.js')
        ));
        const styleUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'media', 'catScratch.css')
        ));

        // Use a nonce to whitelist which scripts can be run
        const nonce = getNonce();

        return /* html */`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleUri}" rel="stylesheet" />
				<title>ResxFileName</title>
			</head>
			<body>
				<div class="notes">
					<div class="add-button">
						<button>Scratch!</button>
					</div>
				</div>
				
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }

    /**
     * Add a new scratch to the current document.
     */
    private addNewKeyValue(document: vscode.TextDocument)
    {
        const json = this.getDocumentAsJson(document);
        //const character = ResxEditorProvider.scratchCharacters[Math.floor(Math.random() * ResxEditorProvider.scratchCharacters.length)];
        // json.scratches = [
        //     ...(Array.isArray(json.scratches) ? json.scratches : []),
        //     {
        //         id: getNonce(),
        //         text: character,
        //         created: Date.now(),
        //     }
        // ];

        //get new key value comment
        //append to document
        var newKVC = {
            keyObj: {
                value: "key_",
                xml_space: "preserve"
            },
            valueObj: {
                value: "value",
                comment: "comment"
            }
        };
        return this.updateTextDocument(document, newKVC);
    }

    /**
     * Delete an existing scratch from a document.
     */
    private deleteKeyValue(document: vscode.TextDocument, id: string)
    {
       // const json = this.getDocumentAsJson(document);
        // if (!Array.isArray(json.scratches))
        // {
        //     return;
        // }

       // json.scratches = json.scratches.filter((note: any) => note.id !== id);
       var newKVC = {
        keyObj: {
            value: "key_",
            xml_space: "preserve"
        },
        valueObj: {
            value: "value",
            comment: "comment"
        }
    };
        return this.updateTextDocument(document, newKVC);
    }

    /**
     * Try to get a current document as json text.
     */
    private getDocumentAsJson(document: vscode.TextDocument): any
    {
        const text = document.getText();
        if (text.trim().length === 0)
        {
            return {};
        }

        try
        {
            return JSON.parse(text);
        } catch {
            throw new Error('Could not get document as json. Content is not valid json');
        }
    }

    /**
     * Write out the json to a given document.
     */
    private updateTextDocument(document: vscode.TextDocument, json: any)
    {
        const edit = new vscode.WorkspaceEdit();

        // Just replace the entire document every time for this example extension.
        // A more complete extension should compute minimal edits instead.
        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            JSON.stringify(json, null, 2));

        return vscode.workspace.applyEdit(edit);
    }
}
