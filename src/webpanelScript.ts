import { emptyString } from "./constants";
import { nameof } from "./nameof";
import type { ResxEntry } from "./resxEntry";
import { WebpanelPostMessageKind } from "./webpanelMessageKind";
import { WebpanelPostMessage } from "./webpanelPostMessage";

// @ts-check
let currentEntries: ResxEntry[] = [];
const resxpressWebPanel = "resxpress.webpanel";
const tbody = "tbody";
const errorBlock = "errorBlock";
const key = "key";
const value = "value";
const comment = "comment";
const tr = "tr";
const td = "td";
const input = "input";
const p = "p";
const text = "text";
const click = "click";
const change = "change";
const visibilityChange = "visibilitychange";
const hidden = "hidden";
const deleteStr = "delete";
const X = "X";
const strong = "strong";
const sortByKeysButton = "sortByKeysButton";
const errorDuplicateKey = (key: string) => `Error: Data with ${key} already exists`;
const errorInvalidResx = "Error: Document is not valid resx";
const errorKeyMandatory = "Key is a mandatory field!";
const changeNamespaceButton = "changeNamespaceButton";
const addButton = "addButton";
const switchToTextEditorButton = "switchToTextEditorButton";
const message = "message";
const none = "none";
const namespaceSpan = "namespaceSpan";
const documentUpdateDelayInMilliseconds = 300;

function logToConsole(text: string) {
	console.log(`${resxpressWebPanel}: ${text}`);
}

