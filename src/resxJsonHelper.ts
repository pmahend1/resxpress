import * as xmljs from "xml-js";
import { Logger } from "./logger";
export class ResxJsonHelper {
    static getJsonData(text: string): any[] {
        var jsObj: any = xmljs.xml2js(text, { compact: true });

        var dataList: any[] = [];
        Logger.instance.info(`Datalist before process :${JSON.stringify(jsObj?.root?.data)}`);
        if (jsObj?.root?.data) {
            if (jsObj.root.data instanceof Array) {
                dataList = dataList.concat(jsObj.root.data);
            }
            else {
                //check if empty object
                if (jsObj.root.data?._attributes?.name) {
                    Logger.instance.info("it is an object  so append to existing array");
                    dataList.push(jsObj.root.data);
                }
            }
        }
        Logger.instance.info(`Datalist after process :${JSON.stringify(dataList)}`);

        Logger.instance.info("getDataJs end ");
        return dataList;
    }
}