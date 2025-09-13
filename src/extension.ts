import * as vscode from "vscode";

import { promises as fsPromises } from "fs";
import { PreviewEditPanel } from "./previewEditPanel";
import * as path from "path";
import *  as xmljs from "xml-js";
import { ResxEditorProvider } from "./resxEditorProvider";
import { NotificationService } from "./notificationService";
import { FileHelper } from "./fileHelper";
import { TextInputBoxOptions } from "./textInputBoxOptions";
import { Constants } from "./constants";
import { Settings } from "./settings";
import { Logger } from "./logger";


let currentContext: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
	try {
		const notificationService = new NotificationService(context);
		notificationService.promptForReviewAsync();
	}
	catch (error) {
		if (error instanceof Error) {
			Logger.instance.error(error);
		}
	}

	currentContext = context;
	loadConfiguration();

	vscode.workspace.onDidChangeConfiguration(loadConfiguration);

	context.subscriptions.push(vscode.commands.registerTextEditorCommand(Constants.Commands.resxpreview,
		async () => {
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				cancellable: false,
				title: Constants.extensionName,
			},
				async (p) => {
					p.report({ message: "Showing Preview" });
					await displayAsMarkdown();
				}
			);
		}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand(Constants.Commands.sortbykeys,
		async () => {
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				cancellable: false,
				title: Constants.extensionName,
			}, async (p) => {
				p.report({ message: "Sorting by keys" });
				await sortByKeys();
			});
		}));

	context.subscriptions.push(vscode.commands.registerTextEditorCommand(Constants.Commands.newpreview,
		async () => {
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				cancellable: false,
				title: Constants.extensionName
			}, async (progress) => {
				progress.report({ message: "Showing Web Preview" });
				await newPreview();
			});
		}));

	context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.setNameSpace, async (uri: vscode.Uri) => await setNamespace(uri)))
	context.subscriptions.push(vscode.commands.registerCommand(Constants.Commands.createResxFile, async (uri: vscode.Uri) => await createResxFile(uri)))
	context.subscriptions.push(vscode.commands.registerTextEditorCommand(Constants.Commands.resxeditor, async () => await newPreview()));

	context.subscriptions.push(ResxEditorProvider.register(context));

	vscode.workspace.onDidSaveTextDocument(async (document) => {
		try {
			var isResx = document.fileName.endsWith(".resx");
			if (isResx && Settings.shouldGenerateStronglyTypedResourceClassOnSave) {
				await runResGenAsync(document);
			}
		}
		catch (error) {
			var errorMessage = "";
			if (error instanceof Error) {
				Logger.instance.error(error);
				errorMessage = error.message;
			}
			else if (typeof error === "string") {
				errorMessage = error;
			}
			vscode.window.showErrorMessage(errorMessage);
		}
	});
	Logger.instance.info(`Extension ${context.extension.id} activated`);
}

function loadConfiguration() {
	let resxConfig = vscode.workspace.getConfiguration(`${Constants.resxpress}.${Constants.configuration}`);
	Settings.shouldGenerateStronglyTypedResourceClassOnSave = resxConfig.get<boolean>(Constants.Configuration.generateStronglyTypedResourceClassOnSave) ?? false;
	Settings.shouldUseFileScopedNamespace = resxConfig.get<boolean>(Constants.Configuration.useFileScopedNamespace) ?? true;
	Settings.indentSpaceLength = resxConfig.get<number>(Constants.Configuration.indentSpaceLength) ?? 4;
	Settings.enableLocalLogs = resxConfig.get<boolean>(Constants.Configuration.enableLocalLogs) ?? false;
	Logger.instance.setIsEnabled(Settings.enableLocalLogs);
}

