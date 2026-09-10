import * as path from "path";
import * as vscode from "vscode";
import type { CombinedColumn } from "./combinedColumn";
import type { CombinedEntry } from "./combinedEntry";
import type { CombinedPayload } from "./combinedPayload";
import { CombinedResx } from "./combinedResx";
import { Constants } from "./constants";
import { Logger } from "./logger";
import { nameof } from "./nameof";
import { ResxDocumentWriter } from "./resxDocumentWriter";
import type { ResxEntry } from "./resxEntry";
import { ResxFile } from "./resxFile";
import { ResxFileName } from "./resxFileName";
import { ResxGroup } from "./resxGroup";
import { Settings } from "./settings";
import { getNonce } from "./util";
import { WebpanelPostMessageKind } from "./webpanelMessageKind";
import { WebpanelPostMessage } from "./webpanelPostMessage";

const panelTitle = (baseName: string) => `${baseName} - All Languages`;
const unparseableFile = (fileName: string) => `${fileName} is not valid resx, so the combined panel is not being updated`;
const skippedWrite = (fileName: string) => `${fileName} is not valid resx, so it was left alone`;

/**
 * An editable table of every culture of one resource, one column per culture.
 *
 * The custom editor is a `CustomTextEditorProvider` and so is bound to exactly
 * one `TextDocument`; this is a plain `WebviewPanel` precisely because it has to
 * own several. Each column is written back through the same
 * {@link ResxDocumentWriter} minimal edit path the single file editor uses, so
 * every round-trip guarantee holds per file.
 */
export class CombinedResxPanel {

    public static readonly viewType = `${Constants.resxpress}.combinedEditor`;

    private static readonly openPanels = new Map<string, CombinedResxPanel>();

    private readonly panel: vscode.WebviewPanel;
    private readonly group: ResxGroup;
    private readonly disposables: vscode.Disposable[] = [];

    /** Set while our own edits are being applied, so they are not echoed back as a repaint. */
    private isWritingEdits = false;

    /*
     * Webview messages are handled one at a time. VS Code does not wait for one
     * async onDidReceiveMessage handler before invoking the next, and Save All
     * arrives immediately behind the write it is meant to follow - so without
     * this the save can land first and the write that follows leaves every file
     * dirty again, right after the user asked to save them.
     */
    private queue: Promise<void> = Promise.resolve();

    private constructor(panel: vscode.WebviewPanel, group: ResxGroup, extensionUri: vscode.Uri) {
        this.panel = panel;
        this.group = group;
        this.panel.webview.html = this.getHtmlForWebview(this.panel.webview, extensionUri);

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        this.panel.webview.onDidReceiveMessage((message) => {
            Logger.instance.info(`${nameof(CombinedResxPanel)}: ${message.type}`);
            switch (message.type) {
                case WebpanelPostMessageKind.Ready:
                    this.enqueue(() => this.pushToWebview());
                    break;
                case WebpanelPostMessageKind.TriggerCombinedUpdate:
                    this.enqueue(() => this.writeEntries(JSON.parse(message.text) as CombinedEntry[]));
                    break;
                case WebpanelPostMessageKind.SaveAll:
                    this.enqueue(() => this.saveAll());
                    break;
                case WebpanelPostMessageKind.SortByKeys:
                    this.enqueue(() => this.sortAll());
                    break;
            }
        }, null, this.disposables);

        /*
         * Any of the group's files can also be open in a text editor or be
         * changed by another extension, and all of them are on screen here at
         * once, so the panel follows every one of them.
         */
        vscode.workspace.onDidChangeTextDocument(event => {
            if (this.isWritingEdits || event.contentChanges.length === 0) {
                return;
            }

            if (this.isGroupDocument(event.document)) {
                void this.pushToWebview();
            }
        }, null, this.disposables);
    }

    public static async createOrShow(extensionUri: vscode.Uri, uri: vscode.Uri): Promise<void> {
        const group = await ResxGroup.resolve(uri);

        const existing = CombinedResxPanel.openPanels.get(group.key);
        if (existing !== undefined) {
            existing.panel.reveal(existing.panel.viewColumn);
            return;
        }

        // Loaded up front so an unreadable file fails here rather than half way through a render.
        for (const culture of group.cultures) {
            const cultureUri = group.uriFor(culture);
            if (cultureUri !== undefined) {
                await vscode.workspace.openTextDocument(cultureUri);
            }
        }

        const panel = vscode.window.createWebviewPanel(CombinedResxPanel.viewType,
                                                       panelTitle(group.baseName),
                                                       vscode.ViewColumn.Active,
                                                       {
                                                           enableScripts: true,
                                                           enableForms: true,
                                                           localResourceRoots: [vscode.Uri.joinPath(extensionUri, "styles"),
                                                                                vscode.Uri.joinPath(extensionUri, "out")]
                                                       });

        CombinedResxPanel.openPanels.set(group.key, new CombinedResxPanel(panel, group, extensionUri));
    }

    private enqueue(work: () => Promise<void>): void {
        this.queue = this.queue
            .then(work)
            .catch(error => {
                if (error instanceof Error) {
                    Logger.instance.error(error);
                }
            });
    }

    public dispose(): void {
        CombinedResxPanel.openPanels.delete(this.group.key);
        this.panel.dispose();

        while (this.disposables.length > 0) {
            this.disposables.pop()?.dispose();
        }
    }

