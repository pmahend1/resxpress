// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "resxpress" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.resxpress', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('resxpress opened');
	});
	context.subscriptions.push(disposable);
	
	// let readResx = vscode.commands.registerTextEditorCommand('extension.resxpreview',
	// (textEditor: vscode.TextEditor,edit:vscode.TextEditorEdit)=>{
	// 	vscode.window.showInformationMessage('resx editor opened');

	// });
	let readResx = vscode.commands.registerCommand('extension.resxpreview',()=>{
		vscode.window.showInformationMessage('resx editor opened');
		viewResx();

	});
	context.subscriptions.push(readResx);
}

// this method is called when your extension is deactivated
export function deactivate() {}

export async function viewResx() {

	var resxConverter = require('resx2tsjs');
	//resxConverter.executeResxToTs('exampleApp.resources', '/Resources', '/App/Resources', true);
	resxConverter.executeResxToJson('/', '/src', true);

	var customers = new Array();
	customers.push(["Key", "Value"]);

	var currentfilename = vscode.window.activeTextEditor?.document.fileName;

	if(currentfilename){

	//console.log(currentfilename);
	const path = require('path');
	var filename_noext= currentfilename.substring(0, currentfilename.lastIndexOf('.')) ;
	var jsonfile = filename_noext+ ".json";
	var fs = require('fs').promises;
    const data = await fs.readFile(jsonfile);
	
	let jsondata = JSON.parse(data);

	var filedata = jsondata[path.parse(jsonfile).name];
	console.log(filedata);


	let fileContent = 'Key | Value'+ '&nbsp;' ;
	fileContent+='---|----'+ '&nbsp;' ;
	
	for (const property in filedata) 
	{
		//console.log(`${property}: ${filedata[property]}`);
		fileContent+=property +"|" + filedata[property] +  '&nbsp;';
	}
	var fs1 = require('fs');
	fs1.writeFile(filename_noext+".md", fileContent, (err: any) => {
		if (!err) {
		  console.log('success!!');
		}
	  });
	}
}

	//var myFile = new Blob([fileContent], {type: 'text/text/plain'});

    

