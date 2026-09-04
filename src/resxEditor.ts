import * as path from "path";
import * as vscode from "vscode";
import { getNonce } from "./util";

export class ResxEditor {
    private readonly context: vscode.ExtensionContext;
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public getHtmlForWebview(webview: vscode.Webview, namespace: string): string {

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
            <span id="namespaceSpan">Namespace: <strong>${escapeHtml(namespace)}</strong></span>
            <button id="changeNamespaceButton" class="btn secondary">
                <img src="${faPenToSquare}" alt="Edit Icon" class="icon filter-fefefe"> Change Namespace
            </button>
        </div>
        <button id="sortByKeysButton" class="btn secondary">
            <img src="${faSortAtoZ}" alt="Sort Icon" class="icon filter-fefefe">Sort By Keys
        </button>
        <p id="errorBlock" class="error-block"></p>
        <!-- Last in the toolbar, and given a full-width flex basis, so it takes a row of its own under the buttons. -->
        <div class="search-section">
            <input id="searchInput" class="search-input" type="search"
                   placeholder="Search key, value or comment"
                   aria-label="Search key, value or comment" />
            <span id="searchStatus" class="search-status"></span>
        </div>
    </div>

    <table id="tbl">
        <thead class="thead th">
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
</html>`;
    }
}

/*
 * The rows themselves are built with DOM APIs in webpanelScript, which is what
 * keeps resx content out of the HTML. The namespace is the one value still
 * interpolated here, and it comes from a Designer.cs file or a user prompt.
 */
function escapeHtml(text: string): string {
    return text.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;")
               .replace(/"/g, "&quot;");
}
