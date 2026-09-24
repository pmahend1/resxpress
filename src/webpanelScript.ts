import { CellEdit } from "./cellEdit";
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
const errorText = "errorText";
const key = CellEdit.keyField;
const value = CellEdit.valueField;
const comment = CellEdit.commentField;
const tr = "tr";
const td = "td";
const input = "input";
const textarea = "textarea";
const p = "p";
const text = "text";
const click = "click";
const change = "change";
const visibilityChange = "visibilitychange";
const hidden = "hidden";
const deleteStr = "delete";
const X = "X";
const buttonTag = "button";
const buttonType = "button";
const ariaLabel = "aria-label";
const deleteButtonClass = "delete-button";
const deleteIconTemplate = "deleteIconTemplate";
const deleteRowLabel = "Delete this resource";
const strong = "strong";
const sortByKeysButton = "sortByKeysButton";
const errorDuplicateKey = (key: string) => `Data with ${key} already exists`;
const errorInvalidResx = "Document is not valid resx";
const errorKeyMandatory = "Key is a mandatory field!";
const changeNamespaceButton = "changeNamespaceButton";
const addButton = "addButton";
const switchToTextEditorButton = "switchToTextEditorButton";
const allLanguagesButton = "allLanguagesButton";
const message = "message";
const none = "none";
const namespaceSpan = "namespaceSpan";
const searchInput = "searchInput";
const searchStatus = "searchStatus";
const searchSummary = (matchCount: number, total: number) => `Showing ${matchCount} of ${total}`;
const keydown = "keydown";
const scroll = "scroll";
const escapeKey = "Escape";
const findKey = "f";
const filteredOutClass = "filtered-out";
const altRowClass = "alt-row";
const stickyToolbarSelector = ".sticky-div";
const stickyToolbarHeightProperty = "--sticky-toolbar-height";
const macUserAgentMarker = "Mac";
const macFindShortcut = "⌘F";
const findShortcut = "Ctrl+F";
const searchTooltip = (shortcut: string) => `Search key, value or comment (${shortcut} to focus, Esc to clear)`;
const documentUpdateDelayInMilliseconds = 300;
const scrollPersistDelayInMilliseconds = 150;

function logToConsole(text: string) {
	console.log(`${resxpressWebPanel}: ${text}`);
}

