import * as vscode from "vscode";
export class NotificationService
{
    private context: vscode.ExtensionContext;
    public readonly storageKeyPrefix: string;
    private readonly lastRatingPromptDateKey: string;

    constructor(context: vscode.ExtensionContext)
    {
        this.context = context;
        this.storageKeyPrefix = this.context.extension.id + ".";
        this.lastRatingPromptDateKey = `${ this.storageKeyPrefix }lastRatingPromptDate`;
    }

    public async promptForReviewAsync(): Promise<void>
    {
        try
        {
            var shouldDisplayPrompt = this.shouldOpenRatingPrompt();
            if (shouldDisplayPrompt)
            {
                var text = "Loving ResXpress extension? Would you like to rate and review?";
                var selection = await vscode.window.showInformationMessage(text, "Sure", "Later", "Don't show again");
                if (selection)
                {
                    if (selection === "Sure")
                    {
                        var appName = vscode.env.appName.toLowerCase();
                        let vsCodeReviewUri: vscode.Uri = vscode.Uri.parse("https://marketplace.visualstudio.com/items?itemName=PrateekMahendrakar.resxpress&ssr=false#review-details");

                        if (appName.includes("codium"))
                        {
                            var codiumReviewUri = vscode.Uri.parse("https://open-vsx.org/extension/PrateekMahendrakar/resxpress/reviews");
                            vscode.env.openExternal(codiumReviewUri);
                        }
                        else
                        {
                            vscode.env.openExternal(vsCodeReviewUri);
                        }
                        //cant check if they really reviewed
                        //remind them after 30 days
                        var plus30days = new Date();
                        plus30days.setDate(plus30days.getDate() + 30);

                        this.context.globalState.update(this.lastRatingPromptDateKey, plus30days);
                    }
                    else if (selection === "Later")
                    {
                        this.context.globalState.update(this.lastRatingPromptDateKey, new Date());
                    }
                    else if (selection === "Don't show again")
                    {
                        var oneYear = new Date();
                        oneYear.setDate(oneYear.getDate() + 365);

                        this.context.globalState.update(this.lastRatingPromptDateKey, oneYear);
                    }
                }
            }
        }
        catch (error)
        {
            console.error(error);
        }
    }

    private shouldOpenRatingPrompt(): boolean
    {
        var lastPromptDateJunk = this.context.globalState.get(this.lastRatingPromptDateKey) as Date;
        var minus15days = new Date();
        minus15days.setDate(minus15days.getDate() - 15);

        if (lastPromptDateJunk)
        {
            var lastPromptDate = new Date(lastPromptDateJunk.toString());
            return lastPromptDate < minus15days;
        }
        else
        {
            return true;
        }
    }
}
