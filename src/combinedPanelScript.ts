import type { CombinedColumn } from "./combinedColumn";
import type { CombinedEntry } from "./combinedEntry";
import type { CombinedPayload } from "./combinedPayload";
import { CellEdit } from "./cellEdit";
import { emptyString } from "./constants";
import { nameof } from "./nameof";
import { WebpanelPostMessageKind } from "./webpanelMessageKind";
import { WebpanelPostMessage } from "./webpanelPostMessage";

const resxpressCombinedPanel = "resxpress.combinedPanel";
const tbody = "tbody";
const tableHead = "tableHead";
const tableScroll = "tableScroll";
const errorBlock = "errorBlock";
const errorText = "errorText";
const keyField = CellEdit.keyField;
const valueField = CellEdit.valueField;
const commentField = CellEdit.commentField;
const tr = "tr";
const td = "td";
const th = "th";
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
const message = "message";
const keydown = "keydown";
const scroll = "scroll";
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
const errorDuplicateKey = (key: string) => `Data with ${key} already exists`;
const errorKeyMandatory = "Key is a mandatory field!";
const errorInvalidPayload = "Could not read the language files";
const searchSummary = (matchCount: number, total: number) => `Showing ${matchCount} of ${total}`;
const macUserAgentMarker = "Mac";
const macFindShortcut = "⌘F";
const findShortcut = "Ctrl+F";
const searchTooltip = (shortcut: string) => `Search key, value or comment (${shortcut} to focus, Esc to clear)`;
const pixels = (length: number) => `${length}px`;
const documentUpdateDelayInMilliseconds = 300;
const scrollPersistDelayInMilliseconds = 150;

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
    const errorTextElement = document.getElementById(errorText);
    const searchInputElement = getInput(searchInput);
    const searchStatusElement = document.getElementById(searchStatus);
    const commentModeElement = document.getElementById(commentModeButton);
    const scrollContainer = document.getElementById(tableScroll);

    let currentColumns: CombinedColumn[] = [];
    let currentEntries: CombinedEntry[] = [];
    let unifiedComments = true;
    let groupUri: string | undefined;
    let pendingUpdateHandle: ReturnType<typeof setTimeout> | undefined;
    let pendingStateHandle: ReturnType<typeof setTimeout> | undefined;
    let pendingScroll: { top: number, left: number } | undefined;

    function showError(errorMessage: string) {
        if (errorContainer === null || errorTextElement === null) {
            return;
        }

        errorTextElement.innerText = errorMessage;
        // Hidden rather than emptied: an empty row would still take a line's height.
        errorContainer.hidden = errorMessage.length === 0;
    }

    function getInput(id: string): HTMLInputElement | undefined {
        const element = document.getElementById(id);
        return element instanceof HTMLInputElement ? element : undefined;
    }

    function getField(id: string): HTMLInputElement | HTMLTextAreaElement | undefined {
        const element = document.getElementById(id);
        return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element : undefined;
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

    function inputEvent(event: Event) {
        const target = event.target;
        if (target instanceof HTMLInputElement === false && target instanceof HTMLTextAreaElement === false) {
            return;
        }

        // The neutral culture is the empty string, so its ids end in a bare dot.
        const [indexText, field, culture = emptyString] = target.id.split(".");
        const index = Number(indexText);
        if (Number.isInteger(index) === false || index < 0 || index >= currentEntries.length) {
            return;
        }

        const entry = CellEdit.applyCombined(currentEntries[index], field, culture, target.value);
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
            row.appendChild(createCell(createTextArea(inputId(index, valueField, culture), entry.values[culture] ?? emptyString),
                valueColumnClass));
            if (unifiedComments === false) {
                row.appendChild(createCell(createTextArea(inputId(index, commentField, culture), entry.comments[culture] ?? emptyString),
                    commentColumnClass));
            }
        }

        if (unifiedComments) {
            const culture = keyAuthorityCulture();
            row.appendChild(createCell(createTextArea(inputId(index, commentField, culture), entry.comments[culture] ?? emptyString),
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
            const cell = getField(inputId(index, valueField, column.culture))?.parentElement;
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
        reserveStickyEdges();
        restoreScrollPosition();
    }

    /*
     * Scroll-into-view measures the scrollport, not what the sticky Key column
     * and header row paint over it, so tabbing parks the next cell underneath
     * them. Scroll padding shrinks the region it will call "in view";
     * remeasured every render because the Key column is sized by its content.
     */
    function reserveStickyEdges() {
        if (scrollContainer === null || head === null) {
            return;
        }

        const keyHeaderCell = head.querySelector(`${th}.${keyColumnClass}`);
        if (keyHeaderCell instanceof HTMLElement) {
            scrollContainer.style.scrollPaddingLeft = pixels(keyHeaderCell.offsetWidth);
        }

        scrollContainer.style.scrollPaddingTop = pixels(head.offsetHeight);
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
        persistState();
        renderTable();
    }

    /*
     * One writer, because setState replaces the whole object: a comment mode saved
     * on its own would drop the uri the serializer restores from, and the offset.
     */
    function persistState() {
        vscode.setState({
            unifiedComments: unifiedComments,
            groupUri: groupUri,
            scrollTop: scrollContainer?.scrollTop ?? 0,
            scrollLeft: scrollContainer?.scrollLeft ?? 0,
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

    /*
     * Applied once the rows exist - the payload arrives a message after the webview
     * loads, and scrolling an empty table clamps to 0 - and only once, so a later
     * repaint cannot drag the user back up. Both axes: the languages run off to the right.
     */
    function restoreScrollPosition() {
        if (pendingScroll === undefined || scrollContainer === null) {
            return;
        }

        const offset = pendingScroll;
        pendingScroll = undefined;
        scrollContainer.scrollTo(offset.left, offset.top);
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

        // VS Code's own find widget cannot see into <input> or <textarea> values, and every cell here is one.
        document.addEventListener(keydown, event => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === findKey) {
                event.preventDefault();
                searchInputElement.focus();
                searchInputElement.select();
            }
        }, false);
    }

    if (scrollContainer !== null) {
        scrollContainer.addEventListener(scroll, scheduleStatePersist, false);
    }

    // A hidden webview is torn down, so whatever is still queued has to go now.
    document.addEventListener(visibilityChange, () => {
        if (document.visibilityState === hidden) {
            flushDocumentUpdate();
            persistState();
        }
    });

    window.addEventListener(message, event => {
        const messageData = event.data;
        logToConsole(`addEventListener ${messageData.type} message received`);

        if (messageData.type === WebpanelPostMessageKind.UpdateCombinedPanel) {
            updatePanelWebContent(messageData.text);
        }

        if (messageData.type === WebpanelPostMessageKind.CombinedPanelIdentity) {
            groupUri = JSON.parse(messageData.text);
            persistState();
        }
    });

    const state = vscode.getState();
    if (state?.unifiedComments !== undefined) {
        unifiedComments = state.unifiedComments === true;
    }

    // Held until the host says otherwise, so a toggle before then does not drop it.
    if (typeof state?.groupUri === "string") {
        groupUri = state.groupUri;
    }

    // Restored with the offset: one measured over filtered rows means nothing without its filter.
    if (typeof state?.search === "string" && searchInputElement !== undefined) {
        searchInputElement.value = state.search;
    }

    if (typeof state?.scrollTop === "number" && typeof state?.scrollLeft === "number") {
        pendingScroll = { top: state.scrollTop, left: state.scrollLeft };
    }

    updateCommentModeButton();

    /*
     * A message posted before the webview finished loading is dropped, so the
     * host waits to be asked rather than pushing the first render.
     */
    vscode.postMessage(new WebpanelPostMessage(WebpanelPostMessageKind.Ready, JSON.stringify(emptyString)));
}());
