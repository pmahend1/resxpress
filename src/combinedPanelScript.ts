import type { CombinedColumn } from "./combinedColumn";
import type { CombinedEntry } from "./combinedEntry";
import type { CombinedPayload } from "./combinedPayload";
import { emptyString } from "./constants";
import { nameof } from "./nameof";
import { WebpanelPostMessageKind } from "./webpanelMessageKind";
import { WebpanelPostMessage } from "./webpanelPostMessage";

const resxpressCombinedPanel = "resxpress.combinedPanel";
const tbody = "tbody";
const tableHead = "tableHead";
const errorBlock = "errorBlock";
const keyField = "key";
const valueField = "value";
const commentField = "comment";
const tr = "tr";
const td = "td";
const th = "th";
const input = "input";
const p = "p";
const text = "text";
const click = "click";
const change = "change";
const visibilityChange = "visibilitychange";
const hidden = "hidden";
const deleteStr = "delete";
const X = "X";
const message = "message";
const none = "none";
const keydown = "keydown";
const escapeKey = "Escape";
const findKey = "f";
const addButton = "addButton";
const saveAllButton = "saveAllButton";
const sortByKeysButton = "sortByKeysButton";
const commentModeButton = "commentModeButton";
const searchInput = "searchInput";
const searchStatus = "searchStatus";
const ariaPressed = "aria-pressed";
const keyColumnClass = "key-column";
const valueColumnClass = "value-column";
const commentColumnClass = "comment-column";
const deleteColumnClass = "delete-column";
const missingCellClass = "missing-cell";
const filteredOutClass = "filtered-out";
const altRowClass = "alt-row";
const keyHeader = "Key";
const commentHeader = "Comment";
const commentHeaderFor = (label: string) => `${label} comment`;
const columnTooltip = (label: string, fileName: string) => `${label} - ${fileName}`;
const missingCellTooltip = "Not translated in this language yet";
const unifiedCommentsLabel = "Comments: Default";
const perLanguageCommentsLabel = "Comments: Per language";
const unifiedCommentsTooltip = (fileName: string) => `One comment column, read from and written to ${fileName}. Click to give every language its own comment column.`;
const perLanguageCommentsTooltip = "A comment column per language. Click to show only the default language's comment.";
const deleteRowTooltip = "Remove this key from every language file";
const errorDuplicateKey = (key: string) => `Error: Data with ${key} already exists`;
const errorKeyMandatory = "Key is a mandatory field!";
const errorInvalidPayload = "Error: Could not read the language files";
const searchSummary = (matchCount: number, total: number) => `Showing ${matchCount} of ${total}`;
const macUserAgentMarker = "Mac";
const macFindShortcut = "⌘F";
const findShortcut = "Ctrl+F";
const searchTooltip = (shortcut: string) => `Search key, value or comment (${shortcut} to focus, Esc to clear)`;
const documentUpdateDelayInMilliseconds = 300;

function logToConsole(logText: string) {
    console.log(`${resxpressCombinedPanel}: ${logText}`);
}

