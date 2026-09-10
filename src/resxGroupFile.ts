import * as path from "path";
import * as vscode from "vscode";
import type { ResxFileName } from "./resxFileName";

/** One culture's file within a {@link ResxGroup}: its parsed name and its uri. */
export class ResxGroupFile {
    public readonly name: ResxFileName;
    public readonly uri: vscode.Uri;

    constructor(name: ResxFileName, uri: vscode.Uri) {
        this.name = name;
        this.uri = uri;
    }

    public get culture(): string {
        return this.name.culture;
    }

    /* Off the uri, not the group's base name: case folding means they can differ. */
    public get fileName(): string {
        return path.posix.basename(this.uri.path);
    }
}
