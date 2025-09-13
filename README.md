# ResXpress

Resx editor, previewer and reorganizer extension for Visual Studio Code and VSCodium.

<img src="./images/logo.png" alt="Logo" width="250" height="250">

[![License](https://img.shields.io/github/license/pmahend1/resxpress?style=flat-square&label=License&color=9cf)](https://choosealicense.com/licenses/mit/)![Deploy](https://img.shields.io/github/actions/workflow/status/pmahend1/resxpress/main.yml?branch=main&color=brightgreen&label=Deploy%20CI&style=flat-square&logo=github)

<!-- Visual Studio MarketPlace: Version|Installs|Downloads|Rating -->
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/PrateekMahendrakar.resxpress?style=for-the-badge&color=blue&logo=visualstudiocode&logoColor=blue&label=Visual%20Studio%20MarketPlace)](https://marketplace.visualstudio.com/items?itemName=PrateekMahendrakar.resxpress)![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/PrateekMahendrakar.resxpress?style=for-the-badge&color=blue)![Visual Studio Marketplace Downloads](https://img.shields.io/visual-studio-marketplace/d/PrateekMahendrakar.resxpress?style=for-the-badge&color=blue)![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/PrateekMahendrakar.resxpress?style=for-the-badge&color=blue)  
[![Open VSX Version](https://img.shields.io/open-vsx/v/PrateekMahendrakar/resxpress?color=darkcyan&style=for-the-badge&logo=vscodium&logoColor=darkcyan)](https://open-vsx.org/extension/PrateekMahendrakar/resxpress)![Open VSX Rating](https://img.shields.io/open-vsx/rating/prateekmahendrakar/resxpress?style=for-the-badge&color=darkcyan)![Open VSX Downloads](https://img.shields.io/open-vsx/dt/PrateekMahendrakar/ResxPress?style=for-the-badge&&color=darkcyan)

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
- Add a new resx file.
- Update C# namespace of a resx file.

### ResXpress: Markdown Preview

Preview resx file as Markdown table.

![Screenshot1](./images/preview.gif)

### ResXpress: Sort By Keys

Reorganize file by sorting by Keys.

![Screenshot2](./images/sortByKeys.gif)

### ResXpress: Web Preview

Preview resx file as a nice Webview table.

![Screenshot3](./images/webPreview.gif)

### Adding new resx file

![Adding resx file](./images/createNewResxFile.gif)

### Updating resx C# namespace

![Resx namespace](./images/updateResxNamespace.gif)

### Resx Data Snippet

- Type `resx` and snippet will pop up.
- If it doesnt then Control+Space(CMD+Space for Mac) to trigger intellisense.
- Edit key, value and comment values(press Tab to go to next editable value)

![Snippet](./images/snippet.png)

### Settings

1. `generateStronglyTypedResourceClassOnSave`: Generate/update strongly typed resource class files when updates to resx files are made.  
Default: **`false`**.  
Ex: Resource1.resx → Resource1.Designer.cs  

1. `useFileScopedNamespace`: Use File Scoped Namespace.  
Default: **`true`**  
**true**: File scoped namespaces.  
**false**: Block scoped namespaces.  

1. `indentSpaceLength`: Indent space length for resx xml.
Default: **4**.
Options: **2, 4, 8**.

## Known Issues

None as of now.

## Release Notes

[ChangeLog](./CHANGELOG.md)