function convertToPascalCase(input: string): string {
	// Remove special characters and keep alphanumeric characters and spaces
	const sanitized = input.replace(/[^a-zA-Z0-9_ ]/g, "");

	// Split the string into words by spaces
	const words = sanitized.split(" ");

	// PascalCase
	const pascalCaseWords = words.map(word => {
		if (word.length === 0) return "";
		// If word starts with uppercase, keep it; otherwise, capitalize
		return word[0].toUpperCase() + word.slice(1);
	});

	// Join all the words
	let pascalCaseString = pascalCaseWords.join("");

	// If the resulting string starts with a digit, prefix it with an underscore
	if (/^\d/.test(pascalCaseString)) {
		pascalCaseString = "_" + pascalCaseString;
	}

	return pascalCaseString;
}

export async function runResGenAsync(document: vscode.TextDocument): Promise<void> {
	let filename = FileHelper.getFileNameNoExt(document);
	let csharpFileName = "Resources.cs";
	if (filename !== null) {
		if (filename.includes(".")) {
			//Dont create separate C# resources file for different cultures
			return;
		}
		csharpFileName = `${filename}.Designer.cs`;
	}

	let nameSpace = await FileHelper.tryGetNamespace(document);

	if (nameSpace === null || nameSpace === "") {
		nameSpace = path.basename(path.dirname(filename));
	}


	let documentText = document.getText();
	if (documentText.length > 0) {
		var jsObj = xmljs.xml2js(documentText);
		var resourceCSharpClassText = "";
		let accessModifier = "public";
		let workspacePath = FileHelper.getDirectory(document);
		var spaces = Settings.shouldUseFileScopedNamespace ? "" : "    ";
		resourceCSharpClassText += `namespace ${nameSpace}${Settings.shouldUseFileScopedNamespace ? ";" : ""}
${Settings.shouldUseFileScopedNamespace ? "" : "{"}
${spaces}/// <summary>
${spaces}///   A strongly-typed resource class, for looking up localized strings, etc.
${spaces}/// </summary>
${spaces}// This class was auto-generated by the Visual Studio Code Extension PrateekMahendrakar.resxpress
${spaces}[global::System.CodeDom.Compiler.GeneratedCodeAttribute("System.Resources.Tools.StronglyTypedResourceBuilder", "4.0.0.0")]
${spaces}[global::System.Diagnostics.DebuggerNonUserCodeAttribute()]
${spaces}[global::System.Runtime.CompilerServices.CompilerGeneratedAttribute()]
${spaces}${accessModifier} class ${filename} 
${spaces}{
${spaces}	private static global::System.Resources.ResourceManager resourceMan;
${spaces}	[global::System.Diagnostics.CodeAnalysis.SuppressMessageAttribute("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
${spaces}	${accessModifier} ${filename}()
${spaces}	{
${spaces}	}
${spaces}	/// <summary>
${spaces}	///   Returns the cached ResourceManager instance used by this class.
${spaces}	/// </summary>
${spaces}	[global::System.ComponentModel.EditorBrowsableAttribute(global::System.ComponentModel.EditorBrowsableState.Advanced)]
${spaces}	${accessModifier} static global::System.Resources.ResourceManager ResourceManager
${spaces}	{
${spaces}		get
${spaces}		{
${spaces}			if (object.ReferenceEquals(resourceMan, null))
${spaces}			{
${spaces}				global::System.Resources.ResourceManager temp = new global::System.Resources.ResourceManager("${nameSpace}.${filename}", typeof(${filename}).Assembly);
${spaces}				resourceMan = temp;
${spaces}			}
${spaces}			return resourceMan;
${spaces}		}
${spaces}	}
${spaces}	/// <summary>
${spaces}	///   Overrides the current thread's CurrentUICulture property for all
${spaces}	///   resource lookups using this strongly typed resource class.
${spaces}	/// </summary>
${spaces}	[global::System.ComponentModel.EditorBrowsableAttribute(global::System.ComponentModel.EditorBrowsableState.Advanced)]
${spaces}	${accessModifier} static global::System.Globalization.CultureInfo Culture { get; set; }`;

		if (jsObj.elements[0].elements.length > 0) {
			jsObj.elements[0].elements.forEach((element: any) => {
				if (element.name === "data") {
					const resourceKey = element.attributes.name;
					let valueElementParent = element.elements.filter((x: any) => x.name === "value")?.[0];
					let value: string = valueElementParent?.elements?.length > 0 ? valueElementParent.elements[0].text : "";
					value = value.toString().replace(/(?:\r\n|\r|\n)/g, "\n		/// ");
					if (resourceKey) {
						let propertyName = convertToPascalCase(resourceKey);
						resourceCSharpClassText += `
	
${spaces}	/// <summary>
${spaces}	/// Looks up a localized string similar to ${value}.
${spaces}	/// </summary>
${spaces}	${accessModifier} static string ${propertyName} => ResourceManager.GetString("${resourceKey}", Culture);`;
					}
				}
			});
		}
		else {
			resourceCSharpClassText += `
${spaces}}`;
		}


		resourceCSharpClassText += `
${spaces}}
${Settings.shouldUseFileScopedNamespace ? "" : "}"}`;
		Logger.instance.info(resourceCSharpClassText);

		if (workspacePath.length > 0) {
			let pathToWrite = path.join(workspacePath, csharpFileName);
			await FileHelper.writeToFile(pathToWrite, resourceCSharpClassText);
		}
	}
}


