import * as vscode from "vscode";

import { promises as fsPromises } from "fs";
import { PreviewEditPanel } from "./webview_panel";
import * as path from "path";
import * as xmljs from "xml-js";


let currentContext: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext)
{
	currentContext = context;

	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand(
			"resxpress.resxpreview",
			async () =>
			{
				vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						cancellable: false,
						title: "ResXpress",
					},
					async (p) =>
					{
						p.report({ message: "Showing Preview" });
						await displayAsMarkdown();
					}
				);
			}
		)
	);

	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand(
			"resxpress.sortbykeys",
			async () =>
			{
				vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						cancellable: false,
						title: "ResXpress",
					},
					async (p) =>
					{
						p.report({ message: "Sorting by keys" });
						await sortByKeys();
					}
				);
			}
		)
	);
	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand(
			"resxpress.newpreview",
			async () =>
			{
				vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						cancellable: false,
						title: "ResXpress",
					},
					async (p) =>
					{
						p.report({ message: "Showing Web Preview" });
						await newPreview();
					}
				);
			}
		)
	);
}

// this method is called when your extension is deactivated
export function deactivate() { }

async function sortByKeys()
{
	try
	{
		let unordered: any = sortKeyValuesResx();

		let editor = vscode.window.activeTextEditor;

		if (editor)
		{
			let document = editor.document;

			var ranger = new vscode.Range(0, 0, document.lineCount, 0);

			editor.edit((editBuilder) =>
			{
				editBuilder.replace(ranger, unordered);
			});
		}
	} catch (error)
	{
		console.error(error);

		vscode.window.showErrorMessage(error.message);
	}
}

function sortKeyValuesResx(revere?: boolean)
{
	try
	{
		var text = vscode.window.activeTextEditor?.document?.getText() ?? "";
		var jsObj = xmljs.xml2js(text);

		var dataList = new Array();
		var sorted = new Array();
		jsObj.elements[0].elements.forEach((x: any) =>
		{
			if (x.name === "data")
			{
				dataList.push(x);
			} else
			{
				sorted.push(x);
			}
		});
		console.log(dataList);
		var dataListsorted = dataList.sort((x1: any, x2: any) =>
		{
			return x1.attributes.name < x2.attributes.name
				? -1
				: x1.attributes.name > x2.attributes.name
					? 1
					: 0;
		});

		sorted.push.apply(sorted, dataListsorted);
		jsObj.elements[0].elements = sorted;

		var xml = xmljs.js2xml(jsObj, { spaces: 4 });

		return xml;
	} catch (error: any)
	{
		console.error(error);

		vscode.window.showErrorMessage(error.message);
	}
}


function getDataJs() : any[]{
	var text = vscode.window.activeTextEditor?.document?.getText() ?? "";
	var jsObj:any = xmljs.xml2js(text, {compact:true});
	var dataList = new Array();
	// jsObj.elements[0].elements.forEach((x: any) =>
	// {
	// 	if (x.name === "data")
	// 	{
	// 		dataList.push(x);
	// 	}
	// });

	console.log(jsObj);
	return jsObj.root.data;
}
async function newPreview()
{
	var text = vscode.window.activeTextEditor?.document?.getText() ?? "";
	var jsObj = xmljs.xml2js(text);
	var dataList = new Array();
	var sorted = new Array();
	jsObj.elements[0].elements.forEach((x: any) =>
	{
		if (x.name === "data")
		{
			dataList.push(x);
		} else
		{
			sorted.push(x);
		}
	});
	console.log(dataList);
	var currentFileName = vscode.window.activeTextEditor?.document.fileName;
	if (currentFileName)
	{
		await displayJsonInHtml(dataList, currentFileName);
	}
}


// Markdown Preview
async function displayAsMarkdown()
{
	try
	{
		var pathObj = path.parse(
			vscode.window.activeTextEditor?.document.fileName ?? ""
		);
		if (pathObj)
		{
			if (pathObj.ext !== ".resx")
			{
				await vscode.window.showErrorMessage("Not a Resx file.");
				return;
			}
			const jsonData: any[] = getDataJs();
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

					for (const jsObj of jsonData)
					{
						const regexM = /[\\`*_{}[\]()#+.!|-]/g;
						//clean up key
						var property =  jsObj._attributes.name;
						var propertyString = property;

						propertyString = property.replace(regexM, "\\$&");
						propertyString = property.replace(/\r?\n/g, "<br/>");

						var valueString = jsObj.value?._text;
						var commentString = jsObj.comment?._text ?? "";

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
					await vscode.commands.executeCommand(
						"workbench.action.previousEditor"
					);
					await vscode.commands.executeCommand(
						"workbench.action.closeActiveEditor"
					);
				}
			} else
			{
				vscode.window.showErrorMessage("Error parsing resx data");
			}
		} else
		{
			vscode.window.showErrorMessage("Error finding path of the file");
		}
	} catch (error)
	{
		console.error(error);
		vscode.window.showErrorMessage(error.message);
	}
}

async function displayJsonInHtml(jsonData: any[], filename: string)
{
	try
	{
		var _content = "";

		jsonData.forEach((element) =>
		{
			var valueStr = "";
			var commentstr = "";
			element.elements.forEach((subElement: any) =>
			{
				if (subElement.name === "value" && subElement.elements?.length >0)
				{
					valueStr = subElement.elements[0].text;
				} 
				else if (subElement.name === "comment" && subElement.elements?.length >0)
				{
					commentstr = subElement.elements[0].text;
				}
			});
			_content += `<tr>
				<td>${element.attributes.name}</td>
				<td>${valueStr}</td>
				<td>${commentstr}</td>
			</tr>`;
		});
		var pathObj = path.parse(filename);
		var title = pathObj.name + pathObj.ext;

		PreviewEditPanel.createOrShow(currentContext.extensionUri, title, _content);
	} catch (error)
	{
		vscode.window.showErrorMessage(error.message);
		console.error(error);
	}
}
