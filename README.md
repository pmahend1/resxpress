# ResXpress

Resx editor, previewer and reorganizer extension for Visual Studio Code and VSCodium.

![logo](./images/logo-small.png)

[![License](https://img.shields.io/github/license/pmahend1/resxpress?style=flat-square&label=License&color=9cf)](https://choosealicense.com/licenses/mit/)![Deploy](https://img.shields.io/github/actions/workflow/status/pmahend1/resxpress/main.yml?branch=main&color=brightgreen&label=Deploy%20CI&style=flat-square&logo=github)

<!-- Visual Studio MarketPlace: Version|Installs|Downloads|Rating -->
[![Visual Studio Marketplace Version](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fpmahend1%2Fresxpress%2Fbadges%2F.github%2Fbadges%2Fvsmp-version.json&style=for-the-badge&color=blue&logo=data:image%2Fsvg%2Bxml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI%2BPHBhdGggZmlsbD0iIzAwN0FDQyIgZD0iTTIzLjE1IDIuNTg3TDE4LjIxLjIxYTEuNDk0IDEuNDk0IDAgMCAwLTEuNzA1LjI5bC05LjQ2IDguNjMtNC4xMi0zLjEyOGEuOTk5Ljk5OSAwIDAgMC0xLjI3Ni4wNTdMLjMyNyA3LjI2MUExIDEgMCAwIDAgLjMyNiA4Ljc0TDMuODk5IDEyIC4zMjYgMTUuMjZhMSAxIDAgMCAwIC4wMDEgMS40NzlMMS42NSAxNy45NGEuOTk5Ljk5OSAwIDAgMCAxLjI3Ni4wNTdsNC4xMi0zLjEyOCA5LjQ2IDguNjNhMS40OTIgMS40OTIgMCAwIDAgMS43MDQuMjlsNC45NDItMi4zNzdBMS41IDEuNSAwIDAgMCAyNCAyMC4wNlYzLjkzOWExLjUgMS41IDAgMCAwLS44NS0xLjM1MnptLTUuMTQ2IDE0Ljg2MUwxMC44MjYgMTJsNy4xNzgtNS40NDh2MTAuODk2eiIvPjwvc3ZnPg==)](https://marketplace.visualstudio.com/items?itemName=PrateekMahendrakar.resxpress)![Installs](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fpmahend1%2Fresxpress%2Fbadges%2F.github%2Fbadges%2Fvsmp-installs.json&style=for-the-badge&color=blue)![Downloads](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fpmahend1%2Fresxpress%2Fbadges%2F.github%2Fbadges%2Fvsmp-downloads.json&style=for-the-badge&color=blue)![Rating](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fpmahend1%2Fresxpress%2Fbadges%2F.github%2Fbadges%2Fvsmp-rating.json&style=for-the-badge&color=blue)

<!-- Open VSX: Version|Downloads|Rating -->
[![Open VSX Version](https://img.shields.io/open-vsx/v/PrateekMahendrakar/resxpress?color=darkcyan&style=for-the-badge&logo=vscodium&logoColor=darkcyan)](https://open-vsx.org/extension/PrateekMahendrakar/resxpress)![Downloads](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2Fpmahend1%2Fresxpress%2Fbadges%2F.github%2Fbadges%2Fovsx-downloads.json&style=for-the-badge&color=darkcyan)![Rating](https://img.shields.io/open-vsx/rating/PrateekMahendrakar/resxpress?style=for-the-badge&color=darkcyan)

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
- Searching by key, value or comment to filter down a large resx file. `Ctrl+F` (`Cmd+F` on macOS) focuses the search box and `Esc` clears it.
- Checks for resx data with duplicate keys and shows error if exists.
- To and Fro updates between Text document and ResxEditors as soon as typed valid resx data.
- To and fro updates Text document and ResxEditors when Save triggered on either.
- Preserves the file as it was written: indentation, line endings, comment positions and the trailing
newline all survive an edit, and only the lines you changed are rewritten.
- Automatically regenerate strongly typed resource class file(controlled by setting)
- Add a new resx file.
- Update C# namespace of a resx file.

### ResXpress: Edit All Languages

Every culture of a resource in one editable table, one column per language - `Resource1.resx`,
`Resource1.de.resx`, `Resource1.fr.resx` and so on side by side, instead of one file at a time.

Open it from the command palette, from the explorer's right-click menu, or by right-clicking a
resx editor tab. Any culture of the resource will do: the whole family is found from whichever
file you start on.

- Each column writes back to its own file, using the same minimal-edit path as the single file
  editor, so a translation file only ever gains the lines you actually changed.
- A key missing from a translation shows as a highlighted empty cell - typing in it adds the
  entry to that language alone, and clearing a cell removes it again. Nothing writes blank
  entries into languages you did not touch.
- **Comments** collapse to a single column showing the default language's comment, or expand to
  one column per language for translated comments. The toolbar button switches between the two;
  the columns you hide are never rewritten.
- The Key column stays pinned while the languages scroll sideways, so the table stays readable
  however many languages there are.
- **Save All** saves every file the table has changed - most of them are not open in a tab of
  their own. Deleting a row removes that key from every language.

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

1. `indentSpaceLength`: Indent space length for resx xml, used only when a file's own indentation
cannot be detected. A file that is already indented keeps its own style.
Default: **4**.
Options: **2, 4, 8**.

## Known Issues

None as of now.

## Release Notes

[ChangeLog](./CHANGELOG.md)
