import * as vscode from "vscode";

import { promises as fsPromises } from "fs";
import { PreviewEditPanel } from "./webview_panel";
import * as path from "path";
var xmlWriter = require("xml-writer");
var resxParser = require("resx-parser");

let currentContext: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext)
{

	currentContext = context;

	context.subscriptions.push(vscode.commands.registerTextEditorCommand(
		"resxpress.resxpreview",
		async () =>
		{
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				cancellable: false,
				title: "ResXpress"
			}, async (p) =>
			{
				p.report({ message: "Showing Preview" });
				await displayAsMarkdown();
			});
		}
	));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand(
		"resxpress.sortbykeys",
		async () =>
		{
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				cancellable: false,
				title: "ResXpress"
			}, async (p) =>
			{
				p.report({ message: "Showing Preview" });
				await sortByKeys();
			});
		}
	));
	context.subscriptions.push(vscode.commands.registerTextEditorCommand("resxpress.newpreview",
		async () =>
		{
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				cancellable: false,
				title: "ResXpress"
			}, async (p) =>
			{
				p.report({ message: "Showing Preview" });
				await newPreview();
			});
		}));



	if (vscode.window.registerWebviewPanelSerializer)
	{
		vscode.window.registerWebviewPanelSerializer(PreviewEditPanel.viewType, {
			async deserializeWebviewPanel(
				webviewPanel: vscode.WebviewPanel,
				state: any
			)
			{
				console.log(`Got state: ${state}`);
				PreviewEditPanel.revive(webviewPanel, context.extensionUri, "");
			},
		});
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }

async function sortByKeys()
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

		var xw = new xmlWriter(true);
		xw.startDocument();
		xw.startElement("root");
		Object.keys(ordered).forEach(function (key: string)
		{
			xw.startElement("data");
			xw.writeAttribute("name", key).writeAttribute("xml:space", "preserve");
			xw.startElement("value").text(ordered[key]["value"]);
			xw.endElement();
			if (ordered[key]["comment"])
			{
				xw.startElement("comment").text(ordered[key]["comment"]);
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
			var lastButOne = document.lineAt(document.lineCount - 1);

			var ranger = new vscode.Range(
				0,
				0,
				document.lineCount,
				lastButOne.range.end.character
			);

			editor.edit((editBuilder) =>
			{
				editBuilder.replace(ranger, xw.toString());
			});
		}
	}
}

function parseResx()
{

	var currentFileName = vscode.window.activeTextEditor?.document.fileName;
	if (currentFileName)
	{

		var options = {
			fnTransformValue: function (id: any, value: any, comment: any)
			{
				return {
					value: value,
					comment: comment,
				};
			},
		};

		var parser = new resxParser(options);

		var jsObj = new Promise((resolve, reject) =>
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
		return jsObj;
	}


}


async function newPreview()
{
	var json = await parseResx();
	var currentFileName = vscode.window.activeTextEditor?.document.fileName;
	if (currentFileName)
	{
		await displayJsonInHtml(json, currentFileName);
	}

}

async function displayAsMarkdown()
{
	var pathObj = path.parse(vscode.window.activeTextEditor?.document.fileName ?? '');
	if (pathObj)
	{
		if (pathObj.ext !== ".resx")
		{
			await vscode.window.showErrorMessage("Not a Resx file.");
			return;
		}
		const jsonData: any = await parseResx();
		if (!(jsonData instanceof Error))
		{

			var currentFileName = vscode.window.activeTextEditor?.document.fileName;
			if (currentFileName)
			{
				var fileNameNoExt = vscode.window.activeTextEditor?.document.fileName.substring(
					0,
					currentFileName.lastIndexOf(".")
				);
				let mdFile = fileNameNoExt + ".md";

				let fileContent = `### ${pathObj.name} Preview\n\n| Key | Value | Comment |\n`;
				fileContent += "| --- | --- | --- |" + "\n";

				for (const property of Object.keys(jsonData))
				{
					const regexM = /[\\`*_{}[\]()#+.!|-]/g;
					//clean up key
					var propertyString = property;

					propertyString = property.replace(regexM, "\\$&");
					propertyString = propertyString.replace(/\r?\n/g, "<br/>");

					var valueString = jsonData[property]["value"];
					var commentString = jsonData[property]["comment"];
					//clean up value
					valueString = valueString.replace(regexM, "\\$&");
					valueString = valueString.replace(/\r?\n/g, "<br/>");
					commentString = commentString.replace(regexM, "\\$&");
					commentString = commentString.replace(/\r?\n/g, "<br/>");

					fileContent += `| ${propertyString} | ${valueString} | ${commentString} |\n`;
				}

				await fsPromises.writeFile(mdFile, fileContent);

				let uri = vscode.Uri.file(mdFile);

				await vscode.commands.executeCommand("vscode.open", uri);
				await vscode.commands.executeCommand("markdown.showPreview");
				await vscode.commands.executeCommand("markdown.preview.refresh");
				await vscode.commands.executeCommand("workbench.action.previousEditor");
				await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
			}


		} else
		{
			vscode.window.showErrorMessage("Error parsing resx data");
		}
	} else
	{
		vscode.window.showErrorMessage("Error finding path of the file");
	}


}

async function displayJsonInHtml(jsonData: any, filename: string)
{
	var _content = "";
	for (const property of Object.keys(jsonData))
	{
		_content += `<tr>
			<td>${property}</td>
			<td>${jsonData[property]["value"]}</td>
			<td>${jsonData[property]["comment"]}</td>
		</tr>`;
	}
	var pathObj = path.parse(filename);
	var title = pathObj.name + pathObj.ext;

	PreviewEditPanel.createOrShow(currentContext.extensionUri, title, _content);
}
