import * as xmljs from 'xml-js';
export class ResxJsonHelper {
    /**
     *
     */
    static getJsonData(text: string): any[] {
        var jsObj: any = xmljs.xml2js(text, { compact: true });
    
        var dataList: any[] = [];
        console.log(`Datalist before process :${JSON.stringify(jsObj?.root?.data)}`);
        if (jsObj?.root?.data) {
    
            if (jsObj.root.data instanceof Array) {
                dataList = dataList.concat(jsObj.root.data);
                console.log('its array so concat 2 two arrays');
            }
            else {
                //check if empty object
                if (jsObj.root.data?._attributes?.name) {
                    console.log('it is an object  so append to existing array');
                    dataList.push(jsObj.root.data);
                }
            }
        }
    
        console.log(`Datalist after process :${JSON.stringify(dataList)}`);
    
        console.log('getDataJs end ');
        return dataList;
    }
}