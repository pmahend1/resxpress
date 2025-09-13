export class Constants {
    /**
     * ResXpress
     */
    public static readonly extensionName = "ResXpress";
    public static readonly resxpress = "resxpress"
    public static readonly configuration = "configuration";
    public static readonly editor = "editor";

    /**
     * resxpress/namespace-mapping.json
     */
    public static readonly namespaceMappingJsonPath = `${this.resxpress}/namespace-mapping.json`;

    static Commands = class {
        public static readonly resxpreview = `${Constants.resxpress}.resxpreview`;
        public static readonly newpreview = `${Constants.resxpress}.newpreview`;
        public static readonly sortbykeys = `${Constants.resxpress}.sortbykeys`;
        public static readonly setNameSpace = `${Constants.resxpress}.setNameSpace`;
        public static readonly createResxFile = `${Constants.resxpress}.createResxFile`;
        public static readonly resxeditor = `${Constants.resxpress}.resxeditor`;
    }

    static Configuration = class {
        public static readonly generateStronglyTypedResourceClassOnSave = "generateStronglyTypedResourceClassOnSave";
        public static readonly useFileScopedNamespace = "useFileScopedNamespace";
        public static readonly indentSpaceLength = "indentSpaceLength";
    }
}