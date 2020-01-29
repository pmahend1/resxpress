import * as vscode from "vscode";
import { promises as fspromises, copyFile } from "fs";
import { resolve } from "dns";

export function activate(context: vscode.ExtensionContext) {
	let readResx = vscode.commands.registerCommand("resxpress.resxpreview",
												async () => {
													await viewResx();
												}
	);

	let sortByKeysCommand = vscode.commands.registerCommand(
		"resxpress.sortbykeys",
		async () => await sortByKeys()
	);
	context.subscriptions.push(readResx);
	context.subscriptions.push(sortByKeysCommand);
}

// this method is called when your extension is deactivated
export function deactivate() { }

export async function sortByKeys() {
	let unordered:any = await parseResx();
	console.log(unordered);
	var ordered: any;
	if(unordered instanceof Object)
	{
		Object.keys(unordered)
		.sort()
		.forEach(function (key: string) {
			ordered[key] = unordered[key];
		});

	console.log(JSON.stringify(ordered));
	}
	
}

function parseResx() {
	let jsObj= new Promise((res, rej)=> { return rej(new Error(''));});
	var currentFileName = vscode.window.activeTextEditor?.document.fileName;
	if (currentFileName) 
	{
		var ResxParser = require("resx-parser");
		var options = {convertIdCase: ""};
		var parser = new ResxParser(options);


		 jsObj = new Promise((resolve, reject) => {
			parser.parseResxFile(currentFileName, (err: Error, result: any) =>  {
				if (err) {
					 return reject(err);
				} else {
					return resolve(result);
				}
			
		});});
	
	
	}

	return jsObj;
}

export async function viewResx() {
	const path = require("path");

	var currentFileName = vscode.window.activeTextEditor?.document.fileName;
	var ext = path.parse(currentFileName).ext;
	if (ext !== ".resx") {
		await vscode.window.showErrorMessage("Not a Resx file.");
		return;
	}
	if (currentFileName) {
		var fileNameNoExt = currentFileName.substring(
			0,
			currentFileName.lastIndexOf(".")
		);
		var result = parseResx();
		if (result) {
			if (!(result instanceof Error)) {
				await displayJson(fileNameNoExt, result);
			}
		}
	}
}

async function displayJson(filename: any, jsonData: any) {
	let mdFile = filename + ".md";

	let fileContent = "Key | Value" + "\n";
	fileContent += "--- | ---" + "\n";

	for (const property in jsonData) {
		console.log(property + " : " + jsonData[property]);

		fileContent +=
			"```" +
			property +
			"```" +
			" | " +
			"```" +
			jsonData[property] +
			"```" +
			"\n";
	}

	await fspromises.writeFile(mdFile, fileContent);

	let uri = vscode.Uri.file(mdFile);

	await vscode.commands.executeCommand("vscode.open", uri);
	await vscode.commands.executeCommand("markdown.showPreview");
	await vscode.commands.executeCommand("workbench.action.previousEditor");
	await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
}