// Script run within the webview itself.
(function () {
    // @ts-ignore acquired
    const vscode = acquireVsCodeApi();

    const body = document.querySelector(tbody)!;
    const head = document.getElementById(tableHead);
    const errorContainer = document.getElementById(errorBlock);
    const searchInputElement = getInput(searchInput);
    const searchStatusElement = document.getElementById(searchStatus);
    const commentModeElement = document.getElementById(commentModeButton);

    let currentColumns: CombinedColumn[] = [];
    let currentEntries: CombinedEntry[] = [];
    let unifiedComments = true;
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

    function inputId(index: number, field: string, culture: string): string {
        return `${index}.${field}.${culture}`;
    }

    /*
     * The neutral file: it owns the key set, and so also owns the one comment
     * shown when the comment columns are collapsed. The fallback only matters
     * for a resource that has no neutral file at all.
     */
    function keyAuthorityCulture(): string {
        const neutral = currentColumns.find(column => column.culture.length === 0);
        return neutral?.culture ?? currentColumns[0]?.culture ?? emptyString;
    }

    /**
     * Reads a row back out of the DOM.
     *
     * A cell's *presence* is as meaningful as its text: a missing `values`
     * property means the key is absent from that language's file, and an empty
     * string means it is there and blank. So an empty cell keeps its property
     * only when it already had one, which makes clearing a translation the
     * gesture that removes it, and leaves a deliberately blank entry alone.
     */
    function readRow(index: number): CombinedEntry | undefined {
        const keyInput = getInput(`${index}.${keyField}`);
        const previous = currentEntries[index];
        if (keyInput === undefined || previous === undefined) {
            return undefined;
        }

        const entry: CombinedEntry = { key: keyInput.value, values: {}, comments: {} };

        for (const column of currentColumns) {
            const culture = column.culture;
            const valueInput = getInput(inputId(index, valueField, culture));
            const stored = previous.values[culture];

            if (valueInput === undefined) {
                if (stored !== undefined) {
                    entry.values[culture] = stored;
                }
            }
            else if (valueInput.value.length > 0) {
                entry.values[culture] = valueInput.value;
            }
            else if (stored === emptyString) {
                entry.values[culture] = emptyString;
            }

            /*
             * A comment column that is not on screen is carried through
             * untouched rather than dropped - collapsing the comment columns is
             * a view, and must never rewrite a translator's own comment.
             */
            const commentInput = getInput(inputId(index, commentField, culture));
            if (commentInput === undefined) {
                const storedComment = previous.comments[culture];
                if (storedComment !== undefined) {
                    entry.comments[culture] = storedComment;
                }
            }
            else if (commentInput.value.length > 0) {
                entry.comments[culture] = commentInput.value;
            }
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
        markMissingCells(index);
        scheduleDocumentUpdate();
    }

    /*
     * The document is written once typing pauses rather than on every
     * keystroke. Anything still queued is flushed on `change`, which fires when
     * an edited input loses focus, and when the webview is hidden.
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
        vscode.postMessage(new WebpanelPostMessage(WebpanelPostMessageKind.TriggerCombinedUpdate,
                                                   JSON.stringify(entries)));
    }

    // A row that was added but not filled in yet is not something any file should carry.
    function committedEntries(): CombinedEntry[] {
        return currentEntries.filter(entry => isEmptyRow(entry) === false);
    }

    function isEmptyRow(entry: CombinedEntry): boolean {
        if (entry.key.length > 0) {
            return false;
        }

        return Object.values(entry.values).every(value => value.length === 0)
            && Object.values(entry.comments).every(comment => comment.length === 0);
    }

    function validate(entries: CombinedEntry[]): string | undefined {
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

    function createCell(content: HTMLElement, className: string): HTMLTableCellElement {
        const cell = document.createElement(td);
        cell.className = className;
        cell.appendChild(content);
        return cell;
    }

    function createHeaderCell(label: string, tooltip: string | undefined, className: string): HTMLTableCellElement {
        const cell = document.createElement(th);
        cell.className = className;
        cell.textContent = label;
        if (tooltip !== undefined) {
            cell.title = tooltip;
        }

        return cell;
    }

    function renderHeader() {
        if (head === null) {
            return;
        }

        head.innerHTML = emptyString;
        const row = document.createElement(tr);
        row.appendChild(createHeaderCell(keyHeader, undefined, keyColumnClass));

        for (const column of currentColumns) {
            const tooltip = columnTooltip(column.label, column.fileName);
            row.appendChild(createHeaderCell(column.label, tooltip, valueColumnClass));
            if (unifiedComments === false) {
                row.appendChild(createHeaderCell(commentHeaderFor(column.label), tooltip, commentColumnClass));
            }
        }

        if (unifiedComments) {
            const culture = keyAuthorityCulture();
            const owner = currentColumns.find(column => column.culture === culture);
            row.appendChild(createHeaderCell(commentHeader,
                                             owner === undefined ? undefined : columnTooltip(owner.label, owner.fileName),
                                             commentColumnClass));
        }

        row.appendChild(createHeaderCell(emptyString, undefined, deleteColumnClass));
        head.appendChild(row);
    }

    function createRow(entry: CombinedEntry, index: number): HTMLTableRowElement {
        const row = document.createElement(tr);
        row.appendChild(createCell(createInput(`${index}.${keyField}`, entry.key), keyColumnClass));

        for (const column of currentColumns) {
            const culture = column.culture;
            row.appendChild(createCell(createInput(inputId(index, valueField, culture), entry.values[culture] ?? emptyString),
                                       valueColumnClass));
            if (unifiedComments === false) {
                row.appendChild(createCell(createInput(inputId(index, commentField, culture), entry.comments[culture] ?? emptyString),
                                           commentColumnClass));
            }
        }

        if (unifiedComments) {
            const culture = keyAuthorityCulture();
            row.appendChild(createCell(createInput(inputId(index, commentField, culture), entry.comments[culture] ?? emptyString),
                                       commentColumnClass));
        }

        const deleteCell = document.createElement(td);
        deleteCell.className = deleteColumnClass;
        deleteCell.id = `${index}.${deleteStr}.${td}`;
        deleteCell.title = deleteRowTooltip;
        deleteCell.addEventListener(click, deleteEvent, false);

        const deleteMarker = document.createElement(p);
        deleteMarker.id = `${index}.${deleteStr}.${p}`;
        deleteMarker.textContent = X;
        deleteCell.appendChild(deleteMarker);
        row.appendChild(deleteCell);

        return row;
    }

    /* A cell with no entry in that language is the thing this table exists to show. */
    function markMissingCells(index: number) {
        const entry = currentEntries[index];
        if (entry === undefined) {
            return;
        }

        for (const column of currentColumns) {
            const cell = getInput(inputId(index, valueField, column.culture))?.parentElement;
            if (cell === null || cell === undefined) {
                continue;
            }

            const isMissing = entry.values[column.culture] === undefined;
            cell.classList.toggle(missingCellClass, isMissing);
            cell.title = isMissing ? missingCellTooltip : emptyString;
        }
    }

    /*
     * A row's id is its position in currentEntries, so every render rebuilds the
     * whole table. Renumbering after an add or a delete is what keeps the next
     * edit from landing on the wrong entry.
     */
    function renderTable() {
        renderHeader();
        body.innerHTML = emptyString;
        currentEntries.forEach((entry, index) => body.appendChild(createRow(entry, index)));
        currentEntries.forEach((_entry, index) => markMissingCells(index));
        applyFilter();
    }

    function entryMatches(entry: CombinedEntry, query: string): boolean {
        return entry.key.toLowerCase().includes(query)
            || Object.values(entry.values).some(value => value.toLowerCase().includes(query))
            || Object.values(entry.comments).some(comment => comment.toLowerCase().includes(query));
    }

    /*
     * Non-matching rows are hidden where they are rather than dropped from the
     * table, because a row's id is its index in currentEntries. Striping is
     * assigned here for the same reason: nth-child still counts a hidden row.
     */
    function applyFilter() {
        const query = (searchInputElement?.value ?? emptyString).trim().toLowerCase();
        let visibleCount = 0;

        currentEntries.forEach((entry, index) => {
            const child = body.children[index];
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
        if (searchInputElement !== undefined) {
            searchInputElement.value = emptyString;
        }
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

        logToConsole(`${nameof(deleteEvent)}: deleting row ${index} from every language`);
        currentEntries.splice(index, 1);
        renderTable();
        flushDocumentUpdate();
    }

    function setCommentMode(isUnified: boolean) {
        unifiedComments = isUnified;
        updateCommentModeButton();
        vscode.setState({ unifiedComments: unifiedComments });
        renderTable();
    }

    function updateCommentModeButton() {
        if (commentModeElement === null) {
            return;
        }

        const owner = currentColumns.find(column => column.culture === keyAuthorityCulture());
        commentModeElement.textContent = unifiedComments ? unifiedCommentsLabel : perLanguageCommentsLabel;
        commentModeElement.title = unifiedComments
            ? unifiedCommentsTooltip(owner?.fileName ?? emptyString)
            : perLanguageCommentsTooltip;
        commentModeElement.setAttribute(ariaPressed, String(unifiedComments));
    }

    function updatePanelWebContent(payloadJson: string) {
        let payload: CombinedPayload | undefined;
        try {
            payload = JSON.parse(payloadJson);
        }
        catch {
            payload = undefined;
        }

        if (payload === undefined || Array.isArray(payload.columns) === false || Array.isArray(payload.entries) === false) {
            showError(errorInvalidPayload);
            return;
        }

        // Re-rendering throws away the caret, so skip it when nothing actually moved.
        if (JSON.stringify(currentColumns) === JSON.stringify(payload.columns)
            && JSON.stringify(currentEntries) === JSON.stringify(payload.entries)) {
            return;
        }

        logToConsole(`${nameof(updatePanelWebContent)}: ${payload.entries.length} keys across ${payload.columns.length} languages`);
        currentColumns = payload.columns;
        currentEntries = payload.entries;
        showError(emptyString);
        updateCommentModeButton();
        renderTable();
    }

    const addButtonElement = document.getElementById(addButton);
    if (addButtonElement !== null) {
        addButtonElement.addEventListener(click, () => {
            // The new row is empty, so an active filter would hide the row that was just asked for.
            clearSearch();

            /*
             * The key is created in the neutral file and nowhere else. A
             * translation gets the key when someone types one in, which is what
             * keeps an empty column out of every other file.
             */
            const entry: CombinedEntry = { key: emptyString, values: {}, comments: {} };
            entry.values[keyAuthorityCulture()] = emptyString;
            currentEntries.push(entry);
            renderTable();

            const keyInput = getInput(`${currentEntries.length - 1}.${keyField}`);
            if (keyInput !== undefined) {
                keyInput.scrollIntoView();
                keyInput.focus();
            }
        });
    }

    const saveAllButtonElement = document.getElementById(saveAllButton);
    if (saveAllButtonElement !== null) {
        saveAllButtonElement.addEventListener(click, () => {
            flushDocumentUpdate();
            vscode.postMessage(new WebpanelPostMessage(WebpanelPostMessageKind.SaveAll, JSON.stringify(emptyString)));
        });
    }

    const sortByKeysButtonElement = document.getElementById(sortByKeysButton);
    if (sortByKeysButtonElement !== null) {
        sortByKeysButtonElement.addEventListener(click, () => {
            flushDocumentUpdate();
            vscode.postMessage(new WebpanelPostMessage(WebpanelPostMessageKind.SortByKeys, JSON.stringify(emptyString)));
        });
    }

    if (commentModeElement !== null) {
        commentModeElement.addEventListener(click, () => setCommentMode(unifiedComments === false));
    }

    if (searchInputElement !== undefined) {
        searchInputElement.title = searchTooltip(navigator.userAgent.includes(macUserAgentMarker)
                                                 ? macFindShortcut
                                                 : findShortcut);
        searchInputElement.addEventListener(input, applyFilter, false);
        searchInputElement.addEventListener(keydown, event => {
            if (event.key === escapeKey) {
                clearSearch();
                applyFilter();
            }
        }, false);

        // VS Code's own find widget cannot see into <input> values, and every cell here is one.
        document.addEventListener(keydown, event => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === findKey) {
                event.preventDefault();
                searchInputElement.focus();
                searchInputElement.select();
            }
        }, false);
    }

    // A hidden webview is torn down, so whatever is still queued has to go now.
    document.addEventListener(visibilityChange, () => {
        if (document.visibilityState === hidden) {
            flushDocumentUpdate();
        }
    });

    window.addEventListener(message, event => {
        const messageData = event.data;
        logToConsole(`addEventListener ${messageData.type} message received`);

        if (messageData.type === WebpanelPostMessageKind.UpdateCombinedPanel) {
            updatePanelWebContent(messageData.text);
        }
    });

    const state = vscode.getState();
    if (state?.unifiedComments !== undefined) {
        unifiedComments = state.unifiedComments === true;
    }

    updateCommentModeButton();

    /*
     * A message posted before the webview finished loading is dropped, so the
     * host waits to be asked rather than pushing the first render.
     */
    vscode.postMessage(new WebpanelPostMessage(WebpanelPostMessageKind.Ready, JSON.stringify(emptyString)));
}());
