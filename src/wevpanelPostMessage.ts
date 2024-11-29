import { WebpanelPostMessageKind } from "./webpanelMessageKind";

export class WebpanelPostMessage {
    constructor(public type: WebpanelPostMessageKind, public json?: string) {
        this.type = type;
        this.json = json;
    }
}