import * as vscode from 'vscode';

import { promises as fsPromises } from 'fs';
import { PreviewEditPanel } from "./webview_panel";
import * as path from "path";
import * as xmljs from 'xml-js'
import { ResxEditorProvider } from './resxEditorProvider';
import { NotificationService } from './notificationService';
import * as childProcess from 'child_process';
import { ResxEditor } from './resxEditor';


let currentContext: vscode.ExtensionContext;
var shouldGenerateStronglyTypedResourceClassOnSave: boolean = false

export function activate(context: vscode.ExtensionContext) {
	try {
		const notificationService = new NotificationService(context);
		notificationService.promptForReviewAsync();
	}
	catch (error) {
		console.error(error);
	}

	currentContext = context;
	loadConfiguration();

	vscode.workspace.onDidChangeConfiguration((configChangeEvent: vscode.ConfigurationChangeEvent) => {
		loadConfiguration();
	});

	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand(
			"resxpress.resxpreview",
			async () => {
				vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						cancellable: false,
						title: "ResXpress",
					},
					async (p) => {
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
			async () => {
				vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						cancellable: false,
						title: "ResXpress",
					},
					async (p) => {
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
			async () => {
				vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						cancellable: false,
						title: "ResXpress",
					},
					async (p) => {
						p.report({ message: "Showing Web Preview" });
						await newPreview();
					}
				);
			}
		)
	);
	
	let resxEditor = new ResxEditor(context);
	context.subscriptions.push(vscode.commands.registerTextEditorCommand("resxpress.resxeditor", async () => {
		//
	}));

	context.subscriptions.push(ResxEditorProvider.register(context));

	vscode.workspace.onDidSaveTextDocument(async (documentSavedEvent) => {
		try {
			var isResx = documentSavedEvent.fileName.endsWith(".resx");
			if (isResx && shouldGenerateStronglyTypedResourceClassOnSave) {
				await runResGenAsync(documentSavedEvent.fileName);
			}
		}
		catch (error) {
			var errorMessage = "";
			if (error instanceof Error) {
				errorMessage = error.message;
			}
			else if (typeof error === "string") {
				errorMessage = error;
			}
			console.error(error);
			vscode.window.showErrorMessage(errorMessage);
		}
	});
}

function loadConfiguration() {
	let resxConfig = vscode.workspace.getConfiguration("resxpress.configuration");
	shouldGenerateStronglyTypedResourceClassOnSave = resxConfig.get<boolean>("generateStronglyTypedResourceClassOnSave") ?? false;
}

