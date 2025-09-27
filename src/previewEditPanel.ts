import path = require("path");
import * as vscode from "vscode";
import { getNonce } from "./util";
import { WebpanelPostMessageKind } from "./webpanelMessageKind";
import { Logger } from "./logger";
import { emptyString } from "./constants";

/**
 * Preview only. Key-Value pairs cannot be edited.
 */
class PreviewEditPanel {

	public static currentPanel: PreviewEditPanel | undefined;

	public static readonly viewType = "previewEdit";

	private readonly panel: vscode.WebviewPanel;
	public content: string;
	private disposables: vscode.Disposable[] = [];
	private static title: string = "Resx Preview";

	public static namespace: string = emptyString;

	public setNewNamespace(namespace: string) {
		PreviewEditPanel.namespace = namespace;
		if (PreviewEditPanel.currentPanel) {
			PreviewEditPanel.currentPanel.panel.webview.postMessage({
				type: WebpanelPostMessageKind.NewNamespace,
				data: namespace
			});
		}
	}

	public static createOrShow(extensionUri: vscode.Uri, title: string, content: string) {

		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		this.title = title;

		// If we already have a panel, show it.
		if (PreviewEditPanel.currentPanel) {
			PreviewEditPanel.currentPanel.panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			PreviewEditPanel.viewType,
			"PreviewEdit",
			column || vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true,
				enableForms: true,
				// And restrict the webview to only loading content from our extension's `webpanel` directory.
				localResourceRoots: [vscode.Uri.joinPath(extensionUri, "styles"), vscode.Uri.joinPath(extensionUri, "out")]
			}
		);

		PreviewEditPanel.currentPanel = new PreviewEditPanel(panel, extensionUri, content);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, content: string) {
		PreviewEditPanel.currentPanel = new PreviewEditPanel(panel, extensionUri, content);
	}

	private extensionUri: vscode.Uri;
	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, content: string) {
		this.panel = panel;
		this.content = content;
		this.extensionUri = extensionUri;
		// Set the webview's initial html content
		this.update(content);

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

		// Update the content based on view changes
		this.panel.onDidChangeViewState((e: vscode.WebviewPanelOnDidChangeViewStateEvent) => {
			if (this.panel.visible || e.webviewPanel.visible) {
				this.update(this.content);
			}
		}, null, this.disposables);

		// Handle messages from the webview
		this.panel.webview.onDidReceiveMessage(
			message => {
				Logger.instance.info(message);
				switch (message.type) {
					case WebpanelPostMessageKind.Alert:
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this.disposables
		);
	}

	public dispose() {
		PreviewEditPanel.currentPanel = undefined;

		// Clean up our resources
		this.panel.dispose();

		while (this.disposables.length) {
			const x = this.disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private update(content: string) {
		const webview = this.panel.webview;

		// Vary the webview's content based on where it is located in the editor.
		switch (this.panel.viewColumn) {
			case vscode.ViewColumn.Two:
				this.updateKeyValues(webview, content);
				return;

			case vscode.ViewColumn.Three:
				this.updateKeyValues(webview, content);
				return;

			case vscode.ViewColumn.One:
			default:
				this.updateKeyValues(webview, content);
				return;
		}
	}

	private updateKeyValues(webview: vscode.Webview, content: string) {
		this.panel.title = PreviewEditPanel.title + " Preview";
		this.panel.webview.html = this.getHtmlForWebview(webview, content);
	}

	private getHtmlForWebview(webview: vscode.Webview, content: string) {
		const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionUri.path, "out", "webpanelScript.js")));
		const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionUri.path, "styles", "webpanel.css")));
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
            <div id="container" class="sticky-div">
				<h2>${this.panel.title}</h2>
            </div>
            <table id="tbl">
                <thead class="thead th">
                    <th>Key</th>
                    <th>Value</th>
                    <th>Comment</th>
                </thead>
                ${content}
            </table>
			<script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>
        `;
	}
}


export { PreviewEditPanel };
