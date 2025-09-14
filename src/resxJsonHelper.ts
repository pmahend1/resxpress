import * as xmljs from "xml-js";
import { Logger } from "./logger";
import { nameof } from "./nameof";

export class ResxJsonHelper {
    static getJsonData(text: string): any[] {
        var jsObj: any = xmljs.xml2js(text, { compact: true });
        var dataList: any[] = [];
        if (jsObj?.root?.data) {
            if (jsObj.root.data instanceof Array) {
                dataList = dataList.concat(jsObj.root.data);
            }
            else {
                //check if empty object
                if (jsObj.root.data?._attributes?.name) {
                    dataList.push(jsObj.root.data);
                }
            }
        }
        Logger.instance.info(`${nameof(ResxJsonHelper)}.${nameof(this.getJsonData)}: ${JSON.stringify(dataList)}`);
        return dataList;
    }
}