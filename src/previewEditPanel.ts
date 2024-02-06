import * as vscode from 'vscode';

class PreviewEditPanel {

	public static currentPanel: PreviewEditPanel | undefined;

	public static readonly viewType = 'previewEdit';

	private readonly panel: vscode.WebviewPanel;
	public content: string;
	private disposables: vscode.Disposable[] = [];
	private static title: string = "Resx Preview";

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
		this.panel = panel;
		this.content = content;

		// Set the webview's initial html content
		this.update(content);

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

		// Update the content based on view changes
		this.panel.onDidChangeViewState(
			e => {
				if (this.panel.visible) {
					this.update(this.content);
				}
			},
			null,
			this.disposables
		);

		// Handle messages from the webview
		this.panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this.disposables
		);
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this.panel.webview.postMessage({ command: 'refactor' });
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
		this.panel.webview.html = this._getHtmlForWebview(webview, content);
	}

	private _getHtmlForWebview(webview: vscode.Webview, content: string) {

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>${PreviewEditPanel.title}</title>
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
