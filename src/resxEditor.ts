import * as path from "path";
import * as vscode from "vscode";
import { emptyString } from "./constants";
import { getNonce } from "./util";

const addLabel = "Add New Resource";
const switchToTextEditorLabel = "Switch to text editor";
const allLanguagesLabel = "Edit every language of this resource in one table";
const sortByKeysLabel = "Sort by keys";
const changeNamespaceLabel = "Change namespace";

export class ResxEditor {
    private readonly context: vscode.ExtensionContext;
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public getHtmlForWebview(webview: vscode.Webview, namespace: string, hasCultureSiblings: boolean): string {

        const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "out", "webpanelScript.js")));
        const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "styles", "webpanel.css")));
        const maPlusThick = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "styles", "ma-plus-thick.svg")));
        const faPenToSquare = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "styles", "fa-pen-to-square.svg")));
        const faRightLeft = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "styles", "fa-right-left.svg")));
        const faSortAtoZ = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "styles", "fa-arrow-down-a-z-solid-full.svg")));
        const columns = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "styles", "columns.svg")));
        const nonce = getNonce();

        /*
         * Offered only when there is something to combine. A resource with no
         * culture siblings has nothing to show in a second column, and the
         * button would be a dead end on the majority of resx files.
         */
        const allLanguagesButton = hasCultureSiblings
            ? `<button id="allLanguagesButton" class="btn secondary icon-only" title="${allLanguagesLabel}" aria-label="${allLanguagesLabel}">
                <img src="${columns}" alt="" class="icon filter-fefefe">
            </button>`
            : emptyString;

        /*
         * Every button but Add is icon-only: four spelled-out labels are what made
         * the toolbar wrap. An icon with no text has no accessible name of its own,
         * so each one carries title for the pointer and aria-label for the screen
         * reader, and the <img> is marked decorative so it does not read twice.
         */
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
        <div class="toolbar-row">
            <div class="toolbar-actions">
                <button id="addButton" class="btn primary">
                    <img src="${maPlusThick}" alt="" class="icon filter-fefefe">${addLabel}
                </button>
                <button id="switchToTextEditorButton" class="btn secondary icon-only" title="${switchToTextEditorLabel}" aria-label="${switchToTextEditorLabel}">
                    <img src="${faRightLeft}" alt="" class="icon filter-fefefe">
                </button>
                ${allLanguagesButton}
                <button id="sortByKeysButton" class="btn secondary icon-only" title="${sortByKeysLabel}" aria-label="${sortByKeysLabel}">
                    <img src="${faSortAtoZ}" alt="" class="icon filter-fefefe">
                </button>
            </div>
            <!-- Information, not an action, so it sits at the right edge rather than among the buttons. -->
            <div class="namespace-section">
                <span id="namespaceSpan">Namespace: <strong>${escapeHtml(namespace)}</strong></span>
                <button id="changeNamespaceButton" class="btn secondary icon-only" title="${changeNamespaceLabel}" aria-label="${changeNamespaceLabel}">
                    <img src="${faPenToSquare}" alt="" class="icon filter-fefefe">
                </button>
            </div>
        </div>
        <!-- Hidden until there is something to report; an empty row would still cost a line. -->
        <p id="errorBlock" class="error-block" hidden></p>
        <!-- A row of its own, so the box gets the editor's full width. -->
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
