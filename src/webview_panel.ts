import * as vscode from 'vscode';

class PreviewEditPanel {

	public static currentPanel: PreviewEditPanel | undefined;

	public static readonly viewType = 'previewEdit';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	public _content: string;
	private _disposables: vscode.Disposable[] = [];
	private static _title: string = "Resx Preview";

	public static createOrShow(extensionUri: vscode.Uri, title: string, content: string) {

		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		this._title = title;

		// If we already have a panel, show it.
		if (PreviewEditPanel.currentPanel) {
			PreviewEditPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			PreviewEditPanel.viewType,
			'PreviewEdit',
			column || vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
				enableScripts: true,

				// And restrict the webview to only loading content from our extension's `media` directory.
				localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
			}
		);

		PreviewEditPanel.currentPanel = new PreviewEditPanel(panel, extensionUri, content);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, content: string) {
		PreviewEditPanel.currentPanel = new PreviewEditPanel(panel, extensionUri, content);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, content: string) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._content = content;

		// Set the webview's initial html content
		this._update(content);

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update(this._content);
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: 'refactor' });
	}

	public dispose() {
		PreviewEditPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update(content: string) {
		const webview = this._panel.webview;

		// Vary the webview's content based on where it is located in the editor.
		switch (this._panel.viewColumn) {
			case vscode.ViewColumn.Two:
				this._updateKeyValues(webview, content);
				return;

			case vscode.ViewColumn.Three:
				this._updateKeyValues(webview, content);
				return;

			case vscode.ViewColumn.One:
			default:
				this._updateKeyValues(webview, content);
				return;
		}
	}

	private _updateKeyValues(webview: vscode.Webview, content: string) {
		this._panel.title = PreviewEditPanel._title + " Preview";
		this._panel.webview.html = this._getHtmlForWebview(webview, content);
	}

	private _getHtmlForWebview(webview: vscode.Webview, content: string) {

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>${PreviewEditPanel._title}</title>
				<style>
					table 
					{
						border-collapse: collapse;
						width: 75%;
					}

					th 
					{
						position: sticky;
						background-color: var(--vscode-editor-background);
						border: 1px solid;
						text-align: center;
						padding: 8px;
					}

					td 
					{
						padding: 8px;
						border: 1px solid;

					}

					tr:nth-child(even) 
					{
						background-color: var(--vscode-sideBar-background);
					}
				</style>
			</head>
			<body>
			<table>
			<tr>
			  <th>Key</th>
			  <th>Value</th>
			  <th>Comment</th>
			</tr>
			${content}
			</table>
			</body>
			</html>`;
	}


}


export { PreviewEditPanel };
