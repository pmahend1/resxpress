export const DATA = "data";
export const emptyString = "";

export class Constants {
    /**
     * ResXpress
     */
    public static readonly extensionName = "ResXpress";
    public static readonly resxpress = "resxpress";
    public static readonly configuration = "configuration";
    public static readonly editor = "editor";

    /**
     * resxpress/namespace-mapping.json
     */
    public static readonly namespaceMappingJsonPath = `${this.resxpress}/namespace-mapping.json`;

    /**
     * Set when the resx in front of the user has culture siblings, so the menus
     * can hide "Edit All Languages" for a resource that has only one file.
     */
    public static readonly hasCultureSiblingsContext = `${this.resxpress}.hasCultureSiblings`;
}