export async function runResGenAsync(fileName: string): Promise<void> {
	try {
		if (process.platform != "win32") {
			let pathFile = path.parse(fileName);
			let fileNameNoExt = pathFile.name;

			//best effort to get existing resource class file name
			let files = await vscode.workspace.findFiles(`**/${fileNameNoExt}.Designer.*`, '**/*.dll', 1)

			var resourceFileName = "";
			var ext = "cs"
			if (files.length === 1) {
				let filePath = path.parse(files[0].path);
				ext = filePath.ext.substring(1)
				resourceFileName = `${path.join(pathFile.dir, filePath.name)}.${ext}`
			}
			else {
				resourceFileName = `${path.join(pathFile.dir, pathFile.name)}.Designer.${ext}`
			}

			let nameSpace = path.basename(path.dirname(fileName))
			let parameter = `/str:${ext},${nameSpace},,${resourceFileName}`
			console.log('Parameter: ' + parameter);
			const cli = childProcess.spawn('ResGen', [`${fileName}`, '/useSourcePath', parameter], { stdio: ['pipe'] });

			var stdOutData = "";
			var stdErrData = "";
			cli.stdout.setEncoding("utf8");
			cli.stdout.on("data", data => {
				stdOutData += data;
			});

			cli.stderr.setEncoding("utf8");
			cli.stderr.on("data", data => {
				stdErrData += data;
			});

			let promise = new Promise<void>((resolve, reject) => {
				cli.on("close", (exitCode: Number) => {
					if (exitCode !== 0) {
						reject();
						console.log(stdErrData)
					}
					else {
						resolve();
						console.log(stdOutData)
					}
				});
			});
			return promise;
		}
		else {
			if (vscode.window.activeTextEditor != null) {
				let document = vscode.window.activeTextEditor.document;
				var jsObj = xmljs.xml2js(document.getText() ?? "");

				var sb = "";
				var nameSpace = "ProjectNameSpace";
				let accessModifier = "public"
				var fileName = "Resource1";//vscode.window.activeTextEditor?.document.fileName  ?? "Resources";
				sb += `namespace ${nameSpace} 
{
	using System;


	/// <summary>
	///   A strongly-typed resource class, for looking up localized strings, etc.
	/// </summary>
	// This class was auto-generated by the StronglyTypedResourceBuilder
	// class via a tool like ResGen or Visual Studio.
	// To add or remove a member, edit your .ResX file then rerun ResGen
	// with the /str option, or rebuild your VS project.
	[global::System.CodeDom.Compiler.GeneratedCodeAttribute("System.Resources.Tools.StronglyTypedResourceBuilder", "4.0.0.0")]
	[global::System.Diagnostics.DebuggerNonUserCodeAttribute()]
	[global::System.Runtime.CompilerServices.CompilerGeneratedAttribute()]
	${accessModifier} class ${fileName} 
	{
		private static global::System.Resources.ResourceManager resourceMan;

		private static global::System.Globalization.CultureInfo resourceCulture;

		[global::System.Diagnostics.CodeAnalysis.SuppressMessageAttribute("Microsoft.Performance", "CA1811:AvoidUncalledPrivateCode")]
		${accessModifier} ${fileName}()
		{
		}

		/// <summary>
		///   Returns the cached ResourceManager instance used by this class.
		/// </summary>
		[global::System.ComponentModel.EditorBrowsableAttribute(global::System.ComponentModel.EditorBrowsableState.Advanced)]
		${accessModifier} static global::System.Resources.ResourceManager ResourceManager
		{
			get
			{
				if (object.ReferenceEquals(resourceMan, null))
				{
					global::System.Resources.ResourceManager temp = new global::System.Resources.ResourceManager("ConsoleApp3.Resource1", typeof(Resource1).Assembly);
					resourceMan = temp;
				}
				return resourceMan;
			}
		}

		/// <summary>
		///   Overrides the current thread's CurrentUICulture property for all
		///   resource lookups using this strongly typed resource class.
		/// </summary>
		[global::System.ComponentModel.EditorBrowsableAttribute(global::System.ComponentModel.EditorBrowsableState.Advanced)]
		${accessModifier} static global::System.Globalization.CultureInfo Culture
		{
			get
			{
				return resourceCulture;
			}
			set
			{
				resourceCulture = value;
			}
		}
		
		`;

				jsObj.elements[0].elements.forEach((element: any) => {
					if (element.name === "data") {
						sb += `
	/// <summary>
	/// Looks up a localized string similar to ${element.elements[0].text}.
	/// </summary>
	${accessModifier} static string ${element.attributes.name} => ResourceManager.GetString("${element.attributes.name}", resourceCulture);`;
					}

				});


				sb += `}
    }`;
				console.log(sb);
			}


		}


	}
	catch (error) {
		throw error;
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }

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
		}
		else if (typeof error === "string") {
			errorMessage = error;
		}
		vscode.window.showErrorMessage(errorMessage);
		console.error(error);
	}
}

function sortKeyValuesResx(reverse?: boolean) {
	try {
		var text = vscode.window.activeTextEditor?.document?.getText() ?? "";
		var jsObj = xmljs.xml2js(text);

		var dataList = new Array();
		var sorted = new Array();
		jsObj.elements[0].elements.forEach((x: any) => {
			if (x.name === "data") {
				dataList.push(x);
			}
			else {
				sorted.push(x);
			}
		});

		var dataListsorted = dataList.sort((x1: any, x2: any) => {
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
	}
	catch (error) {
		var errorMessage = "";
		if (error instanceof Error) {
			errorMessage = error.message;
		}
		else if (typeof error === "string") {
			errorMessage = error;
		}
		vscode.window.showErrorMessage(errorMessage);
		console.error(error);
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
	var dataList = new Array();
	var sorted = new Array();
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
					await vscode.commands.executeCommand(
						"workbench.action.previousEditor"
					);
					await vscode.commands.executeCommand(
						"workbench.action.closeActiveEditor"
					);
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
		}
		else if (typeof error === "string") {
			errorMessage = error;
		}
		vscode.window.showErrorMessage(errorMessage);
		console.error(error);
	}
}

async function openResxEditorAsync() {
	//let resxEditor = new ResxEditor(this.ExtensionContext);
}

async function displayJsonInHtml(jsonData: any[], filename: string) {
	try {
		var _content = "";

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
			_content += `<tr>
				<td>${element.attributes.name}</td>
				<td>${valueStr}</td>
				<td>${commentstr}</td>
			</tr>`;
		});
		var pathObj = path.parse(filename);
		var title = pathObj.name + pathObj.ext;

		PreviewEditPanel.createOrShow(currentContext.extensionUri, title, _content);
	}
	catch (error) {
		var errorMessage = "";
		if (error instanceof Error) {
			errorMessage = error.message;
		}
		else if (typeof error === "string") {
			errorMessage = error;
		}
		vscode.window.showErrorMessage(errorMessage);
		console.error(error);
	}
}
