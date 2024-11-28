import * as vscode from "vscode";
import { ResxEditor } from "./resxEditor";
import { ResxJsonHelper } from "./resxJsonHelper";
import { WebpanelPostMessageKind } from "./webpanelMessageKind";
import { resxpress, setNamespace } from "./extension";
import { FileHelper } from "./fileHelper";
import { WebpanelPostMessage } from "./wevpanelPostMessage";
import *  as xmljs from "xml-js";
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

    private readonly context: vscode.ExtensionContext;
    private readonly resxEditor: ResxEditor;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.resxEditor = new ResxEditor(this.context);
    }

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new ResxEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(`${resxpress}.editor`, provider);
        return providerRegistration;
    }

    /**
     * Called when our custom editor is opened.
     */
    public async resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, _token: vscode.CancellationToken) : Promise<void> {
        // Setup initial content for the webview
        webviewPanel.webview.options = {
            enableScripts: true,
            enableForms: true,
        };

        if (_token.isCancellationRequested) {
            return;
        }
        const namespace = await FileHelper.tryGetNamespace(document);

        var jsObj = xmljs.xml2js(document.getText());
        var jsonData: any = [];
        var sorted = [];
        jsObj.elements[0].elements.forEach((x: any) => {
            if (x.name === "data") {
                jsonData.push(x);
            }
            else {
                sorted.push(x);
            }
        });
        
        let htmlContent = "";

        let i = 0;
		jsonData.forEach((element:any) => {
			var valueStr = "";
			var commentstr = "";
			element.elements.forEach((subElement: any) => {
				if (subElement.name === "value" && subElement.elements?.length > 0) {
					valueStr = subElement.elements[0].text;
				}
				else if (subElement.name === "comment" && subElement.elements?.length > 0) {
					commentstr = subElement.elements[0].text;
				}
			});
			htmlContent += `<tr>
				<td><input value="${element.attributes.name}" id="key${i}"/></td>
				<td><input value="${valueStr}" id="value${i}"/></td>
				<td><input value="${commentstr}" id="comment${i}"/></td>
                <td style="text-align:center;" id="delete${i}"> x </td>
			</tr>`;
            i = i + 1;
		});
        webviewPanel.webview.html = this.resxEditor.getHtmlForWebview(webviewPanel.webview, namespace ?? "", htmlContent);

        // Receive message from the webview.
        webviewPanel.webview.onDidReceiveMessage(e => {
            console.log(`webviewPanel.webview.onDidReceiveMessage: ${JSON.stringify(e)}`);
            switch (e.type) {
                    case WebpanelPostMessageKind.Update:
                        this.resxEditor.updateTextDocument(document, e.json);
                        break;
                    case WebpanelPostMessageKind.Add:
                        this.resxEditor.addNewKeyValue(document, e.json);
                        break;
    
                    case WebpanelPostMessageKind.Delete:
                        this.resxEditor.deleteKeyValue(document, e.json);
                        break;
                    case WebpanelPostMessageKind.Switch:
                        vscode.window.showTextDocument(document, vscode.ViewColumn.Active);
                        break;
                    case WebpanelPostMessageKind.NamespaceUpdate:
                        setNamespace(document.uri);
                        break;
                }
            });

        function updateWebview() {

            var jsonText = JSON.stringify(ResxJsonHelper.getJsonData(document.getText()));
            webviewPanel.webview.postMessage(new WebpanelPostMessage(WebpanelPostMessageKind.Update,jsonText));
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



        updateWebview();
    }

    content: string = "";
}
