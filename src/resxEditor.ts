import * as path from "path";
import * as vscode from "vscode";
import { getNonce } from "./util";
import * as xmljs from "xml-js"
import { ResxJsonHelper } from "./resxJsonHelper";

export class ResxEditor {
    private readonly context: vscode.ExtensionContext;
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public getHtmlForWebview(webview: vscode.Webview, namespace: string, content: string): string {

        const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "out", "webpanelScript.js")));
        const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "styles", "webpanel.css")));

        const nonce = getNonce();

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy"
                content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link href="${styleUri}" rel="stylesheet" />
            <title>ResxFileName</title>    
        </head>
        <body>
            <div id="container" class="topdiv">
                <div id="leftThing">
                    <button class="largeButtonStyle" id="addButton">Add New Resource</button>
                </div>
            
                <div id="middleThing">
                    <div id="diverr" class="error"></div>
                </div>
                
                <div id="rightThing">
                    <button class="smallButtonStyle" id="switchToEditor">Switch to Text Editor</button>
                </div>
            </div>
            <div id="container-namespace" class="topdiv">
                <div id="leftThing">
                    <h2>namepace</h2>
                </div>
            
                <div id="middleThing">
                     <h3>${namespace}</h3>
                </div>
                
                <div id="rightThing">
                    <button class="smallButtonStyle" id="changeNamespaceButton">Change namespace</button>
                </div>
            </div>
            <table id="tbl">
                <thead class="tableFixHead thead th">
                    <th>Key</th>
                    <th>Value</th>
                    <th>Comment</th>
                    <th> </th>
                </thead>
                <tbody>
                 ${content}
                </tbody>
            </table>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
    }

    /**
     * Add a new key value back to text editor 
     */
    public addNewKeyValue(document: vscode.TextDocument, json: any) {
        const newObj = JSON.parse(json);
        const docDataList = ResxJsonHelper.getJsonData(document.getText());

        var pos = docDataList.map((x) => { return x?._attributes?.name; }).indexOf(newObj._attributes.name);

        //avoid adding data with same key
        if (pos === -1) {
            docDataList.push(newObj);
        }
        else {
            // commented for now. its triggering twice 
            vscode.window.showErrorMessage(`Data with same key ${newObj._attributes.name} already exists`);
        }
        return this.updateTextDocument(document, JSON.stringify(docDataList));
    }

    /**
     * Delete an existing scratch from a document.
     */
    public deleteKeyValue(document: vscode.TextDocument, json: any) {

        console.log("deleteKeyValue start");

        var deletedJsObj = JSON.parse(json);

        var currentData = ResxJsonHelper.getJsonData(document.getText());

        console.log(`Datalist before deleting ${deletedJsObj._attributes.name} : ${JSON.stringify(currentData)}`);

        var pos = currentData.map(function (e) { return e?._attributes?.name; }).indexOf(deletedJsObj._attributes.name);

        currentData.splice(pos, 1);
        console.log("deleteKeyValue end");
        return this.updateTextDocument(document, JSON.stringify(currentData));
    }


    public updateTextDocument(document: vscode.TextDocument, dataListJson: any) {
        console.log("updateTextDocument start");

        var dataList = JSON.parse(dataListJson);
        const edit = new vscode.WorkspaceEdit();

        var currentJs: any = xmljs.xml2js(document.getText(), { compact: true })

        console.log(`Before datalist - ${JSON.stringify(currentJs.root.data)} `);

        if (dataList) {
            switch (dataList.length) {
                case 0:
                    delete currentJs.root.data;
                    break;
                case 1:
                    currentJs.root.data = dataList[0];
                    break;
                default:
                    currentJs.root.data = dataList;
                    break;
            }
        }
        else {
            console.log("Empty data : red flag");

            currentJs.root.data = {};
        }
        console.log(`After datalist - ${JSON.stringify(currentJs.root.data)} `);

        var resx = xmljs.js2xml(currentJs, { spaces: 4, compact: true });
        console.log("Updated resx" + resx);
        edit.replace(
            document.uri,
            new vscode.Range(0, 0, document.lineCount, 0),
            resx);

        console.log("updateTextDocument end");
        return vscode.workspace.applyEdit(edit);
    }
}