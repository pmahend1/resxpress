# ResXpress

Resx editor, previewer and reorganizer extension for Visual Studio Code and VSCodium.

<img src="./images/logo.png" alt="Logo" width="250" height="250">

[![License](https://img.shields.io/github/license/pmahend1/resxpress?style=flat-square&label=License)](https://choosealicense.com/licenses/mit/)
![Deploy](https://img.shields.io/github/workflow/status/pmahend1/resxpress/Deploy%20CI?color=brightgreen&label=Deploy%20CI&style=flat-square&logo=github)

[![Version](https://vsmarketplacebadge.apphb.com/version/PrateekMahendrakar.ResxPress.svg?logo=visual-studio-code&style=for-the-badge)](https://marketplace.visualstudio.com/items?itemName=PrateekMahendrakar.resxpress)![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/PrateekMahendrakar.ResxPress?style=for-the-badge)![Downloads](https://vsmarketplacebadge.apphb.com/downloads/PrateekMahendrakar.resxpress.svg?style=for-the-badge&label=Downloads)

![Open VSX Version](https://img.shields.io/open-vsx/v/prateekmahendrakar/resxpress?style=for-the-badge&logo=data:image/png;base64,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)![Open VSX Rating](https://img.shields.io/open-vsx/rating/prateekmahendrakar/resxpress?style=for-the-badge)![Open VSX Downloads](https://img.shields.io/open-vsx/dt/PrateekMahendrakar/ResxPress?style=for-the-badge)

[<img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" width="100" height="25">](https://www.buymeacoffee.com/pmahend1)

---

## Features

### Custom Resx Editor

![Resx Editor](./images/../images/resxEditor.png)

This is **active by default** when the file is opened, _however_ you can choose to open from **Explorer Panel - Right Click on the resx file - Choose ResXpress Editor**

![Custom Editor Option](./images/resxEditorOption.png)

Below is the **Text Editor** vs. **Resx Editor** side by side comparision.

![Compare Editors](/images/textVsResxEditor.png)

It offers the following features;

-   Adding a new resx data.
-   Editing an existing resx data.
-   Deleting an existing resx data.
-   Checks for resx data with duplicate keys and shows error if exists.
-   To and Fro updates between Text document and ResxEditors as soon as typed valid resx data.
-   To and fro updates Text document and ResxEditors when Save triggered on either.

### ResXpress: Markdown Preview

Preview resx file as Markdown table.

![Screenshot1](./images/preview.gif)

### ResXpress: Sort By Keys

Reorganize file by sorting by Keys.

![Screenshot2](./images/sortByKeys.gif)

### ResXpress: Web Preview

Preview resx file as a nice Webview table.

![Screenshot3](./images/webPreview.gif)

### Resx Data Snippet

-   Type `resx` and snippet will pop up.
-   If it doesnt then Control+Space(CMD+Space for Mac) to trigger intellisense.
-   Edit key, value and comment values(press Tab to go to next editable value)

![Snippet](./images/snippet.png)

## Requirements

-   Built in markdown support
-   VS code 1.53+

## Extension Settings

None as of now.

## Known Issues

None as of now.

## Release Notes

[ChangeLog](./CHANGELOG.md)
