import * as path from "path";
import * as vscode from "vscode";
import { emptyString } from "./constants";
import { readInlineIcon } from "./inlineSvgIcon";
import { getNonce } from "./util";

const addLabel = "Add New Resource";
const switchToTextEditorLabel = "Switch to text editor";
const allLanguagesLabel = "Languages";
const allLanguagesTooltip = "Edit every language of this resource in one table";
const sortByKeysLabel = "Sort by keys";
const changeNamespaceLabel = "Change namespace";
const resolvingNamespaceLabel = "Resolving namespace";

export class ResxEditor {
    private readonly context: vscode.ExtensionContext;
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public getHtmlForWebview(webview: vscode.Webview, hasCultureSiblings: boolean): string {

        const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "out", "webpanelScript.js")));
        const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "styles", "webpanel.css")));
        const addIcon = readInlineIcon(this.context.extensionPath, "ms-add.svg");
        const changeNamespaceIcon = readInlineIcon(this.context.extensionPath, "ms-edit-square.svg");
        const switchToTextEditorIcon = readInlineIcon(this.context.extensionPath, "ms-swap-horiz.svg");
        const sortByKeysIcon = readInlineIcon(this.context.extensionPath, "ms-sort-by-alpha.svg");
        const allLanguagesIcon = readInlineIcon(this.context.extensionPath, "ms-translate.svg");
        const errorIcon = readInlineIcon(this.context.extensionPath, "ms-error.svg");
        const deleteIcon = readInlineIcon(this.context.extensionPath, "ms-delete.svg");
        const duplicateIcon = readInlineIcon(this.context.extensionPath, "ms-content-copy.svg");
        const nonce = getNonce();

        /*
         * Offered only when there is something to combine. A resource with no
         * culture siblings has nothing to show in a second column, and the
         * button would be a dead end on the majority of resx files. It keeps a
         * short label because no icon says "every culture in one table" alone.
         */
        const allLanguagesButton = hasCultureSiblings
            ? `<button id="allLanguagesButton" class="btn secondary" data-tooltip="${allLanguagesTooltip}" aria-description="${allLanguagesTooltip}">
                ${allLanguagesIcon}${allLanguagesLabel}
            </button>`
            : emptyString;

        /*
         * data-tooltip rather than title: the CSS draws it sooner. It is not announced,
         * so icon-only buttons carry aria-label and labelled ones aria-description.
         * The inlined icon itself is aria-hidden.
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
                    ${addIcon}${addLabel}
                </button>
                <button id="switchToTextEditorButton" class="btn secondary icon-only" data-tooltip="${switchToTextEditorLabel}" aria-label="${switchToTextEditorLabel}">
                    ${switchToTextEditorIcon}
                </button>
                ${allLanguagesButton}
                <button id="sortByKeysButton" class="btn secondary icon-only" data-tooltip="${sortByKeysLabel}" aria-label="${sortByKeysLabel}">
                    ${sortByKeysIcon}
                </button>
            </div>
            <!-- Information, not an action, so it sits at the right edge rather than among the buttons. -->
            <div class="namespace-section">
                <!-- The host posts NewNamespace once its lookup answers, which replaces the spinner. -->
                <span id="namespaceSpan">Namespace: <span class="spinner" role="status" aria-label="${resolvingNamespaceLabel}"></span></span>
                <button id="changeNamespaceButton" class="btn secondary icon-only" data-tooltip="${changeNamespaceLabel}" aria-label="${changeNamespaceLabel}">
                    ${changeNamespaceIcon}
                </button>
            </div>
        </div>
        <div id="errorBlock" class="error-block" role="alert" hidden>
            ${errorIcon}<span id="errorText"></span>
        </div>
        <div class="search-section">
            <input id="searchInput" class="search-input" type="search"
                   placeholder="Search key, value or comment"
                   aria-label="Search key, value or comment" />
            <span id="searchStatus" class="search-status"></span>
        </div>
    </div>

    <table id="tbl">
        <thead class="thead th">
            <th class="duplicate-column"> </th>
            <th>Key</th>
            <th>Value</th>
            <th>Comment</th>
            <th class="delete-column"> </th>
        </thead>
        <tbody>
        </tbody>
    </table>
    <!-- Cloned into every row's action buttons by webpanelScript. -->
    <template id="duplicateIconTemplate">${duplicateIcon}</template>
    <template id="deleteIconTemplate">${deleteIcon}</template>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}