export function deactivate() {
	Logger.instance.info(`${Constants.resxpress} deactivated`);
}

async function sortByKeys() {
	try {
		let unordered: any = sortKeyValuesResx();

		let editor = vscode.window.activeTextEditor;

		if (editor) {
			let document = editor.document;

			var ranger = new vscode.Range(0, 0, document.lineCount, 0);

			editor.edit((editBuilder) => {
				editBuilder.replace(ranger, unordered);
			});
		}
	}
	catch (error) {
		var errorMessage = "";
		if (error instanceof Error) {
			errorMessage = error.message;
			Logger.instance.error(error);
		}
		else if (typeof error === "string") {
			errorMessage = error;
		}
		vscode.window.showErrorMessage(errorMessage);
	}
}

function sortKeyValuesResx(reverse?: boolean) {
	try {
		var text = vscode.window.activeTextEditor?.document?.getText() ?? "";
		var jsObj = xmljs.xml2js(text);

		var dataList: any = [];
		var sorted: any = [];
		jsObj.elements[0].elements.forEach((x: any) => {
			if (x.name === "data") {
				dataList.push(x);
			}
			else {
				sorted.push(x);
			}
		});

		var dataListsorted = dataList.sort((x1: any, x2: any) => {
			if (reverse) {
				return x1.attributes.name > x2.attributes.name ? -1 : x1.attributes.name < x2.attributes.name ? 1 : 0;
			} else {
				return x1.attributes.name < x2.attributes.name ? -1 : x1.attributes.name > x2.attributes.name ? 1 : 0;
			}
		});

		sorted.push(...dataListsorted);
		jsObj.elements[0].elements = sorted;

		var xml = xmljs.js2xml(jsObj, { spaces: Settings.indentSpaceLength });

		return xml;
	}
	catch (error) {
		var errorMessage = "";
		if (error instanceof Error) {
			errorMessage = error.message;
			Logger.instance.error(error);
		}
		else if (typeof error === "string") {
			errorMessage = error;
		}
		vscode.window.showErrorMessage(errorMessage);
	}
}

function getDataJs(): any[] {
	var text = vscode.window.activeTextEditor?.document?.getText() ?? "";
	var jsObj: any = xmljs.xml2js(text, { compact: true });
	return jsObj.root.data;
}

async function newPreview() {
	var text = vscode.window.activeTextEditor?.document?.getText() ?? "";
	var jsObj = xmljs.xml2js(text);
	var dataList: any = [];
	var sorted = [];
	jsObj.elements[0].elements.forEach((x: any) => {
		if (x.name === "data") {
			dataList.push(x);
		}
		else {
			sorted.push(x);
		}
	});

	var currentFileName = vscode.window.activeTextEditor?.document.fileName;
	if (currentFileName) {
		await displayJsonInHtml(dataList, currentFileName);
	}
}


