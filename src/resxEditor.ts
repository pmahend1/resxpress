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

        function updateWebview()
        {

            var jsonText = JSON.stringify(getDataJs(document.getText()));
            webviewPanel.webview.postMessage({
                type: 'update',
                text: jsonText
            });

        }

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
                    this.updateTextDocument(document, e.json);
                    return;
                case 'add':
                    this.addNewKeyValue(document, e.json);
                    return;

                case 'delete':
                    this.deleteKeyValue(document, e.json);
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

        const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'main.js')));
        const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'main.css')));

        const nonce = getNonce();

        return `<!DOCTYPE html />
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta http-equiv="Content-Security-Policy"
                  content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"/>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link href="${styleUri}" rel="stylesheet" />

            <title>ResxFileName</title>          
          </head>
          <body>
            <button class="button button2" 
                    id="addButton">Add New Resource</button>
            <table id="tbl">
              <thead>
                <th>Key</th>
                <th>Value</th>
                <th>Comment</th>
                <th> </th>
              </thead>
              <tbody>
              </tbody>
            </table>
            <script nonce="${nonce}" src="${scriptUri}"></script>
          </body>
        </html>
        `;
    }

    /**
     * Add a new key value back to text editor 
     */
    private addNewKeyValue(document: vscode.TextDocument, json: any)
    {
        var newObj = JSON.parse(json);
        var docDataList = getDataJs(document.getText());
        docDataList.push(newObj);
        return this.updateTextDocument(document, JSON.stringify(docDataList));
    }

    /**
     * Delete an existing scratch from a document.
     */
    private deleteKeyValue(document: vscode.TextDocument, json: any)
    {


        var deletedJsObj = JSON.parse(json);

        var sendableObj = {
            _attributes: {
                name: deletedJsObj.key,
                'xml:space': "preserve"
            }, value: { _text: deletedJsObj?.value },
            comment: { _text: deletedJsObj?.comment }
        };

        var currentData = getDataJs(document.getText());

        var pos = currentData.map(function (e) { return e?._attributes?.name; }).indexOf(sendableObj._attributes.name);

        currentData.splice(pos, 1);
        return this.updateTextDocument(document, JSON.stringify(currentData));

    }


    private updateTextDocument(document: vscode.TextDocument, dataListJson: any)
    {
        console.log('Current resx : /n' + xmljs.xml2json(document.getText(),{compact:true}));
        
        var dataList = JSON.parse(dataListJson);
        const edit = new vscode.WorkspaceEdit();

        var currentJs: any = xmljs.xml2js(document.getText(), { compact: true });
        if(dataList){
            switch (dataList.length) {
                case 0:
                    currentJs.root.data = {};
                    break;
                case 1:
                    currentJs.root.data = dataList[0];
                default:
                    currentJs.root.data = dataList;
                    break;
            }
                


        }else{
            currentJs.root.data = {};
        }


        var resx = xmljs.js2xml(currentJs, { spaces: 4, compact: true });
        console.log("Updated resx" + resx);
        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            resx);


        return vscode.workspace.applyEdit(edit);
    }



}
function getDataJs(text: string): any[]
{
    console.log('----Current resx json --- : \n' + xmljs.xml2json(text,{compact:true}));
    var jsObj: any = xmljs.xml2js(text, { compact: true });

    var dataList: any[] = [];

    if (dataList)
    {
        if (jsObj.root.data instanceof Array)
        {
            dataList.concat(jsObj.root.data);
        } else
        {

            if(jsObj.root.data){
                dataList.push(jsObj.root.data);
            }
            else{
                console.log('jsObj root data is null');
                
            }
        }
    }



    return dataList;
}