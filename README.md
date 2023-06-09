# ResXpress

Resx editor, previewer and reorganizer extension for Visual Studio Code and VSCodium.

<img src="./images/logo.png" alt="Logo" width="250" height="250">

[![License](https://img.shields.io/github/license/pmahend1/resxpress?style=flat-square&label=License&color=9cf)](https://choosealicense.com/licenses/mit/)![Deploy](https://img.shields.io/github/actions/workflow/status/pmahend1/resxpress/main.yml?branch=main&color=brightgreen&label=Deploy%20CI&style=flat-square&logo=github)

<!-- Visual Studio MarketPlace: Version|Installs|Downloads|Rating -->
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/PrateekMahendrakar.resxpress?style=for-the-badge&color=blue&logo=visualstudiocode&logoColor=blue&label=Visual%20Studio%20MarketPlace)](https://marketplace.visualstudio.com/items?itemName=PrateekMahendrakar.resxpress)![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/PrateekMahendrakar.resxpress?style=for-the-badge&color=blue)![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/PrateekMahendrakar.resxpress?style=for-the-badge&color=blue)![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/PrateekMahendrakar.resxpress?style=for-the-badge&color=blue)  
[![Open VSX Version](https://img.shields.io/open-vsx/v/PrateekMahendrakar/resxpress?color=darkcyan&logoColor=green&style=for-the-badge&logo=data:image/png;base64,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)](https://open-vsx.org/extension/PrateekMahendrakar/resxpress)![Open VSX Rating](https://img.shields.io/open-vsx/rating/prateekmahendrakar/resxpress?style=for-the-badge&color=darkcyan)![Open VSX Downloads](https://img.shields.io/open-vsx/dt/PrateekMahendrakar/ResxPress?style=for-the-badge&&color=darkcyan)

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

- Adding a new resx data.
- Editing an existing resx data.
- Deleting an existing resx data.
- Checks for resx data with duplicate keys and shows error if exists.
- To and Fro updates between Text document and ResxEditors as soon as typed valid resx data.
- To and fro updates Text document and ResxEditors when Save triggered on either.
- Automatically regenerate strongly typed resource class file(controlled by setting)

### Settings

`generateStronglyTypedResourceClassOnSave`: Generate/update strongly typed resource class files when updates to resx files are made.  Default is **`false`**.  
Ex: Resource1.resx → Resource1.Designer.cs  
> **Note**: You will need to add `resgen` to environment PATH.

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

- Type `resx` and snippet will pop up.
- If it doesnt then Control+Space(CMD+Space for Mac) to trigger intellisense.
- Edit key, value and comment values(press Tab to go to next editable value)

![Snippet](./images/snippet.png)

## Requirements

- Built in markdown support
- VS code 1.69+

## Extension Settings

None as of now.

## Known Issues

None as of now.

## Release Notes

[ChangeLog](./CHANGELOG.md)