// Markdown Preview
async function displayAsMarkdown() {
	try {
		var pathObj = path.parse(
			vscode.window.activeTextEditor?.document.fileName ?? ""
		);
		if (pathObj) {
			if (pathObj.ext !== ".resx") {
				await vscode.window.showErrorMessage("Not a Resx file.");
				return;
			}
			const jsonData: any[] = getDataJs();
			if (!(jsonData instanceof Error)) {
				var currentFileName = vscode.window.activeTextEditor?.document.fileName;
				if (currentFileName) {
					var fileNameNoExt = vscode.window.activeTextEditor?.document.fileName.substring(
						0,
						currentFileName.lastIndexOf(".")
					);
					let mdFile = fileNameNoExt + ".md";

					let fileContent = `### ${pathObj.name} Preview\n\n| Key | Value | Comment |\n`;
					fileContent += "| --- | --- | --- |" + "\n";

					for (const jsObj of jsonData) {
						const regexM = /[\\`*_{}[\]()#+.!|-]/g;
						//clean up key
						var property = jsObj._attributes.name;
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
					await vscode.commands.executeCommand("workbench.action.previousEditor");
					await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
				}
			}
			else {
				vscode.window.showErrorMessage("Error parsing resx data");
			}
		}
		else {
			vscode.window.showErrorMessage("Error finding path of the file");
		}
	}
	catch (error) {
		var errorMessage = "";
		if (error instanceof Error) {
			errorMessage = error.message;
			Logger.instance.error(error);
		}
		else if (typeof error === "string") {
			errorMessage = error;
		}
		vscode.window.showErrorMessage(errorMessage);
	}
}

async function displayJsonInHtml(jsonData: any[], filename: string) {
	try {
		var htmlContent = "";

		jsonData.forEach((element) => {
			var valueStr = "";
			var commentstr = "";
			element.elements.forEach((subElement: any) => {
				if (subElement.name === "value" && subElement.elements?.length > 0) {
					valueStr = subElement.elements[0].text;
				}
				else if (subElement.name === "comment" && subElement.elements?.length > 0) {
					commentstr = subElement.elements[0].text;
				}
			});
			htmlContent += `<tr>
				<td>${element.attributes.name}</td>
				<td>${valueStr}</td>
				<td>${commentstr}</td>
			</tr>`;
		});
		var pathObj = path.parse(filename);
		var title = pathObj.name + pathObj.ext;

		PreviewEditPanel.createOrShow(currentContext.extensionUri, title, htmlContent);
	}
	catch (error) {
		var errorMessage = "";
		if (error instanceof Error) {
			errorMessage = error.message;
			Logger.instance.error(error);
		}
		else if (typeof error === "string") {
			errorMessage = error;
		}
		vscode.window.showErrorMessage(errorMessage);
	}
}

function isStringRecord(obj: any): obj is Record<string, string> {
	if (obj === null)
		return false;

	if (typeof obj !== "object")
		return false;

	if (Array.isArray(obj))
		return false;

	if (Object.getOwnPropertySymbols(obj).length > 0)
		return false;

	return Object.getOwnPropertyNames(obj).every(p => typeof obj[p] === "string");
}

async function createOrUpdateNamespaceMappingFile(workspaceFolder: vscode.WorkspaceFolder, fileNameNoExt: string, namespace: string) {
	const workspacePath = workspaceFolder.uri.fsPath;
	if (workspacePath) {
		let pathToWrite = path.join(workspacePath, `.${Constants.namespaceMappingJsonPath}`);
		let content = await FileHelper.getFileText(pathToWrite);
		var didWrite = false;
		if (content.length > 0) {
			let namespaceMaps = JSON.parse(content);
			if (isStringRecord(namespaceMaps)) {
				namespaceMaps[fileNameNoExt] = namespace;
				await FileHelper.writeToFile(pathToWrite, JSON.stringify(namespaceMaps))
				didWrite = true;
			}
		}
		if (didWrite === false) {
			let rec: Record<string, string> = {};
			rec[fileNameNoExt] = namespace;
			await FileHelper.writeToFile(pathToWrite, JSON.stringify(rec))
		}
	}
}

export async function setNamespace(uri: vscode.Uri) {
	if (uri) {
		let parsedPath = path.parse(uri.fsPath);
		const fileName = parsedPath.name;
		if (fileName !== null) {
			const inputBoxOptions = new TextInputBoxOptions("Namespace", "", undefined, "Enter namespace", "Namespace", true);
			const namespaceValue = await vscode.window.showInputBox(inputBoxOptions);
			Logger.instance.info(`namespace entered : ${namespaceValue}`);
			if (namespaceValue) {
				let workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
				if (workspaceFolder) {
					await createOrUpdateNamespaceMappingFile(workspaceFolder, fileName, namespaceValue);
				}
			}
		}
	}
}

async function createResxFile(uri: vscode.Uri | null) {
	const resxFileNameOptions = new TextInputBoxOptions("New Resx File", "", undefined, "Enter Resx file name", ".resx", true);
	let fileName = await vscode.window.showInputBox(resxFileNameOptions);
	if (fileName && fileName.length > 0) {
		if (fileName.endsWith(".resx") === false) {
			fileName = `${fileName}.resx`;
		}
		const newResxFileNamespaceOptions = new TextInputBoxOptions(`namespace for ${fileName}`, "", undefined, `Enter namespace for ${fileName}`, "", true);
		const namespace = await vscode.window.showInputBox(newResxFileNamespaceOptions);
		if (namespace && namespace.length > 0) {
			const workspaceEdit = new vscode.WorkspaceEdit();
			let thisWorkspace = "";
			if (uri) {
				thisWorkspace = uri.fsPath;
			}
			else if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
				thisWorkspace = vscode.workspace.workspaceFolders[0].uri.fsPath;
			}
			else {
				vscode.window.showErrorMessage("Cannot create resx file!");
				return;
			}
			Logger.instance.info(`Creating file at ${thisWorkspace}`)
			const resxFilePath = path.join(thisWorkspace, fileName);
			Logger.instance.info(`Filename to be created: ${resxFilePath}`)
			// create a Uri for a file to be created
			const resxFileUri = vscode.Uri.file(resxFilePath);
			const content = `<?xml version="1.0" encoding="utf-8"?>
<root>
	<resheader name="resmimetype">
		<value>text/microsoft-resx</value>
	</resheader>
	<resheader name="version">
		<value>2.0</value>
	</resheader>
	<resheader name="reader">
		<value>System.Resources.ResXResourceReader, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</value>
	</resheader>
	<resheader name="writer">
		<value>System.Resources.ResXResourceWriter, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</value>
	</resheader>
	<!--Data-->
</root>`;

			let encoder = new TextEncoder();
			let uInt8Array = encoder.encode(content);
			// create an edit that will create a file
			workspaceEdit.createFile(resxFileUri, { ignoreIfExists: false, overwrite: false, contents: uInt8Array });

			//Create file
			const didApplyEdit = await vscode.workspace.applyEdit(workspaceEdit);
			if (didApplyEdit) {
				let document = await vscode.workspace.openTextDocument(resxFileUri);
				await vscode.window.showTextDocument(document);
				let workspaceFolder = vscode.workspace.getWorkspaceFolder(resxFileUri);

				if (workspaceFolder) {
					const fileNameNoExt = fileName.replace(".resx", "");
					await createOrUpdateNamespaceMappingFile(workspaceFolder, fileNameNoExt, namespace);
				}
				else {
					Logger.instance.warning(`Unable to locate workspaceFolder for ${resxFileUri.fsPath}`);
				}
			}
			else {
				vscode.window.showErrorMessage("Unable to add resx content");
			}
		}
		else {
			vscode.window.showErrorMessage(`Invalid namespace entered for ${fileName}`);
		}
	}
	else {
		vscode.window.showErrorMessage("Invalid resx file name entered");
	}
}
