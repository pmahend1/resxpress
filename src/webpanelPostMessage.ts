import { WebpanelPostMessageKind } from "./webpanelMessageKind";

export class WebpanelPostMessage {
    constructor(public type: WebpanelPostMessageKind, public text?: string) {
        this.type = type;
        this.text = text;
    }
}