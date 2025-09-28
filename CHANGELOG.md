# Change Log

## 7.6.0 - 28-Sep-2025

- Added sort by keys button to webview editor.
- Fixed namespace not being updated on webview editor.

## 7.5.0 - 21-Sep-2025

- [#117: `focusout` event changed to `input` event for key, value and comment input fields to make it more responsive.](https://github.com/pmahend1/resxpress/issues/117)
- Package updates.

## 7.4.0 - 14-Sep-2025

- [#109: Added indentSpaceLength setting](https://github.com/pmahend1/resxpress/issues/109)
- [#110: Added enable local logs setting](https://github.com/pmahend1/resxpress/pull/110)
- [#111: Make webpanel dirty only if key/value/comment is updated for edit mode](https://github.com/pmahend1/resxpress/pull/111)
- Package updates.

## 7.3.0 - 18-Jul-2025

- Package updates.

## 7.2.2 - 08-Mar-2025

- Fixes [namespace contains ;](https://github.com/pmahend1/resxpress/issues/106)
- Package updates
- Deploy workflow fix.

## 7.2.1 - 07-Mar-2025

- [Fixed an issue where multiple resources C# file was getting created for different cultures#101](https://github.com/pmahend1/resxpress/issues/101)
- Added setting to choose between file-scoped vs block-scoped namespace for C# resource file
- Package updates.

## 7.1.1 - 03-Dec-2024

- [Allows `_` in C# resource property name.](https://github.com/pmahend1/resxpress/issues/98)
  Thanks to [@manugparedes](https://github.com/manugparedes) for contribution.
- Some package updates.

## 7.1.0 - 02-Dec-2024

- Fixed a bug with unable to create file URI on windows and linux.
- Switched to pnpm from yarn.
- Package updates to latest.

## 7.0.0 - 29-Nov-2024

- Added feature to add a new resx file.
- Added feature to add/update resx namespace.
- Improvements to C# resource file generation. No longer needs resgen.
- Fixed some issues with generation of C# resource file.
- Webview Resx editor is default now.
- `yarn` upgrades.

## 6.1.1 - 18-Jun-2024

- `yarn` upgrades.
- Fixes [braces vulnerability](https://github.com/advisories/GHSA-grv7-fg5c-xmjg)

## 6.1.0 - 17-Apr-2024

- `yarn` upgrades.
- Added sponsorship.

## 6.0.2 - 10-Feb-2024

- Fixed an issue which generated `undefined` string in strongly typed resource file name.

## 6.0.1 - 09-Feb-2024

- Fixed an issue where webpack did not export webpanelScript.js
- Updated es-lint
  
## 6.0.0 - 08-Feb-2024

- Custom editor is set to *optional* now to be compatible with git diff. You can still open ResxEditor from editor context menu for resx files. Right click on file -> Open with -> select ResXpress Editor.
- **Web Preview** now available in **editor/context** and **editor/title/context** menus too.
- Added **Switch to Text Editor** button on resx editor.
- Added implementation to generate strongly typed resource class files on non Windows platforms.
- `yarn` upgrades.

## 5.8.0 - 31-Jan-2024

- `yarn` upgrades.
- Fixed snippet not popping issue.

## 5.7.0 - 02-Jan-2024

- `yarn` upgrades
- Strongly typed resource generation only on Windows.

## 5.6.0 - 10-Nov-2023

- `yarn` upgrades.

## 5.5.0 - 20-Sep-2023

- `yarn` upgrades.

## 5.4.0 - 30-Jul-2023

- `yarn` upgrades.

## 5.3.1 - 9-Jun-2023

- Updated broken badge icons.

## 5.3.0 - 8-Jun-2023

- `yarn` upgrades.

## 5.2.0 - 18-Apr-2023

- `yarn` upgrades.

## 5.1.0 - 15-Mar-2023

- `yarn` upgrades.

## 5.0.0 - 5-Jan-2023

- `ResGen` added as setting.
- Reverted to classic `yarn` because of no VSCE support for yarn v2 or v3.
- `yarn` upgrades.

---

## 4.9.3 - 31-Dec-2022

- Fixed shields.io badges.
- Set to modern `yarn`.
- `yarn` upgrades.
- pullrequest.yml checks if changelog and package.json have changed.  

---

## 4.9.0 - 25-Sep-2022

- Yarn upgrades.

---

## 4.8.0 - 01-Aug-2022

- Yarn upgrades.

---

## 4.7.0 - 13-Jul-2022

- Yarn upgrades.

---

## 4.6.0 - 17-Jun-2022

- Yarn upgrades.
- Added `Don't show again` for rating prompt.

## 4.5.0 - 27-Mar-2022

- Yarn upgrades.

## 4.4.0 - 01-Jan-2022

- Added review prompt.
- Yarn upgrades

## 4.2.1 - 27-Jun-2021

- Yarn upgrades

## 4.2.0 - 21-Feb-2021

- Yarn upgrades

## 4.1.0 - 18-Oct-2020

- Resx Key-Value-Comment snippet added with prefix `resx`.

## 4.0.6 - 18-Oct-2020

- Fixed overflown content on top of sticky header visible issue.

## 4.0.5 - 17-Oct-2020

- Error div moved to top.
- Sticky top elements.

## 4.0.4 - 17-Oct-2020

- Fixed indexing issue causing multiple errors with 'Data with same key already exists'

## 4.0.3 - 17-Oct-2020

- Typo fix in package json description.

## 4.0.2 - 17-Oct-2020

- Updated banner color and package.json description
- Removed BuymeCoffee from VS Marketplace.
- Updated editor id.
- Deleted unused files

## 4.0.0 - 15-Oct-2020

Resx custom editor added. Now you can edit files in a webview based custom editor similar to Visual Studio Windows.

## 3.0.0 - 7-Oct-2020

Added `resxpress.newpreview` command.
Added support for displaying resx comments.

---

## 2.7.1 - 6-Oct-2020

Added badges.

## 2.6.1 - 2-Oct-2020

Added badges.

---

## 2.6.0 - 9-Aug-2020

Updated packages

---

## 2.3.0 - 26-Mar-2020

### Added

- Character escaping for displaying special characters newline characters in Markdown

---

## 2.2.3 - 23-Mar-2020

### Updated

- npm package updates

---

## 2.0.3 - 29-Jan-2020

### Added

- Command **Sort By Keys**

---

## 1.0.5 - 26-Jan-2020

### Added

- fixed camel-casing issue in markdown preview.

---

## 1.0.4 - 23-Jan-2020

### Added

- ext: resx added in package.json

---

## 1.0.2 - 21-Dec-2019

### Added

- Icon for the extension.

---

## 1.0.1 - 21-Dec-2019

### Added

- webpack bundling added

### Updated

- ReadMe updated

---

## 1.0.0 - 21-Dec-2019

Initial release of ResXpress

### Added

- ResXpress: Preview Resx Command
