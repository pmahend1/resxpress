import * as path from "path";
import * as vscode from "vscode";
import { getNonce } from "./util";
import * as xmljs from "xml-js"
import { ResxJsonHelper } from "./resxJsonHelper";
import { Settings } from "./settings";
import { Logger } from "./logger";
import { nameof } from "./nameof";

export class ResxEditor {
    private readonly context: vscode.ExtensionContext;
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public getHtmlForWebview(webview: vscode.Webview, namespace: string, content: string): string {

        const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "out", "webpanelScript.js")));
        const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "styles", "webpanel.css")));
        const maPlusThick = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "styles", "ma-plus-thick.svg")));
        const faPenToSquare = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "styles", "fa-pen-to-square.svg")));
        const faRightLeft = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "styles", "fa-right-left.svg")));
        const faSortAtoZ = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "styles", "fa-arrow-down-a-z-solid-full.svg")));
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
    <div class="sticky-div">
        <button id="addButton" class="btn primary">
           <img src="${maPlusThick}" alt="Add Icon" class="icon filter-fefefe"> Add New Resource
        </button>
        
        <button id="switchToTextEditorButton" class="btn secondary">
            <img src="${faRightLeft}" alt="Switch Icon" class="icon filter-fefefe"> Switch to Text Editor
        </button>
        <div class="namespace-section">
            <span id="namespaceSpan">Namespace: <strong>${namespace}</strong></span>
            <button id="changeNamespaceButton" class="btn secondary">
                <img src="${faPenToSquare}" alt="Edit Icon" class="icon filter-fefefe"> Change Namespace
            </button>
        </div>
        <button id="sortByKeysButton" class="btn secondary">
            <img src="${faSortAtoZ}" alt="Sort Icon" class="icon filter-fefefe">Sort By Keys
        </button>
        <p id="errorBlock" class="error-block"></p>
    </div>

    <table id="tbl">
        <thead class="thead th">
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


        var deletedJsObj = JSON.parse(json);
        var currentData = ResxJsonHelper.getJsonData(document.getText());

        Logger.instance.info(`${nameof(ResxEditor)}.${nameof(this.deleteKeyValue)}: Datalist before deleting ${deletedJsObj._attributes.name} : ${JSON.stringify(currentData)}`);
        var pos = currentData.map(e => e?._attributes?.name).indexOf(deletedJsObj._attributes.name);

        currentData.splice(pos, 1);
        Logger.instance.info(`${nameof(ResxEditor)}.${nameof(this.deleteKeyValue)}: Deleted ${deletedJsObj._attributes.name}`);
        return this.updateTextDocument(document, JSON.stringify(currentData));
    }

    public updateTextDocument(document: vscode.TextDocument, dataListJson: any) {
        Logger.instance.info(`${nameof(ResxEditor)}.${nameof(this.updateTextDocument)}: `);

        var dataList = JSON.parse(dataListJson);
        const edit = new vscode.WorkspaceEdit();

        var currentJs: any = xmljs.xml2js(document.getText(), { compact: true })

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
            Logger.instance.warning(`${nameof(ResxEditor)}.${nameof(this.updateTextDocument)}: empty datalist`);
            currentJs.root.data = {};
        }
        var resx = xmljs.js2xml(currentJs, { spaces: Settings.indentSpaceLength, compact: true });
        Logger.instance.info(`${nameof(ResxEditor)}.${nameof(this.updateTextDocument)}: ${resx}`);
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), resx);
        return vscode.workspace.applyEdit(edit);
    }
}