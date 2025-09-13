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
const focusout = "focusout";
const deleteStr = "delete";
const X = "X";
const errorDuplicateKey = (key: string) => `Error: Data with ${key} already exists`;
const errorInvalidResx = "Error: Document is not valid resx";
const errorKeyValueMandatory = "Key and Value are both mandatory fields!";
const errorUpdateDuplicateKey = (key: string) => `Error while updating data : Data with ${key} already exists`;


function logToConsole(text: string) {
	console.log(`${resxpressWebPanel}: ${text}`);
}

// Script run within the webview itself.
(function () {
	// @ts-ignore acquired
	const vscode = acquireVsCodeApi();

	let table = document.querySelector(tbody)!;

	const errorContainer = document.getElementById(errorBlock);

	function inputEvent(event: FocusEvent) {
		let currentElement = event.target;

		if (errorContainer !== null && currentElement instanceof HTMLInputElement) {
			errorContainer.innerText = "";
			let idstr = currentElement.id;
			logToConsole(`${nameof(inputEvent)} for : ${idstr}`);
			var index = Number(idstr.split(".")[0]);
			if (index >= currentResxJS.length) {
				logToConsole(`${nameof(inputEvent)}: Index: ${index}. Current Resx Length: ${currentResxJS.length}`);
				var newObj: any = { _attributes: { name: "", "xml:space": "preserve" }, value: { _text: "" } };
				const keyElement = document.getElementById(`${index}.${key}`) as HTMLInputElement;
				const valueElement = document.getElementById(`${index}.${value}`);
				const commentElement = document.getElementById(`${index}.${comment}`);

				if (keyElement instanceof HTMLInputElement && valueElement instanceof HTMLInputElement && commentElement instanceof HTMLInputElement) {
					if (keyElement.value && valueElement.value) {
						newObj._attributes.name = keyElement?.value ?? "";
						newObj.value._text = valueElement?.value ?? "";
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
							logToConsole(`${nameof(inputEvent)}: ${JSON.stringify(newObj)}`);

							errorContainer.innerText = "";
							errorContainer.style.display = "";

							vscode.setState({ text: JSON.stringify(currentResxJS) });
							vscode.postMessage(new WebpanelPostMessage(
								WebpanelPostMessageKind.Add,
								JSON.stringify(newObj)
							));
						}
						else {
							logToConsole(`${nameof(inputEvent)}: Duplicate key found ${newObj._attributes.name}`);
							errorContainer.innerText = errorDuplicateKey(newObj._attributes.name);
							errorContainer.style.display = "";
							return;
						}
					}
					else {
						errorContainer.innerText = errorKeyValueMandatory;
						errorContainer.style.display = "";
						return;
					}
				}
			}
			else {
				var editingObj = currentResxJS[index];

				const keyElement = document.getElementById(`${index}.${key}`);
				const valueElement = document.getElementById(`${index}.${value}`);
				const commentElement = document.getElementById(`${index}.${comment}`);

				if (keyElement instanceof HTMLInputElement && valueElement instanceof HTMLInputElement && commentElement instanceof HTMLInputElement) {
					if (keyElement.value && valueElement.value) {

						logToConsole(`${nameof(inputEvent)}: Changing values`);
						editingObj._attributes.name = keyElement.value ?? "";
						editingObj.value._text = valueElement.value ?? "";
						if (commentElement?.value) {
							editingObj.comment = { _text: commentElement?.value };
						}
						else {
							delete editingObj.comment;
						}

						var tempArray = Array.from(currentResxJS);
						tempArray[index] = editingObj;

						var keyArray = tempArray.map((x: any) => x._attributes.name);

						logToConsole(`${nameof(inputEvent)}: keyArray is  ${JSON.stringify(keyArray)}`);
						if (new Set(keyArray).size !== keyArray.length) {
							logToConsole(`${nameof(inputEvent)}: edited Data key already exists`);
							errorContainer.innerText = errorUpdateDuplicateKey(editingObj._attributes.name)
							errorContainer.style.display = "";
						}
						else {
							currentResxJS[index] = editingObj;
						}
					}
					else {
						errorContainer.innerText = errorInvalidResx;
						errorContainer.style.display = "";
						return;
					}
				}
				logToConsole(`${nameof(inputEvent)}: ${JSON.stringify(currentResxJS)}`);
				vscode.setState({ text: JSON.stringify(currentResxJS) });
				vscode.postMessage(new WebpanelPostMessage(
					WebpanelPostMessageKind.Update,
					JSON.stringify(currentResxJS)
				));
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
			errorContainer.innerText = "";

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

	const changeNamespaceButton = "changeNamespaceButton";
	const addButton = "addButton";
	const switchToTextEditorButton = "switchToTextEditorButton";

	const changeNamespaceButtonElement = document.getElementById(changeNamespaceButton);
	if (changeNamespaceButtonElement) {
		changeNamespaceButtonElement.addEventListener(click, () => {
			vscode.postMessage(new WebpanelPostMessage(
				WebpanelPostMessageKind.NamespaceUpdate,
				JSON.stringify("")));
		});
	}
	let addButtonElement = document.getElementById(addButton);

	var switchToTextEditor = document.getElementById(switchToTextEditorButton);

	if (switchToTextEditor) {
		switchToTextEditor.addEventListener(click, async () => {
			vscode.postMessage(new WebpanelPostMessage(
				WebpanelPostMessageKind.Switch,
				JSON.stringify("")));
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
			keyInput.id = `${index}.${keyTdElement}`;
			keyInput.type = text;
			keyInput.value = "";

			//keyInput.onfocus =(key) =>inputEvent(key);
			keyInput.addEventListener(focusout, inputEvent, false);
			keyTdElement.appendChild(keyInput);

			//create value td
			const value = document.createElement(td);
			const valueInput = document.createElement(input);
			valueInput.id = `${index}.${value}`;
			valueInput.value = "";
			valueInput.type = text;

			valueInput.addEventListener(focusout, inputEvent, false);
			value.appendChild(valueInput);

			//create comment td
			const comment = document.createElement(td);

			const commentInput = document.createElement(input);
			commentInput.id = `${index}.${comment}`;
			commentInput.type = text;
			commentInput.value = "";

			commentInput.addEventListener(focusout, inputEvent, false);

			comment.appendChild(commentInput);

			//delete character X
			const deleteTd = document.createElement(td);
			deleteTd.id = `${index}.${deleteStr}.${td}`;
			let pElement = document.createElement(p);
			pElement.id = `${index}.${deleteStr}.${p}`;
			pElement.innerHTML = X;
			//p.setAttribute("style", "align:center");
			deleteTd.appendChild(pElement);

			deleteTd.addEventListener(click, (ev) => deleteEvent(ev), false);
			trElement.append(keyTdElement, value, comment, deleteTd);

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
					table.style.display = "none";
					errorContainer.innerText = errorInvalidResx;
					errorContainer.style.display = "";
					return;
				}
				table.style.display = "";
				errorContainer.style.display = "none";

				// Render the scratches
				table.innerHTML = "";

				var index = 0;
				for (const node of json) {

					if (node) {
						//create tr
						const trElement = document.createElement(tr);
						//create key td
						const keyElement = document.createElement(td);
						const keyInput = document.createElement(input);
						keyInput.type = text;
						keyInput.value = node._attributes.name ?? "";
						logToConsole("key : " + node._attributes.name);

						keyInput.id = `${index}.${keyElement}`;
						keyInput.addEventListener(focusout, inputEvent, false);
						keyElement.appendChild(keyInput);

						//create value td
						const value = document.createElement(td);
						const valueInput = document.createElement(input);
						valueInput.value = node.value._text ?? "";
						valueInput.type = text;
						valueInput.id = `${index}.${value}`;
						logToConsole(`${nameof(updateContent)}: Value : ${node.value._text}`);
						valueInput.addEventListener(focusout, inputEvent, false);
						value.appendChild(valueInput);

						//create comment td
						const comment = document.createElement(td);
						const commentInput = document.createElement(input);
						commentInput.id = `${index}.${comment}`;
						commentInput.type = text;
						commentInput.value = node?.comment?._text ?? "";

						logToConsole("comment : " + node?.comment?._text);
						commentInput.addEventListener(focusout, inputEvent, false);
						comment.appendChild(commentInput);

						//delete character X
						const deleteTd = document.createElement(td);
						deleteTd.id = `${index}.${deleteStr}.${td}`;
						const pElement = document.createElement(p);
						pElement.id = `${index}.${deleteStr}.${p}`;
						pElement.innerHTML = X;
						deleteTd.appendChild(pElement);
						deleteTd.addEventListener(click, (ev) => deleteEvent(ev), false);


						trElement.append(keyElement, value, comment, deleteTd);

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
				table.style.display = "none";
				errorContainer.innerText = errorInvalidResx;
				errorContainer.style.display = "";
				return;
			}
		}
	}

	window.addEventListener("message", event => {
		const message = event.data; // The json data that the extension sent
		const text = message.json;
		logToConsole(`addEventListener message received : ${text}`);

		switch (message.type) {
			case WebpanelPostMessageKind.Update:
				var sentDataListJs = JSON.parse(text) ?? [];

				if (sentDataListJs.length !== currentResxJS.length) {
					logToConsole(`addEventListener: Sent data as json ${text}`);
					logToConsole("addEventListener: Current data as json " + JSON.stringify(currentResxJS));
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

