import * as vscode from "vscode";

export class TextInputBoxOptions implements vscode.InputBoxOptions {
    constructor(public title?: string,
        public value?: string,
        public valueSelection?: [number, number],
        public prompt?: string,
        public placeHolder?: string,
        public ignoreFocusOut?: boolean
    ) {
        this.title = title;
        this.value = value;
        this.valueSelection = valueSelection;
        this.prompt = prompt;
        this.placeHolder = placeHolder;
        this.ignoreFocusOut = ignoreFocusOut;
    }

    validateInput(value: string): string | vscode.InputBoxValidationMessage | undefined | null | Thenable<string | vscode.InputBoxValidationMessage | undefined | null> {
        if(value.length === 0)
        {
            return {message: "Should not be empty!", severity: vscode.InputBoxValidationSeverity.Error};
        }
        
    }
}