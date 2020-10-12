import * as path from 'path';
import * as vscode from 'vscode';
import { getNonce } from './util';
import * as xmljs from "xml-js";
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
        var x:any = this.updateContent(document);
        function updateWebview()
        {
            
            webviewPanel.webview.postMessage({
                type: 'update',

                text: x,
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
                case 'update':
                    this.updateTextDocument(document, e.text);
                    return;
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

    content: string = '';
    /**
     * Get the static html used for the editor webviews.
     */
    private getHtmlForWebview(webview: vscode.Webview): string
    {
        // Local path to script and css for the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'media','main.js')
        ));
        const styleUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'media', 'main.css')
        ));


        // Use a nonce to whitelist which scripts can be run
        const nonce = getNonce();
        // <link href="${styleUri}" rel="stylesheet" />
        return `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta
              http-equiv="Content-Security-Policy"
              content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="stylesheet" href="${styleUri}" />
            <script src="${styleUri}"></script>
            <title>ResxFileName</title>
            
          </head>
        
          <body>
            <button class="button button2" id="addButton" class="addButton">Add New</button>
            <table id="tbl" class="tbl">
              <tr>
                <th>Key</th>
                <th>Value</th>
                <th>Comment</th>
              </tr>
              <tbody>
              ${this.content}
              </tbody>
             
            </table>
        
            <script nonce="${nonce}" src="${scriptUri}"></script>
          </body>
        </html>
        `;
    }

    /**
     * Add a new scratch to the current document.
     */
    private addNewKeyValue(document: vscode.TextDocument)
    {
        const json = this.updateContent(document);
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
    public updateContent(document: vscode.TextDocument): any
    {
        const text = document.getText();
        if (text.trim().length === 0)
        {
            return "";
        }
        this.content ='';
        var jsonData = getDataJs(document.getText());
        try
        {
           
            for (const jsObj of jsonData)
            {

                var property = jsObj._attributes.name;

                var valueString = jsObj.value?._text;
                var commentString = jsObj.comment?._text ?? "";
                this.content += `<tr>
                <td><input value="${property}" type="text" /></td>
                <td><input value="${valueString}" type="text" /></td>
                <td><input value="${commentString}" type="text" /></td>
              </tr>
              `;

               
            }
            return this.content;

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
      // this.updateContent(document);

        var resx = xmljs.js2xml(json);
        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            resx);

        return vscode.workspace.applyEdit(edit);
    }


}
function getDataJs(text:string): any[]
{
    var jsObj: any = xmljs.xml2js(text, { compact: true });
    console.log(jsObj);
    return jsObj.root.data;
}