# ResXpress

Resx editor, previewer and reorganizer extension for Visual Studio Code and VSCodium.

<img src="./images/logo.png" alt="Logo" width="250" height="250">

[![License](https://img.shields.io/github/license/pmahend1/resxpress?style=flat-square&label=License&color=9cf)](https://choosealicense.com/licenses/mit/)
![Deploy](https://img.shields.io/github/workflow/status/pmahend1/resxpress/Deploy%20CI?color=brightgreen&label=Deploy%20CI&style=flat-square&logo=github)

[![Version](https://vsmarketplacebadge.apphb.com/version/PrateekMahendrakar.ResxPress.svg?logo=visual-studio-code&style=for-the-badge&logoColor=blue&color=blue)](https://marketplace.visualstudio.com/items?itemName=PrateekMahendrakar.resxpress)![Visual Studio Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/PrateekMahendrakar.ResxPress?style=for-the-badge&color=blue)![Downloads](https://vsmarketplacebadge.apphb.com/downloads/PrateekMahendrakar.resxpress.svg?style=for-the-badge&label=Downloads&color=blue)

[![Open VSX Version](https://img.shields.io/open-vsx/v/prateekmahendrakar/resxpress?style=for-the-badge&color=darkcyan&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAiaSURBVGhD1ZkJiJVVFMff7FOjZdJCWVa2GNhiJiVuBZXRnkFlJWS0ULRSQpQh2WJgUQS2hwUNVkILZUVFtJhIi5YpZbaJNe06NtUb37xl+v3Pd74773szo/PMp9Mf7rv3/M+5955zv/vde7/7UtsTnZ2dg3K53JRCoTDGqf8fCKI+n89/QW6gPNdV/RZV+LmzlwM6OjomRiF0AW68q8tGtecVA9PmKbIN5K/ia33EplK1tbUNXgyAO9qLZaPigYCz9VNVVXUK0+diYyLYtPKygWBrvVg2yg6EznYgHY0Pg5zaHD71PFVdXT3Fiyq30MY3LsZY63llQcd1jOoyjSTBpFlxbqa4ycHA7nzZC5Q7yML7gvx4pDFdob29/QBXVRbpdHof7zeAwB5FVRVZmHO7wzWTN2ez2eMWLFhQQzmsTpRtqgkMxDVOi1/tdOVBZw04+Yf3HQB/g5vIZqzTNsrgBgKa7JS4J9w0BX+m0+LvcXrbgA7PI2W9fwNyB+kw1w8mZVxlweDwiWTxlPyBzJ4g/MniHCPFVQz5fGEWnc9jGkyjM1s+kY8hfRT1H4En9bZVAOgecNqAvIp0uoudmUzmcNnR5gWSqbvCKlYS+eT8Xr5x48aDxSNWk6bB/WVKwIY2Tjo4rWxvOG3A2dlwi1UmgFtkB3ebyzdJrijoZIY6i0Hn63H4GFfL6Ykkm2ronnZagTYiPyRewAYx/6zK5ItkQ/6meNI+VqmSoN86OlooB2Ig/006000UzIvicayNcmLH5j04C+53q+hA7tCTJc+Q3nHTyoO+tYRei6O/Rq6YM8JzOHo6eQgU+QSvFsD+MAyb79zEQFtLlPPEr3ezbQf6baTjS3Gi673xFAOHbf6XAn5fUhiIGHDD3WTbg/6rceA6UnvkThfg5rtZN6AL+4bAgGhPCpvpdgNOjMe5sGoJyO+7ukfg/CI3Fd51OpXleySXt5Wu0altCzrWyxxmF8UvXdUjmJrnuqmeSLM49pXD1IQa4X3aT1xra+sgxC0+DQfQ8B6kuTQ2zKlegV2zHBM2Fwj6JpJNSfKHnLtbMoF9h1iVyxVuzOZsXV6GbifZFIPlfwy8nSQ2C0buEu9snlO9gqX0IOzybp8IRIdGHHwJp75Et5s45A/c9hkyvW9rJMPfKz1TDFv0ETdLXAxsp8uWPEua4HTvwPZyr/Cxy8MIbuaGDRsGm0EJ6PB9t//cKQPT5oh43lH/HHHYPCaZ/ENGd4IpQbzRcixaGdfB5heyOq93ICmc81jq54gX7FsCbiSOrCQto7HRpunCEP1gc0VNTc2sgQMH3mdsCdDbWYv8NyMcfEANjpcldBkv/uz5kXzeXqkCujV1dXUfGZvqfDuuw5flHuiOd3EGcnhvKH/txSgQAjiNDkeQ1PBCog6jTiO7kTQiX0VMKhxPShDrf/G8Gxikpcppz2QcqSOdb0Iq9TxlUzDSD2rkjY1wkp4G+dRItDbS+PuCi1EgEA+jWKwyjWkEZqgsoKtF3pWinVDjzkqB3T9eTHy+8hTtyEIba5qamlqMpBnPA3DeVjChsbFxNf084qJwlHyCK17FnqLPdV4OgazD6FiivoMKBcpXUT7SLABzW4c6BSOHvldeCuxjffxkYmgkxRfvL4n3DN2q+vr65S7GmAW/3svy5cKoaPZ/kd0ZSRHC9zbO5xm9mTh0OWIdwV0RaUy3F9lkL3+gvBTwo5QzTUu/LSbph85fNymC2gugz/nUTzxpDS517NIO3QBke+EddyHH71nvoOHwLS3g3Hw4fQVqMTnEzQJ8if0BdRp96BBZy7KWyVb4HZ1WsB+rXQGdjvE9Xjpoo3SzAGx1zgv3Y5sFndnRvBg0klhaY8BPkp46S5zSE6ghvSse/WynxWvf+FO8UFynFNgNcTMDcp4FY6yr+wbqDaWiRjhA+4irE0C1QHqcesVlHfufFkeu+6twB5ZOp4eKj0GbV7uqG6g7xc0MtL9lFxQ0FL7wBORuxwI4fdZawOTrSFNJb7ncTpropgZWp+IbFU1X2+1L0dbWtiuOh28YyivItuxAqZ02asY61Sm3xlUB8KP04sQ7cQz4P3H6RDcL0Ki6SXiCpfAgPnUztZXmfRnV2t6+vw6TbtZ30Ibm82/eWI/XmQzpuDxRFAeCE20Mgl1ElALdZ26mNs91OkCXgPCr3MTAkWUJK8JPOU5znMN01TTNzfsOGn1ZjZHriXQ7VnNgPKQ4COyEU12dgH/ymjlZK2kHVxmQR5B+tIYcMrYDZFFiMBLHoD6BlzHcojBVTnE6AFpP7efIQh0Vwv1WKdDNdDPZPea0QU8QrvstplJREAKB6K+K8kAH4XRKRytITa4KoOEw7wn8VqcTQDWAujZNBbXrKi0Ap6FLfGkKcK20/Rpfj/drxSTp8/pYVGEj7zOoVEtj4dKA8iIa29vVBua1LhbsmhR9uNstBvx91gCgrNXIzls4dxF1dUsfgP4tuFMpFu/m/x00bDeCMejkH9Jc0sS1a9faPMfGngpcBufOs4oAqhZ5OrxPDLO5XTryBE8bP/F0zrCKlQB9aa+wD6diyANWk2w2l/+WlWV5xEaA133vezinDTFAjoPhceBF+AQ+cQarCOhoRzqfQ1qvXjWOWnbj1DWumwb1l5KedNFAAF+R7eJdbRHKvlOiw1pe1OF8zQ0t6DheSA2A3r26OnUQuhM4le4ZWfYMbNKcZsMBEjnDdBrd0NCw0qntD5zSGetKUuLl3RR4OonLhX4FArnM/dwksNPRv9ty3m+Aj9okV0fu9g5Ws8u8Sv8FUybxr1UpCHQl2VbbJ8rfIfsInLQbk55AEHo3ruOlL74p6Z/Q7aMNfQ8giAfdrP8Df6s0fbS9aI+JtxmC0I371j16VBoEMokdPpMjCt0wEERzS0tL2EO2JsreEMsFX3aH5lM1I2tS+S/Y9JY5vZWRSv0LvqKPWrbEz6YAAAAASUVORK5CYII=)](https://open-vsx.org/extension/PrateekMahendrakar/resxpress)![Open VSX Rating](https://img.shields.io/open-vsx/rating/prateekmahendrakar/resxpress?style=for-the-badge&color=darkcyan)![Open VSX Downloads](https://img.shields.io/open-vsx/dt/PrateekMahendrakar/ResxPress?style=for-the-badge&&color=darkcyan)

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
