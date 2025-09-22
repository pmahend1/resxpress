import { emptyString } from "./constants";
import { nameof } from "./nameof";
import { WebpanelPostMessageKind } from "./webpanelMessageKind";
import { WebpanelPostMessage } from "./webpanelPostMessage";

// @ts-check
let currentResxJS: any = [];
const resxpressWebPanel = "resxpress.webpanel";
const tbody = "tbody";
const errorBlock = "errorBlock";
const key = "key";
const value = "value";
const comment = "comment";
const tr = "tr";
const td = "td";
const input = "input";
const tbl = "tbl";
const p = "p";
const text = "text";
const click = "click";
const deleteStr = "delete";
const X = "X";
const errorDuplicateKey = (key: string) => `Error: Data with ${key} already exists`;
const errorInvalidResx = "Error: Document is not valid resx";
const errorKeyValueMandatory = "Key and Value are both mandatory fields!";
const errorUpdateDuplicateKey = (key: string) => `Error while updating data : Data with ${key} already exists`;
const changeNamespaceButton = "changeNamespaceButton";
const addButton = "addButton";
const switchToTextEditorButton = "switchToTextEditorButton";
const message = "message";
const none = "none";

function logToConsole(text: string) {
	console.log(`${resxpressWebPanel}: ${text}`);
}