    /**
     * Writes each column back to its own file. Cultures whose data did not
     * change are skipped outright: handing an unchanged list to the writer
     * produces no edit, but only because the round trip is byte exact, and a
     * dozen untouched translation files is a bad place to lean on that.
     */
    private async writeEntries(entries: CombinedEntry[]): Promise<void> {
        this.isWritingEdits = true;
        try {
            for (const culture of this.group.cultures) {
                const document = await this.documentFor(culture);
                if (document === undefined) {
                    continue;
                }

                const current = CombinedResxPanel.readEntries(document);
                if (current === undefined) {
                    Logger.instance.warning(skippedWrite(this.group.fileNameFor(culture)));
                    continue;
                }

                const desired = CombinedResx.split(entries, culture, current.map(entry => entry.key));
                if (JSON.stringify(current) === JSON.stringify(desired)) {
                    continue;
                }

                await ResxDocumentWriter.applyEntries(document, desired);
            }
        }
        finally {
            this.isWritingEdits = false;
        }
    }

    /*
     * A webview panel is not an editor, so Ctrl+S does not reach the documents
     * behind it and each language would otherwise have to be saved from its own
     * tab - several of which are never opened.
     */
    private async saveAll(): Promise<void> {
        for (const culture of this.group.cultures) {
            const document = await this.documentFor(culture);
            if (document?.isDirty === true) {
                await document.save();
            }
        }
    }

    private async sortAll(): Promise<void> {
        this.isWritingEdits = true;
        try {
            for (const culture of this.group.cultures) {
                const document = await this.documentFor(culture);
                if (document !== undefined) {
                    await ResxDocumentWriter.sortByKey(document);
                }
            }
        }
        finally {
            this.isWritingEdits = false;
        }

        await this.pushToWebview();
    }

    private async pushToWebview(): Promise<void> {
        const payload = await this.buildPayload();
        if (payload === undefined) {
            return;
        }

        this.panel.webview.postMessage(new WebpanelPostMessage(WebpanelPostMessageKind.UpdateCombinedPanel,
                                                               JSON.stringify(payload)));
    }

    private async buildPayload(): Promise<CombinedPayload | undefined> {
        const entriesByCulture: Record<string, ResxEntry[]> = {};
        const columns: CombinedColumn[] = [];

        for (const culture of this.group.cultures) {
            const document = await this.documentFor(culture);
            if (document === undefined) {
                continue;
            }

            const entries = CombinedResxPanel.readEntries(document);
            if (entries === undefined) {
                // One half typed tag in any file would otherwise blank the whole table.
                Logger.instance.warning(unparseableFile(this.group.fileNameFor(culture)));
                return undefined;
            }

            entriesByCulture[culture] = entries;
            columns.push({
                culture: culture,
                label: ResxFileName.label(culture),
                fileName: this.group.fileNameFor(culture)
            });
        }

        return {
            columns: columns,
            entries: CombinedResx.combine(columns.map(column => column.culture), entriesByCulture)
        };
    }

    /*
     * Resolved per use rather than cached: a document nothing is showing can be
     * closed out from under us, and openTextDocument hands back the live
     * instance - unsaved edits and all - when the file is already open.
     */
    private async documentFor(culture: string): Promise<vscode.TextDocument | undefined> {
        const uri = this.group.uriFor(culture);
        if (uri === undefined) {
            return undefined;
        }

        try {
            return await vscode.workspace.openTextDocument(uri);
        }
        catch (error) {
            if (error instanceof Error) {
                Logger.instance.error(error);
            }

            return undefined;
        }
    }

    private isGroupDocument(document: vscode.TextDocument): boolean {
        const changed = document.uri.toString();
        return this.group.cultures.some(culture => this.group.uriFor(culture)?.toString() === changed);
    }

    private static readEntries(document: vscode.TextDocument): ResxEntry[] | undefined {
        try {
            return ResxFile.parse(document.getText(), Settings.indentSpaceLength).entries;
        }
        catch (error) {
            if (error instanceof Error) {
                Logger.instance.warning(error.message);
            }

            return undefined;
        }
    }

    private getHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionUri.fsPath, "out", "combinedPanelScript.js")));
        const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionUri.fsPath, "styles", "combinedPanel.css")));
        const maPlusThick = webview.asWebviewUri(vscode.Uri.file(path.join(extensionUri.fsPath, "styles", "ma-plus-thick.svg")));
        const faSortAtoZ = webview.asWebviewUri(vscode.Uri.file(path.join(extensionUri.fsPath, "styles", "fa-arrow-down-a-z-solid-full.svg")));
        const nonce = getNonce();

        /*
         * No resx content is interpolated here at all - not even a column
         * header, since a file name is user controlled too. The shell ships
         * empty and the webview builds every header and every row with DOM APIs
         * from what the host posts back.
         */
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="${styleUri}" rel="stylesheet" />
    <title>All Languages</title>
</head>
<body>
    <div class="toolbar">
        <button id="addButton" class="btn primary">
            <img src="${maPlusThick}" alt="Add Icon" class="icon filter-fefefe"> Add New Resource
        </button>
        <button id="saveAllButton" class="btn secondary" title="Save every language file this table has changed">
            Save All
        </button>
        <button id="sortByKeysButton" class="btn secondary" title="Sort every language file by key">
            <img src="${faSortAtoZ}" alt="Sort Icon" class="icon filter-fefefe">Sort By Keys
        </button>
        <button id="commentModeButton" class="btn secondary"></button>
        <p id="errorBlock" class="error-block"></p>
        <!-- Full width flex basis, so search takes a row of its own under the buttons. -->
        <div class="search-section">
            <input id="searchInput" class="search-input" type="search"
                   placeholder="Search key, value or comment"
                   aria-label="Search key, value or comment" />
            <span id="searchStatus" class="search-status"></span>
        </div>
    </div>

    <div class="table-scroll">
        <table id="tbl">
            <thead id="tableHead">
            </thead>
            <tbody>
            </tbody>
        </table>
    </div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}
