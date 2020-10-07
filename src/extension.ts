import * as vscode from "vscode";

import { promises as fsPromises } from "fs";
import { PreviewEditPanel } from "./webview_panel";
let currentContext: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext)
{
	currentContext = context;
	let readResx = vscode.commands.registerCommand(
		"resxpress.resxpreview",
		async () =>
		{
			await viewResx();
		}
	);

	let sortByKeysCommand = vscode.commands.registerCommand(
		"resxpress.sortbykeys",
		async () => await sortByKeys()
	);
	context.subscriptions.push(readResx);
	context.subscriptions.push(sortByKeysCommand);
	context.subscriptions.push(
		vscode.commands.registerCommand('resxpress.newpreview', async () =>
		{
			await newPreview();
		})
	);

	// context.subscriptions.push(
	// 	vscode.commands.registerCommand('catCoding.doRefactor', () => {
	// 		if (PreviewEditPanel.currentPanel) {
	// 			PreviewEditPanel.currentPanel.doRefactor();
	// 		}
	// 	})
	// );

	if (vscode.window.registerWebviewPanelSerializer)
	{
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(PreviewEditPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any)
			{
				console.log(`Got state: ${state}`);
				PreviewEditPanel.revive(webviewPanel, context.extensionUri, '');
			}
		});
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }

export async function sortByKeys()
{
	let unordered: any = await parseResx();

	var ordered: any = {};
	if (unordered instanceof Object)
	{
		Object.keys(unordered)
			.sort()
			.forEach(function (key: string)
			{
				ordered[key] = unordered[key];
			});

		var XMLWriter = require("xml-writer");
		var xw = new XMLWriter(true);
		xw.startDocument();
		xw.startElement("root");
		Object.keys(ordered).forEach(function (key: string)
		{
			xw.startElement("data");
			xw.writeAttribute("name", key).writeAttribute("xml:space", "preserve");
			xw.startElement("value").text(ordered[key]['value']);
			xw.endElement();
			if (ordered[key]['comment'])
			{
				xw.startElement("comment").text(ordered[key]['comment']);
				xw.endElement();
			}
			
			xw.endElement();
		});
		xw.endElement();
		xw.endDocument();

		let editor = vscode.window.activeTextEditor;
		if (editor)
		{
			let document = editor.document;

			var start = new vscode.Position(0, 0);
			var lastButOne = document.lineAt(document.lineCount - 1);
			var end = new vscode.Position(document.lineCount, lastButOne.range.end.character);

			var ranger = new vscode.Range(start, end);
			editor.edit(editBuilder =>
			{
				editBuilder.replace(ranger, xw.toString());
			});
		}
	}
}

function parseResx()
{
	let jsObj = new Promise((res, rej) =>
	{
		return rej;
	});
	var currentFileName = vscode.window.activeTextEditor?.document.fileName;
	if (currentFileName)
	{
		var ResxParser = require("resx-parser");
		var options = {
			fnTransformValue: function (id: any, value: any, comment: any)
			{
				return {
					value: value,
					comment: comment
				};
			}
		};
		//var options = { convertIdCase: "" };
		var parser = new ResxParser(options);

		jsObj = new Promise((resolve, reject) =>
		{
			parser.parseResxFile(currentFileName, (err: Error, result: any) =>
			{
				if (err)
				{
					return reject(err);
				} else
				{
					return resolve(result);
				}
			});
		});
	}

	return jsObj;
}

export async function viewResx()
{
	const path = require("path");

	var currentFileName = vscode.window.activeTextEditor?.document.fileName;
	var ext = path.parse(currentFileName).ext;
	if (ext !== ".resx")
	{
		await vscode.window.showErrorMessage("Not a Resx file.");
		return;
	}
	if (currentFileName)
	{
		var fileNameNoExt = currentFileName.substring(
			0,
			currentFileName.lastIndexOf(".")
		);
		var result = await parseResx();
		if (result)
		{
			if (!(result instanceof Error))
			{
				await displayJson(fileNameNoExt, result);
			}
		}
	}
}

async function newPreview()
{
	var json = await parseResx();
	await displayJsonInHtml(json);

}
async function displayJson(filename: any, jsonData: any)
{
	let mdFile = filename + ".md";

	let fileContent = "| Key | Value | Comment |" + "\n";
	fileContent += "| --- | --- | --- |" + "\n";

	for (const property in jsonData)
	{

		const regexM = /[\\`*_{}[\]()#+.!|-]/g;
		//clean up key
		var propertyString = property;

		propertyString = property.replace(regexM, "\\$&");
		propertyString = propertyString.replace(/\r?\n/g, "<br/>");

		var valueString = jsonData[property]['value'];
		var commentString = jsonData[property]['comment'];
		//clean up value
		valueString = valueString.replace(regexM, "\\$&");
		valueString = valueString.replace(/\r?\n/g, "<br/>");
		commentString = commentString.replace(regexM, "\\$&");
		commentString = commentString.replace(/\r?\n/g, "<br/>");

		fileContent += "|" + propertyString + " | " + valueString + " | " + commentString + "|\n";

	}

	await fsPromises.writeFile(mdFile, fileContent);

	let uri = vscode.Uri.file(mdFile);

	await vscode.commands.executeCommand("vscode.open", uri);
	await vscode.commands.executeCommand("markdown.showPreview");
	await vscode.commands.executeCommand("markdown.preview.refresh");
	await vscode.commands.executeCommand("workbench.action.previousEditor");
	await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
}


async function displayJsonInHtml(jsonData: any)
{

	var _content = '';
	for (const property in jsonData)
	{
		_content += `<tr>
		<td>${property}</td>
		<td>${jsonData[property]['value']}</td>
		<td>${jsonData[property]['comment']}</td>
	</tr>`;

	}
	PreviewEditPanel.createOrShow(currentContext.extensionUri, _content);

}