// Script run within the webview itself.
(function () {
	// @ts-ignore acquired
	const vscode = acquireVsCodeApi();

	let table = document.querySelector(tbody)!;

	const errorContainer = document.getElementById(errorBlock);

	function inputEvent(event: Event) {
		let currentElement = event.target;

		if (errorContainer !== null && currentElement instanceof HTMLInputElement) {
			errorContainer.innerText = emptyString;
			let idstr = currentElement.id;
			logToConsole(`${nameof(inputEvent)} for : ${idstr}`);
			var index = Number(idstr.split(".")[0]);
			if (index >= currentResxJS.length) {
				logToConsole(`${nameof(inputEvent)}.New: Index: ${index}. Current Resx Length: ${currentResxJS.length}`);
				var newObj: any = { _attributes: { name: emptyString, "xml:space": "preserve" }, value: { _text: emptyString } };
				const keyElement = document.getElementById(`${index}.${key}`) as HTMLInputElement;
				const valueElement = document.getElementById(`${index}.${value}`);
				const commentElement = document.getElementById(`${index}.${comment}`);

				if (keyElement instanceof HTMLInputElement && valueElement instanceof HTMLInputElement && commentElement instanceof HTMLInputElement) {
					if (keyElement.value && valueElement.value) {
						newObj._attributes.name = keyElement?.value ?? emptyString;
						newObj.value._text = valueElement?.value ?? emptyString;
						if (commentElement.value) {
							newObj.comment = { _text: commentElement?.value };
						}
						else {
							delete newObj.comment;
						}

						var pos = currentResxJS.map((x: any) => x?._attributes?.name).indexOf(newObj._attributes.name);

						//avoid adding data with same key
						if (pos === -1) {
							currentResxJS.push(newObj);
							logToConsole(`${nameof(inputEvent)}.New: ${JSON.stringify(newObj)}`);

							errorContainer.innerText = emptyString;
							errorContainer.style.display = emptyString;

							vscode.setState({ text: JSON.stringify(currentResxJS) });
							vscode.postMessage(new WebpanelPostMessage(
								WebpanelPostMessageKind.Add,
								JSON.stringify(newObj)
							));
						}
						else {
							logToConsole(`${nameof(inputEvent)}.New: Duplicate key found ${newObj._attributes.name}`);
							errorContainer.innerText = errorDuplicateKey(newObj._attributes.name);
							errorContainer.style.display = emptyString;
							return;
						}
					}
					else {
						errorContainer.innerText = errorKeyValueMandatory;
						errorContainer.style.display = emptyString;
						return;
					}
				}
			}
			else {
				var editingObj = currentResxJS[index];

				const keyElement = document.getElementById(`${index}.${key}`);
				const valueElement = document.getElementById(`${index}.${value}`);
				const commentElement = document.getElementById(`${index}.${comment}`);
				let isKeyChanged = false;
				let isValueChanged = false;
				let isCommentChanged = false;

				if (keyElement instanceof HTMLInputElement && valueElement instanceof HTMLInputElement && commentElement instanceof HTMLInputElement) {

					isKeyChanged = keyElement.value !== editingObj._attributes.name;
					isValueChanged = valueElement.value !== editingObj.value._text;
					isCommentChanged = (commentElement?.value ?? emptyString) !== (editingObj?.comment?._text ?? emptyString);

					logToConsole(`${nameof(inputEvent)}.Edit: anyDataChanged : ${isKeyChanged || isValueChanged || isCommentChanged}`);
					if (keyElement.value && valueElement.value) {
						if (!isKeyChanged && !isValueChanged && !isCommentChanged) {
							return;
						}

						logToConsole(`${nameof(inputEvent)}.Edit: Changing values`);
						editingObj._attributes.name = keyElement.value ?? emptyString;
						editingObj.value._text = valueElement.value ?? emptyString;
						if (commentElement?.value) {
							editingObj.comment = { _text: commentElement?.value };
						}
						else {
							delete editingObj.comment;
						}

						var tempArray = Array.from(currentResxJS);
						tempArray[index] = editingObj;

						var keyArray = tempArray.map((x: any) => x._attributes.name);

						logToConsole(`${nameof(inputEvent)}.Edit: keyArray is  ${JSON.stringify(keyArray)}`);
						if (new Set(keyArray).size !== keyArray.length) {
							logToConsole(`${nameof(inputEvent)}.Edit: edited Data key already exists`);
							errorContainer.innerText = errorUpdateDuplicateKey(editingObj._attributes.name)
							errorContainer.style.display = emptyString;
						}
						else {
							currentResxJS[index] = editingObj;
						}
					}
					else {
						errorContainer.innerText = errorInvalidResx;
						errorContainer.style.display = emptyString;
						return;
					}
				}
				if (isKeyChanged || isValueChanged || isCommentChanged) {
					let changeText = isKeyChanged ? "Key changed" : emptyString;
					changeText += isValueChanged ? (changeText ? ", Value changed" : "Value changed") : emptyString;
					changeText += isCommentChanged ? (changeText ? ", Comment changed" : "Comment changed") : emptyString;
					logToConsole(`${nameof(inputEvent)}.Edit: ${changeText}`);
					vscode.setState({ text: JSON.stringify(currentResxJS) });
					vscode.postMessage(new WebpanelPostMessage(
						WebpanelPostMessageKind.Update,
						JSON.stringify(currentResxJS)
					));
				}
			}
		}
	}

	function deleteEvent(event: MouseEvent) {
		logToConsole(`${nameof(deleteEvent)}: for ${event.target}`);
		const td = event.target as HTMLElement;
		let table = document.getElementById(tbl);

		if (errorContainer !== null && table && td) {
			let idstr: string = td.id;
			logToConsole(`Triggered td.id : ${idstr}`);
			errorContainer.innerText = emptyString;

			if (idstr && idstr.trim()) {
				let indices = idstr.split(".");

				if (indices.length > 0) {
					let index = Number(indices[0]);
					logToConsole(`${nameof(deleteEvent)}: index to be deleted: ${index}`)
					if (currentResxJS.length > index) {
						var deleteableObj = currentResxJS[index];

						//x=td -> tr -> tbody-> table
						let row = td.parentNode;
						if (row) {
							row.parentNode?.removeChild(row);
						}

						vscode.setState({ text: JSON.stringify(currentResxJS) });//always set the full list

						vscode.postMessage(new WebpanelPostMessage(
							WebpanelPostMessageKind.Delete,
							JSON.stringify(deleteableObj)
						));
					}
					else {
						let row = td.parentNode;
						if (row) {
							row.parentNode?.removeChild(row);
						}
					}
				}
			}
		}
	}


	const changeNamespaceButtonElement = document.getElementById(changeNamespaceButton);
	if (changeNamespaceButtonElement) {
		changeNamespaceButtonElement.addEventListener(click, () => {
			vscode.postMessage(new WebpanelPostMessage(
				WebpanelPostMessageKind.NamespaceUpdate,
				JSON.stringify(emptyString)));
		});
	}
	let addButtonElement = document.getElementById(addButton);

	var switchToTextEditor = document.getElementById(switchToTextEditorButton);

	if (switchToTextEditor) {
		switchToTextEditor.addEventListener(click, async () => {
			vscode.postMessage(new WebpanelPostMessage(
				WebpanelPostMessageKind.Switch,
				JSON.stringify(emptyString)));
		});
	}

	if (addButtonElement) {
		addButtonElement.addEventListener(click, () => {
			logToConsole("addButton clicked");
			//create tr
			let trElement = document.createElement(tr);

			let index = (currentResxJS.length > 0) ? currentResxJS.length : 0;

			//create key td
			let keyTdElement = document.createElement(td);
			const keyInput = document.createElement(input);
			keyInput.id = `${index}.${key}`;
			keyInput.type = text;
			keyInput.value = emptyString;

			//keyInput.onfocus =(key) =>inputEvent(key);
			keyInput.addEventListener(input, inputEvent);
			keyTdElement.appendChild(keyInput);

			//create value td
			const valueTdElement = document.createElement(td);
			const valueInput = document.createElement(input);
			valueInput.id = `${index}.${value}`;
			valueInput.value = emptyString;
			valueInput.type = text;

			valueInput.addEventListener(input, inputEvent, false);
			valueTdElement.appendChild(valueInput);

			//create comment td
			const commentTdElement = document.createElement(td);

			const commentInput = document.createElement(input);
			commentInput.id = `${index}.${comment}`;
			commentInput.type = text;
			commentInput.value = emptyString;
			commentInput.addEventListener(input, inputEvent, false);
			commentTdElement.appendChild(commentInput);

			//delete character X
			const deleteTd = document.createElement(td);
			deleteTd.id = `${index}.${deleteStr}.${td}`;
			let pElement = document.createElement(p);
			pElement.id = `${index}.${deleteStr}.${p}`;
			pElement.innerHTML = X;
			//p.setAttribute("style", "align:center");
			deleteTd.appendChild(pElement);

			deleteTd.addEventListener(click, (ev) => deleteEvent(ev), false);
			trElement.append(keyTdElement, valueTdElement, commentTdElement, deleteTd);

			//add tr to table 
			table.appendChild(trElement);
		});
	}

	function updateContent(text: string) {
		if (errorContainer !== null) {
			if (text) {
				let json;
				try {
					currentResxJS = json = JSON.parse(text);
					logToConsole(`${nameof(updateContent)}: data json is : ${text}`);
				}
				catch {
					table.style.display = none;
					errorContainer.innerText = errorInvalidResx;
					errorContainer.style.display = emptyString;
					return;
				}
				table.style.display = emptyString;
				errorContainer.style.display = none;

				// Render the scratches
				table.innerHTML = emptyString;

				var index = 0;
				for (const node of json) {

					if (node) {
						//create tr
						const trElement = document.createElement(tr);
						//create key td
						const keyElement = document.createElement(td);
						const keyInput = document.createElement(input);
						keyInput.type = text;
						keyInput.value = node._attributes.name ?? emptyString;
						logToConsole(`key : ${node._attributes.name}`);

						keyInput.id = `${index}.${key}`;
						keyInput.addEventListener(input, inputEvent, false);
						keyElement.appendChild(keyInput);

						//create value td
						const valueTdElement = document.createElement(td);
						const valueInput = document.createElement(input);
						valueInput.value = node.value._text ?? emptyString;
						valueInput.type = text;
						valueInput.id = `${index}.${value}`;
						logToConsole(`${nameof(updateContent)}: Value : ${node.value._text}`);
						valueInput.addEventListener(input, inputEvent, false);
						valueTdElement.appendChild(valueInput);

						//create comment td
						const commentTdElement = document.createElement(td);
						const commentInput = document.createElement(input);
						commentInput.id = `${index}.${comment}`;
						commentInput.type = text;
						commentInput.value = node?.comment?._text ?? emptyString;

						logToConsole(`comment : ${node?.comment?._text}`);
						commentInput.addEventListener(input, inputEvent, false);
						commentTdElement.appendChild(commentInput);

						//delete character X
						const deleteTd = document.createElement(td);
						deleteTd.id = `${index}.${deleteStr}.${td}`;
						const pElement = document.createElement(p);
						pElement.id = `${index}.${deleteStr}.${p}`;
						pElement.innerHTML = X;
						deleteTd.appendChild(pElement);
						deleteTd.addEventListener(click, (ev) => deleteEvent(ev), false);

						trElement.append(keyElement, valueTdElement, commentTdElement, deleteTd);

						//add tr to table 
						table.appendChild(trElement);
						index++;
					}
					else {
						logToConsole("node is undefined or null");
					}
				}
			}
			else {
				table.style.display = none;
				errorContainer.innerText = errorInvalidResx;
				errorContainer.style.display = emptyString;
				return;
			}
		}
	}


	window.addEventListener(message, event => {
		const messageData = event.data; // The json data that the extension sent
		const text = messageData.json;
		logToConsole(`addEventListener ${messageData.type} message received : ${text}`);

		switch (messageData.type) {
			case WebpanelPostMessageKind.Update:
				var sentDataListJs = JSON.parse(text) ?? [];

				if (sentDataListJs.length !== currentResxJS.length) {

					logToConsole(`addEventListener: Current data: ${JSON.stringify(currentResxJS)}`);
					logToConsole(`addEventListener: Received data: ${text}`);
					updateContent(text);
				}
				// Then persist state information.
				// This state is returned in the call to `vscode.getState` below when a webview is reloaded.
				vscode.setState({ text });

				return;
		}
	});

	const state = vscode.getState();
	if (state) {
		updateContent(state.text);
	}
}());

