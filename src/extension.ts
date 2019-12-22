import * as vscode from 'vscode';
import { promises as fspromises, copyFile } from 'fs';

export function activate(context: vscode.ExtensionContext) {

	let readResx = vscode.commands.registerCommand('resxpress.resxpreview', async () => {
		await viewResx();

	});
	context.subscriptions.push(readResx);
}

// this method is called when your extension is deactivated
export function deactivate() { }



export async function viewResx() {

	const path = require('path');
	var array_ = new Array();
	array_.push(["Key", "Value"]);



	var currentfilename = vscode.window.activeTextEditor?.document.fileName;
	var ext = path.parse(currentfilename).ext;
	if (ext !== ".resx") {
		await vscode.window.showErrorMessage("Not a Resx file.");
		return;
	}
	if (currentfilename) {
		var filename_noext = currentfilename.substring(0, currentfilename.lastIndexOf('.'));
		var ResxParser = require('resx-parser');
		var parser = new ResxParser();
		var res = parser.parseResxFile(currentfilename, async (err: any, result: any) => {
			if (err) {
				return console.log(err);
			} else {
				console.log(result);
				console.log(filename_noext);
				await displayJson(filename_noext, result);

			}
		});

		async function displayJson(filename: any, jsondata: any) {


			let mdfile = filename + ".md";


			let fileContent = 'Key | Value' + '\n';
			fileContent += '---|----' + '\n';

			for (const property in jsondata) {
				fileContent += property + "|" + jsondata[property] + '\n';
			}

			await fspromises.writeFile(mdfile, fileContent);

			let uri = vscode.Uri.file(mdfile);

			await vscode.commands.executeCommand("vscode.open", uri);
			await vscode.commands.executeCommand("markdown.showPreview");
			await vscode.commands.executeCommand("workbench.action.previousEditor");
			await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
		}

	}

}