// Script run within the webview itself.
(function () {
	// @ts-ignore acquired
	const vscode = acquireVsCodeApi();

	const table = document.querySelector(tbody)!;
	const errorContainer = document.getElementById(errorBlock);
	let pendingUpdateHandle: ReturnType<typeof setTimeout> | undefined;

	function showError(errorMessage: string) {
		if (errorContainer === null) {
			return;
		}

		errorContainer.innerText = errorMessage;
		errorContainer.style.display = errorMessage.length === 0 ? none : emptyString;
	}

	function getInput(id: string): HTMLInputElement | undefined {
		const element = document.getElementById(id);
		return element instanceof HTMLInputElement ? element : undefined;
	}

	function readRow(index: number): ResxEntry | undefined {
		const keyInput = getInput(`${index}.${key}`);
		const valueInput = getInput(`${index}.${value}`);
		const commentInput = getInput(`${index}.${comment}`);

		if (keyInput === undefined || valueInput === undefined || commentInput === undefined) {
			return undefined;
		}

		const entry: ResxEntry = { key: keyInput.value, value: valueInput.value };
		if (commentInput.value.length > 0) {
			entry.comment = commentInput.value;
		}

		return entry;
	}

	function inputEvent(event: Event) {
		const target = event.target instanceof HTMLInputElement ? event.target : undefined;
		if (target === undefined) {
			return;
		}

		const index = Number(target.id.split(".")[0]);
		if (Number.isInteger(index) === false || index < 0 || index >= currentEntries.length) {
			return;
		}

		const entry = readRow(index);
		if (entry === undefined) {
			return;
		}

		logToConsole(`${nameof(inputEvent)}: row ${index} is now ${JSON.stringify(entry)}`);
		currentEntries[index] = entry;
		scheduleDocumentUpdate();
	}

	/*
	 * The document is written once typing pauses rather than on every
	 * keystroke: an edit per character floods the undo stack and re-parses the
	 * whole file each time. Anything still queued is flushed on `change`, which
	 * fires when an edited input loses focus, and when the webview is hidden.
	 */
	function scheduleDocumentUpdate() {
		if (pendingUpdateHandle !== undefined) {
			clearTimeout(pendingUpdateHandle);
		}

		pendingUpdateHandle = setTimeout(flushDocumentUpdate, documentUpdateDelayInMilliseconds);
	}

	function flushDocumentUpdate() {
		if (pendingUpdateHandle !== undefined) {
			clearTimeout(pendingUpdateHandle);
			pendingUpdateHandle = undefined;
		}

		const entries = committedEntries();
		const validationError = validate(entries);
		if (validationError !== undefined) {
			logToConsole(`${nameof(flushDocumentUpdate)}: not writing - ${validationError}`);
			showError(validationError);
			return;
		}

		showError(emptyString);
		const entriesJson = JSON.stringify(entries);
		vscode.setState({ text: entriesJson });
		vscode.postMessage(new WebpanelPostMessage(
			WebpanelPostMessageKind.TriggerTextDocumentUpdate,
			entriesJson
		));
	}

	// A row that was added but not filled in yet is not something the file should carry.
	function committedEntries(): ResxEntry[] {
		return currentEntries.filter(entry => entry.key.length > 0
			|| entry.value.length > 0
			|| (entry.comment ?? emptyString).length > 0);
	}

	function validate(entries: ResxEntry[]): string | undefined {
		if (entries.some(entry => entry.key.length === 0)) {
			return errorKeyMandatory;
		}

		const keys = entries.map(entry => entry.key);
		const duplicate = keys.find((entryKey, index) => keys.indexOf(entryKey) !== index);
		if (duplicate !== undefined) {
			return errorDuplicateKey(duplicate);
		}

		return undefined;
	}

	function createInput(id: string, initialValue: string): HTMLInputElement {
		const inputElement = document.createElement(input);
		inputElement.id = id;
		inputElement.type = text;
		inputElement.value = initialValue;
		inputElement.addEventListener(input, inputEvent, false);
		inputElement.addEventListener(change, flushDocumentUpdate, false);
		return inputElement;
	}

	function createCell(content: HTMLElement): HTMLTableCellElement {
		const cell = document.createElement(td);
		cell.appendChild(content);
		return cell;
	}

	function createRow(entry: ResxEntry, index: number): HTMLTableRowElement {
		const deleteCell = document.createElement(td);
		deleteCell.id = `${index}.${deleteStr}.${td}`;
		deleteCell.addEventListener(click, deleteEvent, false);

		const deleteMarker = document.createElement(p);
		deleteMarker.id = `${index}.${deleteStr}.${p}`;
		deleteMarker.textContent = X;
		deleteCell.appendChild(deleteMarker);

		const row = document.createElement(tr);
		row.append(createCell(createInput(`${index}.${key}`, entry.key)),
			createCell(createInput(`${index}.${value}`, entry.value)),
			createCell(createInput(`${index}.${comment}`, entry.comment ?? emptyString)),
			deleteCell);
		return row;
	}

	/*
	 * A row's id is its position in currentEntries, so every render rebuilds
	 * the whole table. Renumbering after an add or a delete is what keeps the
	 * next edit from landing on the wrong entry.
	 */
	function renderEntries() {
		table.innerHTML = emptyString;
		currentEntries.forEach((entry, index) => table.appendChild(createRow(entry, index)));
	}

	function deleteEvent(event: MouseEvent) {
		const cell = event.currentTarget instanceof HTMLElement ? event.currentTarget : undefined;
		if (cell === undefined) {
			return;
		}

		const index = Number(cell.id.split(".")[0]);
		if (Number.isInteger(index) === false || index < 0 || index >= currentEntries.length) {
			return;
		}

		logToConsole(`${nameof(deleteEvent)}: deleting row ${index}`);
		currentEntries.splice(index, 1);
		renderEntries();
		flushDocumentUpdate();
	}

	function updatePanelWebContent(entriesJson: string) {
		let entries: ResxEntry[];
		try {
			entries = JSON.parse(entriesJson);
		}
		catch {
			entries = [];
		}

		if (Array.isArray(entries) === false) {
			table.style.display = none;
			showError(errorInvalidResx);
			return;
		}

		// Re-rendering throws away the caret, so skip it when nothing actually moved.
		if (JSON.stringify(currentEntries) === JSON.stringify(entries)) {
			return;
		}

		logToConsole(`${nameof(updatePanelWebContent)}: ${entries.length} entries received`);
		currentEntries = entries;
		table.style.display = emptyString;
		showError(emptyString);
		renderEntries();
	}

	const changeNamespaceButtonElement = document.getElementById(changeNamespaceButton);
	if (changeNamespaceButtonElement !== null) {
		changeNamespaceButtonElement.addEventListener(click, () => {
			vscode.postMessage(new WebpanelPostMessage(
				WebpanelPostMessageKind.TriggerNamespaceUpdate,
				JSON.stringify(emptyString)));
		});
	}

	const switchToTextEditor = document.getElementById(switchToTextEditorButton);
	if (switchToTextEditor !== null) {
		switchToTextEditor.addEventListener(click, () => {
			flushDocumentUpdate();
			vscode.postMessage(new WebpanelPostMessage(
				WebpanelPostMessageKind.Switch,
				JSON.stringify(emptyString)));
		});
	}

	const addButtonElement = document.getElementById(addButton);
	if (addButtonElement !== null) {
		addButtonElement.addEventListener(click, () => {
			logToConsole("addButton clicked");
			currentEntries.push({ key: emptyString, value: emptyString });
			renderEntries();

			const keyInput = getInput(`${currentEntries.length - 1}.${key}`);
			if (keyInput !== undefined) {
				keyInput.scrollIntoView();
				keyInput.focus();
			}
		});
	}

	const sortByKeysButtonElement = document.getElementById(sortByKeysButton);
	if (sortByKeysButtonElement !== null) {
		sortByKeysButtonElement.addEventListener(click, () => {
			flushDocumentUpdate();
			vscode.postMessage(new WebpanelPostMessage(
				WebpanelPostMessageKind.SortByKeys,
				JSON.stringify(emptyString)));
		});
	}

	// A hidden webview is torn down, so whatever is still queued has to go now.
	document.addEventListener(visibilityChange, () => {
		if (document.visibilityState === hidden) {
			flushDocumentUpdate();
		}
	});

	window.addEventListener(message, event => {
		const messageData = event.data; // data that the extension sent
		const messageText = messageData.text;
		logToConsole(`addEventListener ${messageData.type} message received`);

		switch (messageData.type) {
			case WebpanelPostMessageKind.UpdateWebPanel:
				updatePanelWebContent(messageText);
				// Persisted so a webview that was hidden and shown again comes back with its rows.
				vscode.setState({ text: messageText });
				break;
			case WebpanelPostMessageKind.NewNamespace:
				const namespaceSpanElement = document.getElementById(namespaceSpan);
				if (namespaceSpanElement !== null) {
					namespaceSpanElement.innerHTML = "Namespace: ";
					const strongElement = document.createElement(strong);
					strongElement.textContent = messageText;
					namespaceSpanElement.appendChild(strongElement);
				}
				break;
		}
	});

	const state = vscode.getState();
	if (state?.text !== undefined) {
		updatePanelWebContent(state.text);
	}

	/*
	 * A message posted before the webview finished loading is dropped, so the
	 * host waits to be asked rather than pushing the first render.
	 */
	vscode.postMessage(new WebpanelPostMessage(
		WebpanelPostMessageKind.Ready,
		JSON.stringify(emptyString)));
}());
