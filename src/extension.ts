import * as vscode from 'vscode';
import {promises as fspromises } from 'fs';
export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('extension.resxpress', () => {

		vscode.window.showInformationMessage('resxpress opened');
	});
	context.subscriptions.push(disposable);

	let readResx = vscode.commands.registerCommand('extension.resxpreview', async () => {
		vscode.window.showInformationMessage('resx editor opened');
		await viewResx();

	});
	context.subscriptions.push(readResx);
}

// this method is called when your extension is deactivated
export function deactivate() { }

export async function viewResx() {

	var resxConverter = require('resx2tsjs');
	resxConverter.executeResxToJson('/', '/src', true);

	var customers = new Array();
	customers.push(["Key", "Value"]);

	var currentfilename = vscode.window.activeTextEditor?.document.fileName;

	if (currentfilename) {

		//console.log(currentfilename);
		const path = require('path');
		var filename_noext = currentfilename.substring(0, currentfilename.lastIndexOf('.'));
		var jsonfile = filename_noext + ".json";
		var fs = require('fs').promises;
		const data = await fs.readFile(jsonfile);

		let mdfile = filename_noext + ".md";
		let jsondata = JSON.parse(data);

		var filedata = jsondata[path.parse(jsonfile).name];
		console.log(filedata);


		let fileContent = 'Key | Value' + '\n';
		fileContent += '---|----' + '\n';

		for (const property in filedata) {
			fileContent += property + "|" + filedata[property] + '\n';
		}

		await	fspromises.writeFile(mdfile,fileContent);
		//await WriteFile(mdfile, fileContent);
		let uri = vscode.Uri.file(mdfile);
		
		await vscode.commands.executeCommand("vscode.open", uri);
		await vscode.commands.executeCommand("markdown.showPreview");	
		await vscode.commands.executeCommand("workbench.action.previousEditor");
		await vscode.commands.executeCommand("workbench.action.closeActiveEditor");

	}

}