// Script run within the webview itself.
(function () {
	// @ts-ignore acquired
	const vscode = acquireVsCodeApi();

	const table = document.querySelector(tbody)!;
	const errorContainer = document.getElementById(errorBlock);
	const errorTextElement = document.getElementById(errorText);
	const searchInputElement = getInput(searchInput);
	const searchStatusElement = document.getElementById(searchStatus);
	let pendingUpdateHandle: ReturnType<typeof setTimeout> | undefined;
	let pendingStateHandle: ReturnType<typeof setTimeout> | undefined;
	let persistedText: string | undefined;
	let pendingScrollTop: number | undefined;

	function showError(errorMessage: string) {
		if (errorContainer === null || errorTextElement === null) {
			return;
		}

		errorTextElement.innerText = errorMessage;
		// Hidden rather than emptied: an empty row would still take a line's height.
		// The ResizeObserver below republishes the toolbar height either way.
		errorContainer.hidden = errorMessage.length === 0;
	}

	function getInput(id: string): HTMLInputElement | undefined {
		const element = document.getElementById(id);
		return element instanceof HTMLInputElement ? element : undefined;
	}

	function inputEvent(event: Event) {
		const target = event.target;
		if (target instanceof HTMLInputElement === false && target instanceof HTMLTextAreaElement === false) {
			return;
		}

		const [indexText, field] = target.id.split(".");
		const index = Number(indexText);
		if (Number.isInteger(index) === false || index < 0 || index >= currentEntries.length) {
			return;
		}

		const entry = CellEdit.apply(currentEntries[index], field, target.value);
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
		persistedText = entriesJson;
		persistState();
		vscode.postMessage(new WebpanelPostMessage(
			WebpanelPostMessageKind.TriggerTextDocumentUpdate,
			entriesJson
		));
	}

	// One writer: setState replaces the whole object, so saving the rows alone drops the rest.
	function persistState() {
		vscode.setState({
			text: persistedText,
			scrollTop: window.scrollY,
			search: searchInputElement?.value ?? emptyString
		});
	}

	// Nothing is readable at teardown, so the offset is saved as it moves - debounced,
	// because one flick of a trackpad fires hundreds of scroll events.
	function scheduleStatePersist() {
		if (pendingStateHandle !== undefined) {
			clearTimeout(pendingStateHandle);
		}

		pendingStateHandle = setTimeout(persistState, scrollPersistDelayInMilliseconds);
	}

	// Applied once the rows exist, since scrolling an empty table clamps to 0, and only
	// once, so a later repaint cannot drag the user back up.
	function restoreScrollPosition() {
		if (pendingScrollTop === undefined) {
			return;
		}

		const offset = pendingScrollTop;
		pendingScrollTop = undefined;
		window.scrollTo(0, offset);
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

	// Always a textarea, never swapped in by length: a swap mid-edit loses the caret and undo.
	function createTextArea(id: string, initialValue: string): HTMLTextAreaElement {
		const textAreaElement = document.createElement(textarea);
		textAreaElement.id = id;
		textAreaElement.rows = 1;
		textAreaElement.value = initialValue;
		textAreaElement.addEventListener(input, inputEvent, false);
		textAreaElement.addEventListener(change, flushDocumentUpdate, false);
		return textAreaElement;
	}

	function createCell(field: HTMLInputElement | HTMLTextAreaElement): HTMLTableCellElement {
		const cell = document.createElement(td);
		cell.appendChild(field);
		focusFieldOnCellClick(cell, field);
		return cell;
	}

	// A taller neighbour stretches the row while this field stays top-aligned,
	// so a click on the space below it lands on the cell and would do nothing.
	function focusFieldOnCellClick(cell: HTMLTableCellElement, field: HTMLInputElement | HTMLTextAreaElement) {
		cell.addEventListener(click, event => {
			if (event.target !== cell) {
				return;
			}

			field.focus();
			field.setSelectionRange(field.value.length, field.value.length);
		}, false);
	}

	// The X survives only as a fallback, should the shell ever ship without the icon.
	function createDeleteButton(): HTMLButtonElement {
		const deleteButton = document.createElement(buttonTag);
		deleteButton.type = buttonType;
		deleteButton.className = deleteButtonClass;
		deleteButton.title = deleteRowLabel;
		deleteButton.setAttribute(ariaLabel, deleteRowLabel);

		const template = document.getElementById(deleteIconTemplate);
		if (template instanceof HTMLTemplateElement) {
			deleteButton.appendChild(template.content.cloneNode(true));
		}
		else {
			deleteButton.textContent = X;
		}

		return deleteButton;
	}

	function createRow(entry: ResxEntry, index: number): HTMLTableRowElement {
		const deleteCell = document.createElement(td);
		deleteCell.id = `${index}.${deleteStr}.${td}`;
		deleteCell.addEventListener(click, deleteEvent, false);

		const deleteMarker = document.createElement(p);
		deleteMarker.id = `${index}.${deleteStr}.${p}`;
		deleteMarker.appendChild(createDeleteButton());
		deleteCell.appendChild(deleteMarker);

		const row = document.createElement(tr);
		row.append(createCell(createInput(`${index}.${key}`, entry.key)),
			createCell(createTextArea(`${index}.${value}`, entry.value)),
			createCell(createTextArea(`${index}.${comment}`, entry.comment ?? emptyString)),
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
		applyFilter();
		restoreScrollPosition();
	}

	function entryMatches(entry: ResxEntry, query: string): boolean {
		return entry.key.toLowerCase().includes(query)
			|| entry.value.toLowerCase().includes(query)
			|| (entry.comment ?? emptyString).toLowerCase().includes(query);
	}

	/*
	 * Non-matching rows are hidden where they are rather than dropped from the
	 * table. A row's id is its index in currentEntries, so rendering only the
	 * matches would renumber the survivors and send every later edit and delete
	 * to the wrong entry. Striping is assigned here for the same reason:
	 * nth-child still counts a hidden row, so CSS alone cannot alternate the
	 * rows that remain visible.
	 */
	function applyFilter() {
		const query = (searchInputElement?.value ?? emptyString).trim().toLowerCase();
		let visibleCount = 0;

		currentEntries.forEach((entry, index) => {
			const child = table.children[index];
			const row = child instanceof HTMLElement ? child : undefined;
			if (row === undefined) {
				return;
			}

			const isMatch = query.length === 0 || entryMatches(entry, query);
			row.classList.toggle(filteredOutClass, isMatch === false);
			row.classList.toggle(altRowClass, isMatch && visibleCount % 2 === 1);
			if (isMatch) {
				visibleCount++;
			}
		});

		if (searchStatusElement !== null) {
			searchStatusElement.textContent = query.length === 0
				? emptyString
				: searchSummary(visibleCount, currentEntries.length);
		}
	}

	function clearSearch() {
		if (searchInputElement === undefined) {
			return;
		}

		searchInputElement.value = emptyString;
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

	if (searchInputElement !== undefined) {
		/*
		 * The shortcut is named on hover rather than in the placeholder, which has
		 * to say what the box searches. It is spelled for the platform because the
		 * handler below accepts either modifier, so Ctrl+F on a Mac would be a lie.
		 */
		searchInputElement.title = searchTooltip(navigator.userAgent.includes(macUserAgentMarker)
			? macFindShortcut
			: findShortcut);
		searchInputElement.addEventListener(input, () => {
			applyFilter();
			persistState();
		}, false);
		searchInputElement.addEventListener(keydown, event => {
			if (event.key === escapeKey) {
				clearSearch();
				applyFilter();
				persistState();
			}
		}, false);

		/*
		 * Ctrl+F is what anyone will reach for first, and nothing else claims it
		 * here: VS Code's webview find widget is opt-in and would be useless even
		 * if it were on, because it drives Chromium's find-in-page, which does not
		 * look inside <input> or <textarea> values - and every resx field is one.
		 */
		document.addEventListener(keydown, event => {
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === findKey) {
				event.preventDefault();
				searchInputElement.focus();
				searchInputElement.select();
			}
		}, false);
	}

	const addButtonElement = document.getElementById(addButton);
	if (addButtonElement !== null) {
		addButtonElement.addEventListener(click, () => {
			logToConsole("addButton clicked");
			// The new row is empty, so an active filter would hide the row that was just asked for.
			clearSearch();
			currentEntries.push({ key: emptyString, value: emptyString });
			renderEntries();

			const keyInput = getInput(`${currentEntries.length - 1}.${key}`);
			if (keyInput !== undefined) {
				keyInput.scrollIntoView();
				keyInput.focus();
			}
		});
	}

	/* Only in the shell when the resource actually has culture siblings. */
	const allLanguagesButtonElement = document.getElementById(allLanguagesButton);
	if (allLanguagesButtonElement !== null) {
		allLanguagesButtonElement.addEventListener(click, () => {
			flushDocumentUpdate();
			vscode.postMessage(new WebpanelPostMessage(
				WebpanelPostMessageKind.OpenAllLanguages,
				JSON.stringify(emptyString)));
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

	/*
	 * The column headers stick directly under the toolbar, so they need its height,
	 * which changes with the panel width and the error row. This replaces a
	 * hardcoded 62px that only ever fit a single-row toolbar.
	 */
	const stickyToolbar = document.querySelector(stickyToolbarSelector);
	if (stickyToolbar !== null) {
		const publishToolbarHeight = () => document.documentElement.style.setProperty(
			stickyToolbarHeightProperty,
			`${stickyToolbar.getBoundingClientRect().height}px`);

		publishToolbarHeight();
		new ResizeObserver(publishToolbarHeight).observe(stickyToolbar);
	}

	window.addEventListener(scroll, scheduleStatePersist, false);

	// A hidden webview is torn down, so whatever is still queued has to go now.
	document.addEventListener(visibilityChange, () => {
		if (document.visibilityState === hidden) {
			flushDocumentUpdate();
			persistState();
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
				persistedText = messageText;
				persistState();
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

	// Restored with the offset: one measured over filtered rows means nothing without its filter.
	if (typeof state?.search === "string" && searchInputElement !== undefined) {
		searchInputElement.value = state.search;
	}

	if (typeof state?.scrollTop === "number") {
		pendingScrollTop = state.scrollTop;
	}

	if (state?.text !== undefined) {
		persistedText = state.text;
		updatePanelWebContent(state.text);
	}

	// The read-only preview ships its rows in the HTML, so it has no render to wait for.
	restoreScrollPosition();

	/*
	 * A message posted before the webview finished loading is dropped, so the
	 * host waits to be asked rather than pushing the first render.
	 */
	vscode.postMessage(new WebpanelPostMessage(
		WebpanelPostMessageKind.Ready,
		JSON.stringify(emptyString)));
}());
