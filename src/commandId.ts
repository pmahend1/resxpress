import { Constants } from "./constants";

/**
 * The command ids this extension registers, spelled out again in package.json
 * under `contributes.commands` - except `resxeditor`, which nothing can reach.
 */
export class CommandId {
    public static readonly resxpreview = `${Constants.resxpress}.resxpreview`;
    public static readonly newpreview = `${Constants.resxpress}.newpreview`;
    public static readonly sortbykeys = `${Constants.resxpress}.sortbykeys`;
    public static readonly setNameSpace = `${Constants.resxpress}.setNameSpace`;
    public static readonly createResxFile = `${Constants.resxpress}.createResxFile`;
    public static readonly resxeditor = `${Constants.resxpress}.resxeditor`;
    public static readonly combinedEditor = `${Constants.resxpress}.combinededitor`;
}
