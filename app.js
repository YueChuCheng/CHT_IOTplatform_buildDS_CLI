//Yue Chu Cheng 2020/2/27
//Email:maggie9907@gmail.com
//Usage:
//  To build device, Senor,expression with command-line, .csv file.
//  Export expression data to .csv file

//Reference:
//  *install node js to your computer 
//  *type "npm i" on your terminal to download node_modules
//  type "node app.js" to run the script
//  import .csv file to set sensor ,device ,expression has stable format , refer addDeviceSensor.csv, addSensor.csv, expression.csv
//  type "pkg -t node10-win-x64 app.js" to convert .js to .exe(windows)

//  Package used:
//      request : https://www.npmjs.com/package/request
//      events : https://www.npmjs.com/package/events
//      csv-parser : https://www.npmjs.com/package/csv-parser
//      iconv-lite : https://www.npmjs.com/package/iconv-lite
//      fs : https://www.npmjs.com/package/fs
//      chalk : https://www.npmjs.com/package/chalk
//      clear : https://www.npmjs.com/package/clear
//      inquirer : https://www.npmjs.com/package/inquirer


var request = require('request');
require('events').EventEmitter.defaultMaxListeners = 0;
const csv = require('csv-parser');
const iconv = require('iconv-lite');
const fs = require('fs');
//command line GUI
const chalk = require('chalk');//colorizes the output
const clear = require('clear'); //clears the terminal screen

var project_string;
var project_JSON;
var KEY;

//////////////////////////////////inquire 
const inquirer = require('inquirer');//creates interactive command-line user interface
const inquire = {
    askProjectKEY: () => {
        const questions = [
            {
                name: 'KEY',
                type: 'input',
                message: 'Your project key:',
                validate: async function (value) {
                    //get API status
                    project_string = await request_project_GET(value);
                    project_JSON = JSON.parse(project_string);

                    if (project_JSON.status) //if API key not exist API key print status
                        return chalk.red(project_JSON.status);
                    else
                        return true;

                }
            }
        ]
        return inquirer.prompt(questions);
    },
    askProjectOption: async () => {
        //get device ID
        project_string = await request_project_GET(KEY);
        project_JSON = JSON.parse(project_string);
        var choices = [];
        choices.push('新建Device', '使用CSV新增Device', '回到輸入金鑰');
        for (let deviceNUM = 0; deviceNUM < project_JSON.length; deviceNUM++) {
            choices.push(project_JSON[deviceNUM].id)
        }

        const questions = [{
            name: 'option',
            type: 'list',
            message: 'Option:',
            choices: choices,
            default: '新建Device',

        }]
        return inquirer.prompt(questions);
    },
    askForDeviceName: () => {
        const questions = [{
            name: 'deviceName',
            type: 'input',
            message: "Type in device's name:",
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return chalk.red("Please type in device's name");
                }
            }
        }]
        return inquirer.prompt(questions);
    },
    askForDeviceDesc: () => {
        const questions = [{
            name: 'desc',
            type: 'input',
            message: "Type in device's description:",
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return chalk.red("Please type in device's description");
                }
            }
        }]
        return inquirer.prompt(questions);
    },
    askForDeviceURI: () => {
        const questions = [{
            name: 'uri',
            type: 'input',
            message: "Type in URI(optional):",

        }]
        return inquirer.prompt(questions);
    },
    askForDeviceLAT: () => {
        const questions = [{
            name: 'lat',
            type: 'input',
            message: "Type in lat(optional):",
            validate: function (value) {
                if (value.match(/^[0-9]{0,20}$|^[0-9]{0,10}[.][0-9]{0,10}$|^-[0-9]{0,10}$|^-[0-9]{0,10}[.][0-9]{0,10}$/gm)) {
                    return true;
                }
                else if (value.length) {
                    return chalk.red("lat need to be numberless than 20 Digit");
                }

            }
        }]
        return inquirer.prompt(questions);
    }
    ,
    askForDeviceLON: () => {
        const questions = [{
            name: 'lon',
            type: 'input',
            message: "Type in lon(optional):",
            validate: function (value) {
                if (value.match(/^[0-9]{0,20}$|^[0-9]{0,20}[.][0-9]{1,20}$|^-[0-9]{0,20}$|^-[0-9]{0,20}[.][0-9]{1,20}$/gm)) {
                    return true;
                }
                else if (value.length) {
                    return chalk.red("lon need to be number less than 20 Digit");
                }

            }
        }]
        return inquirer.prompt(questions);
    },
    askAttributesNUM: () => {
        const questions = [{
            name: 'attributesNUM',
            type: 'input',
            message: "How many attributes:",
            validate: function (value) {
                if (value.length && value.match(/^[0-9]{0,10}$/gm)) {
                    return true;
                }
                else {
                    return chalk.red("Need to be number less than 10 Digit");
                }

            }
        }]
        return inquirer.prompt(questions);
    },
    askAttributesKey: () => {
        const questions = [{
            name: 'attributesKey',
            type: 'input',
            message: "Type in Key:",
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return chalk.red("Please type in key");
                }

            }
        }]
        return inquirer.prompt(questions);
    },
    askAttributesValue: () => {
        const questions = [{
            name: 'attributesValue',
            type: 'input',
            message: "Type in value:",
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return chalk.red("Please type in value");
                }

            }
        }]
        return inquirer.prompt(questions);
    },
    askIfNewINFOCorrect: () => {
        const questions = [{
            name: 'answer',
            type: 'input',
            message: "Correct?(y/n)",
            validate: function (value) {
                if (value.length && value.match(/^[y]$|^[n]$/g)) {
                    return true;
                }
                else {
                    return chalk.red("Please type 'y' or 'n')");
                }

            }
        }]
        return inquirer.prompt(questions);
    },
    askIfWhatToAddSensor: () => {
        const questions = [{
            name: 'answer',
            type: 'input',
            message: "Do you want to add sensor to this device?(y/n)",
            validate: function (value) {
                if (value.length && value.match(/^[y]$|^[n]$/g)) {
                    return true;
                }
                else {
                    return chalk.red("Please type 'y' or 'n')");
                }

            }
        }]
        return inquirer.prompt(questions);
    },
    askSensorNUMToAdd: () => {
        const questions = [{
            name: 'addSensorNUM',
            type: 'input',
            message: "How many sensor do you want to add:",
            validate: function (value) {
                if (value.length && value.match(/^[0-9]{0,10}$/gm)) {
                    return true;
                }
                else {
                    return chalk.red("Need to be number less than 10 Digit");
                }

            }
        }]
        return inquirer.prompt(questions);
    },
    askForSensorID: () => {
        const questions = [{
            name: 'sensorID',
            type: 'input',
            message: "Type in sensor's ID:",
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return chalk.red("Please type in sensor's ID");
                }
            }
        }]
        return inquirer.prompt(questions);
    },
    askForSensorName: () => {
        const questions = [{
            name: 'sensorName',
            type: 'input',
            message: "Type in sensor's name:",
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return chalk.red("Please type in sensor's name");
                }
            }
        }]
        return inquirer.prompt(questions);
    }
    ,
    askForSensorDesc: () => {
        const questions = [{
            name: 'sensorDesc',
            type: 'input',
            message: "Type in sensor's description:",
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return chalk.red("Please type in sensor's description");
                }
            }
        }]
        return inquirer.prompt(questions);
    },
    askSensorType: () => {

        const questions = [{
            name: 'sensorType',
            type: 'list',
            message: 'Choose sensor type:',
            choices: ['gauge', 'snapshot', 'text', 'switch'],
            default: 'gauge',

        }]
        return inquirer.prompt(questions);
    },
    askSensorURI: () => {
        const questions = [{
            name: 'uri',
            type: 'input',
            message: "Type in URI(optional):",

        }]
        return inquirer.prompt(questions);
    },
    askSensorUnit: () => {
        const questions = [{
            name: 'unit',
            type: 'input',
            message: "Type in unit(optional):",

        }]
        return inquirer.prompt(questions);
    },
    askSensorFormula: () => {
        const questions = [{
            name: 'formula',
            type: 'input',
            message: "Type in formula(optional):",

        }]
        return inquirer.prompt(questions);
    },
    askIfWhatToAddMoreSensor: () => {
        const questions = [{
            name: 'answer',
            type: 'input',
            message: "Do you want to add other sensor to this device?(y/n)",
            validate: function (value) {
                if (value.length && value.match(/^[y]$|^[n]$/g)) {
                    return true;
                }
                else {
                    return chalk.red("Please type 'y' or 'n')");
                }

            }
        }]
        return inquirer.prompt(questions);
    },
    askDeviceOption: async (deviceID) => {
        //get sensor ID
        var device_string = await request_device_GET(KEY, deviceID);
        device_JSON = JSON.parse(device_string);

        var choices = [];
        choices.push('新建Sensor', '使用CSV新增Sensor', '匯出事件驅動資訊', '匯入事件驅動資訊', '回到Project option');
        for (let sensorNUM = 0; sensorNUM < device_JSON.length; sensorNUM++) {
            choices.push(device_JSON[sensorNUM].id)
        }

        const questions = [{
            name: 'option',
            type: 'list',
            message: 'Option:',
            choices: choices,
            default: '新建Sensor',

        }]
        return inquirer.prompt(questions);
    },
    askCSVPath: async () => {
        const questions = [{
            name: 'path',
            type: 'input',
            message: "Type in csv path",
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return chalk.red("Please type in csv path");
                }

            }
        }]
        return inquirer.prompt(questions);
    }


}


//////////////////////////////////request 
let request_project_GET = function (key) {

    return new Promise((resolve, reject) => {
        var projectOption_GET = {
            method: 'GET',
            url: 'https://iot.cht.com.tw/iot/v1/device',
            headers:
            {
                'content-type': 'text/plain',
                'CK': key,

            },

        };
        request(projectOption_GET, (error, response, body) => {
            if (error)
                console.log(error);
            resolve(body);

        });

    });
};

let request_device_GET = function (key, deviceID) {

    return new Promise((resolve, reject) => {
        var deviceOption_GET = {
            method: 'GET',
            url: 'https://iot.cht.com.tw/iot/v1/device/' + deviceID + '/sensor',
            headers:
            {
                'content-type': 'text/plain',
                'CK': key,

            },

        };
        request(deviceOption_GET, (error, response, body) => {
            if (error)
                console.log(error);
            resolve(body);

        });

    });
};

let request_expression_GET = function (key) {

    return new Promise((resolve, reject) => {

        var expression_GET = {
            method: 'GET',
            url: 'https://iot.cht.com.tw/iot/v1/expression',
            headers:
            {
                'content-type': 'application/json',
                'CK': key,

            }

        };

        request(expression_GET, (error, response, body) => {
            if (error)
                console.log(error);
            resolve(body);

        });

    });
};

let request_expression_POST = function (key, deviceID, name, desc, expression, sensor, type, mode, action) {

    return new Promise((resolve, reject) => {

        var expression_POST = {
            method: 'POST',
            url: 'https://iot.cht.com.tw/iot/v1/expression',
            headers:
            {
                'content-type': 'application/json',
                'CK': key,

            },
            json: [{
                "name": name,
                "desc": desc,
                "expression": expression,
                "devices": [deviceID],
                "sensor": sensor,
                "enable": true,
                "type": type,
                "mode": mode,
                "actions": action

            }]

        };
        request(expression_POST, (error, response, body) => {
            if (error)
                console.log(error);
            resolve(body);

        });

    });
};


let request_NewDevice_POST = function (key, name, desc, uri, lat, lon, attributes) {

    return new Promise((resolve, reject) => {

        var projectOption_POST = {
            method: 'POST',
            url: 'https://iot.cht.com.tw/iot/v1/device',
            headers:
            {
                'content-type': 'application/json',
                'CK': key,

            },
            json: {
                "name": name,
                "desc": desc,
                "type": "general",
                "uri": uri,
                "lat": lat,
                "lon": lon,
                "attributes": attributes

            }

        };
        request(projectOption_POST, (error, response, body) => {
            if (error)
                console.log(error);
            resolve(body);

        });

    });
};


let request_NewSensor_POST = function (key, deviceID, id, name, desc, type, uri, unit, formula, attributes) {

    return new Promise((resolve, reject) => {

        var addSensor_POST = {
            method: 'POST',
            url: 'https://iot.cht.com.tw/iot/v1/device/' + deviceID + '/sensor',
            headers:
            {
                'content-type': 'application/json',
                'CK': key,

            },
            json: {
                "id": id,
                "name": name,
                "desc": desc,
                "type": type,
                "uri": uri,
                "unit": unit,
                "formula": formula,
                "attributes": attributes

            }

        };

        request(addSensor_POST, (error, response, body) => {
            if (error)
                console.log(error);
            resolve(body);

        });

    });
};

let csvToJSONArray = function (deviceCSVPath, decode) {

    return new Promise((resolve, reject) => {

        var resualt = [];
        fs.createReadStream(deviceCSVPath, { encoding: 'binary' })
            .pipe(csv({
                headers: false,
                separator: ','
            }))
            .on('data', (row) => {
                var everyRow = [];
                for (let element = 0; row[element] || row[element] == ''; element++) {
                    const buf = Buffer.from(row[element], 'binary');
                    var str = iconv.decode(buf, decode);
                    everyRow.push(str);
                }
                resualt.push(everyRow);

            })
            .on('end', () => {
                resolve(resualt);
                console.log('CSV file successfully processed');
            });

    });
};

//enum
const GETPROJECTKEY = 1;
const PROJECTOPTIONS = 2;
const ADDDEVICE = 3;
const ADDSENSOR = 4;
const DEVICEOPTIONS = 5;
const ADDDEVICCSV = 6;
const ADDSENSORCSV = 7;
const GENERATEEXPRESSCSV = 8;
const ADDEXPRESSCSV = 9;
/////////////////////////////////question function
const question = async () => {

    var currentDeviceID;
    var operateStatus = GETPROJECTKEY; //init record operate status
    while (1) {
        switch (operateStatus) {
            case GETPROJECTKEY://enter KEY page, check if data exist
                clear();
                KEY = await inquire.askProjectKEY();
                KEY = KEY.KEY;
                operateStatus = PROJECTOPTIONS; //get avaliable API
                break;

            case PROJECTOPTIONS: //Project page, choose an option 
                clear();
                const ProjectOption = await inquire.askProjectOption();

                if (ProjectOption.option == '回到輸入金鑰')
                    operateStatus = GETPROJECTKEY;

                else if (ProjectOption.option == '使用CSV新增Device')
                    operateStatus = ADDDEVICCSV;

                else if (ProjectOption.option == '新建Device')
                    operateStatus = ADDDEVICE;

                else {
                    currentDeviceID = ProjectOption.option;
                    currentDeviceID = Number(currentDeviceID);
                    console.log(currentDeviceID);
                    operateStatus = DEVICEOPTIONS;

                }

                break

            case ADDDEVICE:
                clear();
                var newDeviceName, newDeviceDesc, newDeviceURI, newDeviceLat, newDeviceLon, newDeviceAttributesNUM, deviceKeyValue;
                do {
                    //get device name
                    newDeviceName = await inquire.askForDeviceName();
                    newDeviceName = newDeviceName.deviceName;

                    //get device description
                    newDeviceDesc = await inquire.askForDeviceDesc();
                    newDeviceDesc = newDeviceDesc.desc;

                    //get device URI
                    newDeviceURI = await inquire.askForDeviceURI();
                    newDeviceURI = newDeviceURI.uri;

                    //get device lat
                    newDeviceLat = await inquire.askForDeviceLAT();
                    newDeviceLat.lat == "" ? newDeviceLat = "" : newDeviceLat = Number(newDeviceLat.lat);

                    //get device lon
                    newDeviceLon = await inquire.askForDeviceLON();
                    newDeviceLon.lon == "" ? newDeviceLon = "" : newDeviceLon = Number(newDeviceLon.lon);

                    //get device attributes
                    newDeviceAttributesNUM = await inquire.askAttributesNUM();
                    newDeviceAttributesNUM = Number(newDeviceAttributesNUM.attributesNUM)
                    deviceKeyValue = [];
                    for (let AttributeNUM = 0; AttributeNUM < newDeviceAttributesNUM; AttributeNUM++) {
                        console.log("Attribute: " + (AttributeNUM + 1));
                        deviceKeyValue.push(await inquire.askAttributesKey());
                        deviceKeyValue.push(await inquire.askAttributesValue());
                    }
                    clear();
                    console.log(chalk.yellow("Your new device's information :"));
                    console.log('"name": ' + chalk.blueBright(newDeviceName));
                    console.log('"desc": ' + chalk.blueBright(newDeviceDesc));
                    console.log('"type": "general"(unchangeable)');
                    console.log('"uri": ' + chalk.blueBright(newDeviceURI));
                    console.log('"lat": ' + chalk.blueBright(newDeviceLat));
                    console.log('"lon": ' + chalk.blueBright(newDeviceLon));
                    console.log('"attributes":');
                    for (let AttributeNUM = 0; AttributeNUM < deviceKeyValue.length; AttributeNUM += 2) {
                        console.log('   {');
                        console.log('    "key": ' + chalk.blueBright(deviceKeyValue[AttributeNUM].attributesKey));
                        console.log('    "value": ' + chalk.blueBright(deviceKeyValue[AttributeNUM + 1].attributesValue));
                        console.log('   }');
                    }
                    var answer = await inquire.askIfNewINFOCorrect();
                } while (answer.answer == 'n');

                var attributeJSON = [];
                for (let AttributeNUM = 0; AttributeNUM < deviceKeyValue.length; AttributeNUM += 2) {

                    attributeJSON.push({ "key": deviceKeyValue[AttributeNUM].attributesKey, "value": deviceKeyValue[AttributeNUM].attributesKey });

                }

                var newDeviceID = await request_NewDevice_POST(KEY, newDeviceName, newDeviceDesc, newDeviceURI, newDeviceLat, newDeviceLon, attributeJSON);
                newDeviceID = newDeviceID.id;

                if (newDeviceID) {//cheack if device add success
                    console.log(chalk.yellow("Success add Device XD"));

                    var bAddSensor = await inquire.askIfWhatToAddSensor();
                    if (bAddSensor.answer == 'y') {
                        currentDeviceID = newDeviceID;
                        operateStatus = ADDSENSOR;
                    }
                    else
                        operateStatus = PROJECTOPTIONS;
                }
                else {
                    console.log(chalk.red("Fail add Device QAQ, please add device again"));
                    operateStatus = PROJECTOPTIONS;
                }

                break;
            case ADDSENSOR:
                clear();

                var newSensorID, newSensorName, newSensorDesc, newSensorType, newSensorURI, newSensorUnit, newSensorFormula, newSensorAttributesNUM, sensorKeyValue;
                do {
                    //get sensor ID
                    newSensorID = await inquire.askForSensorID();
                    newSensorID = newSensorID.sensorID;

                    //get sensor name
                    newSensorName = await inquire.askForSensorName();
                    newSensorName = newSensorName.sensorName;

                    //get sensor description
                    newSensorDesc = await inquire.askForSensorDesc();
                    newSensorDesc = newSensorDesc.sensorDesc;

                    //get sensor type
                    newSensorType = await inquire.askSensorType();
                    newSensorType = newSensorType.sensorType;

                    //get sensor URI
                    newSensorURI = await inquire.askSensorURI();
                    newSensorURI = newSensorURI.uri;

                    //get sensor unit
                    newSensorUnit = await inquire.askSensorUnit();
                    newSensorUnit = newSensorUnit.unit;

                    //get sensor formula
                    newSensorFormula = await inquire.askSensorFormula();
                    newSensorFormula = newSensorFormula.formula;

                    //get sensor attributes
                    newSensorAttributesNUM = await inquire.askAttributesNUM();
                    newSensorAttributesNUM = Number(newSensorAttributesNUM.attributesNUM)
                    sensorKeyValue = [];
                    for (let AttributeNUM = 0; AttributeNUM < newSensorAttributesNUM; AttributeNUM++) {
                        console.log("Attribute: " + (AttributeNUM + 1));
                        sensorKeyValue.push(await inquire.askAttributesKey());
                        sensorKeyValue.push(await inquire.askAttributesValue());
                    }
                    clear();
                    console.log(chalk.yellow("Your new sensor's information :"));
                    console.log('"id": ' + chalk.blueBright(newSensorID));
                    console.log('"name": ' + chalk.blueBright(newSensorName));
                    console.log('"desc": ' + chalk.blueBright(newSensorDesc));
                    console.log('"type": ' + chalk.blueBright(newSensorType));
                    console.log('"uri": ' + chalk.blueBright(newSensorURI));
                    console.log('"unit": ' + chalk.blueBright(newSensorUnit));
                    console.log('"formula": ' + chalk.blueBright(newSensorFormula));
                    console.log('"attributes":');
                    for (let AttributeNUM = 0; AttributeNUM < sensorKeyValue.length; AttributeNUM += 2) {
                        console.log('   {');
                        console.log('    "key": ' + chalk.blueBright(sensorKeyValue[AttributeNUM].attributesKey));
                        console.log('    "value": ' + chalk.blueBright(sensorKeyValue[AttributeNUM + 1].attributesValue));
                        console.log('   }');
                    }
                    var answer = await inquire.askIfNewINFOCorrect();
                } while (answer.answer == 'n');

                var attributeJSON = [];
                for (let AttributeNUM = 0; AttributeNUM < sensorKeyValue.length; AttributeNUM += 2) {

                    attributeJSON.push({ "key": sensorKeyValue[AttributeNUM].attributesKey, "value": sensorKeyValue[AttributeNUM].attributesKey });

                }

                var error = await request_NewSensor_POST(KEY, currentDeviceID, newSensorID, newSensorName, newSensorDesc, newSensorType, newSensorURI, newSensorUnit, newSensorFormula, attributeJSON);
                if (error) {
                    console.log(chalk.red("Fail add Sensor QAQ, please add device again"));
                }
                else {
                    console.log(chalk.yellow("Success add Device XD"));
                    var answer = await inquire.askIfWhatToAddMoreSensor();
                    if (answer.answer == 'n') //if don't want to add more sensor, go back to projectoption
                        operateStatus = DEVICEOPTIONS;

                }


                break;
            case DEVICEOPTIONS:
                //clear();
                const deviceOption = await inquire.askDeviceOption(currentDeviceID);

                if (deviceOption.option == "回到Project option")
                    operateStatus = PROJECTOPTIONS;

                else if (deviceOption.option == "新建Sensor")
                    operateStatus = ADDSENSOR;

                else if (deviceOption.option == "使用CSV新增Sensor")
                    operateStatus = ADDSENSORCSV;

                else if (deviceOption.option == "匯出事件驅動資訊")
                    operateStatus = GENERATEEXPRESSCSV;
                else if (deviceOption.option == "匯入事件驅動資訊")
                    operateStatus = ADDEXPRESSCSV;

                break;

            case ADDDEVICCSV:
                clear();
                var deviceCSVPath = '';
                deviceCSVPath = await inquire.askCSVPath();
                deviceCSVPath = deviceCSVPath.path;
                deviceCSVPath.replace('\\', '\\\\') //change format so that createReadStream can read
                var csvJsonArray = await csvToJSONArray(deviceCSVPath, 'Big5');

                var titleNUM = 0;
                for (let i = 0; csvJsonArray[0][i]; i++) {
                    titleNUM++;
                }

                for (let i = 1; i < csvJsonArray.length; i++) { //Device loop, skip first row(title row)
                    var changeRow = false; //change attribute's row index
                    var curKeyValue = [], id = [], name = [], desc = [], uri = [], lat = [], lon = [], type = [], unit = [], formula = [], keyValueA = []; //目前KeyValue的存放內容

                    for (let x = 0; x < titleNUM; x++) { //device and sensor element loop 

                        switch (csvJsonArray[0][x]) {

                            case 'id':
                                if (csvJsonArray[i][x])
                                    id.push(csvJsonArray[i][x]);
                                break;
                            case 'name':
                                if (x > 0) //change every attribute's row index
                                    changeRow = true;
                                if (csvJsonArray[i][x])
                                    name.push(csvJsonArray[i][x]);

                                break;
                            case 'desc':
                                if (csvJsonArray[i][x])
                                    desc.push(csvJsonArray[i][x]);
                                break;
                            case 'uri':
                                if (csvJsonArray[i][x])
                                    uri.push(csvJsonArray[i][x]);
                                else
                                    uri.push('');
                                break;
                            case 'lat':
                                if (csvJsonArray[i][x])
                                    lat.push(csvJsonArray[i][x]);
                                else
                                    lat.push('');
                                break;
                            case 'lon':
                                if (csvJsonArray[i][x])
                                    lon.push(csvJsonArray[i][x]);
                                else
                                    lon.push('');
                                break;
                            case 'unit':
                                if (csvJsonArray[i][x])
                                    unit.push(csvJsonArray[i][x]);
                                else
                                    unit.push('');
                                break;
                            case 'formula':
                                if (csvJsonArray[i][x])
                                    formula.push(csvJsonArray[i][x]);
                                else
                                    formula.push('');
                                break;
                            case 'type':
                                if (csvJsonArray[i][x])
                                    type.push(csvJsonArray[i][x]);
                                break;
                            case 'key':
                            case 'value':
                                if (changeRow) {
                                    keyValueA.push(curKeyValue);
                                    curKeyValue = [];
                                    changeRow = false;
                                }
                                if (csvJsonArray[i][x])
                                    curKeyValue.push(csvJsonArray[i][x]);

                                break;
                            default:
                                break;
                        }

                        if (csvJsonArray[i][x + 1] == undefined) //push all curKeyValue before end of loop
                            keyValueA.push(curKeyValue);
                    }

                    var DSAttributeJSON = [];
                    for (let DSNUM = 0; DSNUM < keyValueA.length; DSNUM++) { //Device &&　sensor NUM
                        var attributeJSON = [];
                        for (let AttributeNUM = 0; AttributeNUM < keyValueA[DSNUM].length; AttributeNUM += 2) {
                            attributeJSON.push({ "key": keyValueA[DSNUM][AttributeNUM], "value": keyValueA[DSNUM][AttributeNUM + 1] });
                        }
                        DSAttributeJSON.push(attributeJSON);
                    }

                    var newDeviceID = await request_NewDevice_POST(KEY, name[0], desc[0], uri[0], lat[0], lon[0], DSAttributeJSON[0]);
                    newDeviceID = newDeviceID.id;

                    for (let sensorNUM = 1; sensorNUM < name.length; sensorNUM++) {
                        var error = await request_NewSensor_POST(KEY, newDeviceID, id[sensorNUM - 1], name[sensorNUM], desc[sensorNUM], type[sensorNUM - 1], uri[sensorNUM], unit[sensorNUM - 1], formula[sensorNUM - 1], DSAttributeJSON[sensorNUM]);
                        if (error)
                            console.log(chalk.red("Fail add Sensor QAQ, please add sensor again"));
                        else {
                            operateStatus = PROJECTOPTIONS;
                            console.log(chalk.yellow("Success add sensor XD"));
                        }
                    }

                }

                break;
            case ADDSENSORCSV:
                var deviceCSVPath = '';
                deviceCSVPath = await inquire.askCSVPath();
                deviceCSVPath = deviceCSVPath.path;
                deviceCSVPath.replace('\\', '\\\\') //change format so that createReadStream can read
                var csvJsonArray = await csvToJSONArray(deviceCSVPath, 'Big5');

                var titleNUM = 0;
                for (let i = 0; csvJsonArray[0][i]; i++) {
                    titleNUM++;
                }


                for (let i = 1; i < csvJsonArray.length; i++) { //Sensor loop, skip first row(title row)

                    var curKeyValue = [], id = [], name = [], desc = [], uri = [], type = [], unit = [], formula = [], keyValueA = []; //目前KeyValue的存放內容

                    for (let x = 0; x < titleNUM; x++) { //sensor element's loop 

                        switch (csvJsonArray[0][x]) {

                            case 'id':
                                if (csvJsonArray[i][x])
                                    id.push(csvJsonArray[i][x]);
                                break;
                            case 'name':
                                if (csvJsonArray[i][x])
                                    name.push(csvJsonArray[i][x]);

                                break;
                            case 'desc':
                                if (csvJsonArray[i][x])
                                    desc.push(csvJsonArray[i][x]);
                                break;
                            case 'uri':
                                if (csvJsonArray[i][x])
                                    uri.push(csvJsonArray[i][x]);
                                else
                                    uri.push('');
                                break;
                            case 'unit':
                                if (csvJsonArray[i][x])
                                    unit.push(csvJsonArray[i][x]);
                                else
                                    unit.push('');
                                break;
                            case 'formula':
                                if (csvJsonArray[i][x])
                                    formula.push(csvJsonArray[i][x]);
                                else
                                    formula.push('');
                                break;
                            case 'type':
                                if (csvJsonArray[i][x])
                                    type.push(csvJsonArray[i][x]);
                                break;
                            case 'key':
                            case 'value':
                                if (csvJsonArray[i][x]) {
                                    curKeyValue.push(csvJsonArray[i][x]);
                                }

                                break;
                            default:
                                break;
                        }

                        if (csvJsonArray[i][x + 1] == undefined) //push all curKeyValue before end of loop
                            keyValueA.push(curKeyValue);
                    }

                    var DSAttributeJSON = [];
                    for (let DSNUM = 0; DSNUM < keyValueA.length; DSNUM++) { //Device &&　sensor NUM
                        var attributeJSON = [];
                        for (let AttributeNUM = 0; AttributeNUM < keyValueA[DSNUM].length; AttributeNUM += 2) {
                            attributeJSON.push({ "key": keyValueA[DSNUM][AttributeNUM], "value": keyValueA[DSNUM][AttributeNUM + 1] });
                        }
                        DSAttributeJSON.push(attributeJSON);
                    }

                    for (let sensorNUM = 0; sensorNUM < name.length; sensorNUM++) {

                        var error = await request_NewSensor_POST(KEY, currentDeviceID, id[sensorNUM], name[sensorNUM], desc[sensorNUM], type[sensorNUM], uri[sensorNUM], unit[sensorNUM], formula[sensorNUM], DSAttributeJSON[sensorNUM]);
                        if (error)
                            console.log(chalk.red("Fail add Sensor QAQ, please add sensor again"));
                        else {
                            console.log(chalk.yellow("Success add sensor XD"));
                            operateStatus = DEVICEOPTIONS
                        }

                    }

                }


                break;

            case GENERATEEXPRESSCSV:
                var eventJSON = await request_expression_GET(KEY);
                eventJSON = JSON.parse(eventJSON);
                var csv = [];
                for (let eventNUM = 0; eventNUM < eventJSON.length; eventNUM++) {
                    if (eventJSON[eventNUM].devices == currentDeviceID) {
                        var title = []; //expression's param title
                        var data = []; //expression's param data
                        for (element_JSON in eventJSON[eventNUM]) {
                            if (element_JSON == 'actions') {
                                title.push(element_JSON);
                                data.push("");
                            }
                            else {
                                title.push(element_JSON);
                                data.push(eventJSON[eventNUM][element_JSON]);
                            }
                        }

                        for (let actionsNUM = 0; actionsNUM < eventJSON[eventNUM].actions.length; actionsNUM++) {

                            for (element_actions in eventJSON[eventNUM].actions[actionsNUM]) { //actions' element loop

                                //classify element
                                switch (element_actions) {
                                    case 'actionType':
                                    case 'name':
                                        title.push(element_actions);
                                        data.push(eventJSON[eventNUM].actions[actionsNUM][element_actions])
                                        break;

                                    case 'emailEvent':
                                    case 'urlEvent':
                                    case 'deviceEvent':
                                    case 'lineNotifyEvent':
                                        title.push(element_actions);
                                        data.push("");
                                        for (element_event in eventJSON[eventNUM].actions[actionsNUM][element_actions]) {
                                            title.push(element_event);
                                            data.push(eventJSON[eventNUM].actions[actionsNUM][element_actions][element_event])
                                        }

                                        break;

                                    default:
                                        break;
                                }

                            }
                        }

                        //Update CSV array *add\r\n
                        for (let i = 0; i < title.length; i++) {
                            if (i == 0 && csv.length != 0) {
                                csv.push('\r\n' + title[i]);
                            }
                            else
                                csv.push(title[i]);
                        }

                        for (let i = 0; i < data.length; i++) {
                            if (i == 0)
                                csv.push('\r\n' + data[i]);
                            else
                                csv.push(data[i]);
                        }


                    }
                }

                fs.writeFile("expression.csv", csv, { encoding: 'utf8' }, function (err) {
                    if (err)
                        console.log(err);
                    else
                        console.log(chalk.yellow('Write operation complete.'));
                });
                operateStatus = DEVICEOPTIONS;
                break;

            case ADDEXPRESSCSV:
                var csvJSON = await csvToJSONArray('expression.csv', 'utf8');
                for (let expressionNUM = 0; expressionNUM < csvJSON.length; expressionNUM += 2) {
                    var name, desc, expression, devices, sensor, type, mode;
                    var inActions = false; //if is classifying actions' element
                    var actionJSON = '';
                    var actionJSONArray = [];
                    //classifying element
                    for (let expreElement = 0; csvJSON[expressionNUM][expreElement] || csvJSON[expressionNUM][expreElement] == ''; expreElement++) {
                        switch (csvJSON[expressionNUM][expreElement]) {
                            case "name":
                                if (inActions == false)
                                    name = csvJSON[expressionNUM + 1][expreElement];
                                else
                                    actionJSON += ',"name":"' + csvJSON[expressionNUM + 1][expreElement] + '"';
                                break;
                            case "desc":
                                desc = csvJSON[expressionNUM + 1][expreElement];
                                break;
                            case "expression":
                                expression = csvJSON[expressionNUM + 1][expreElement];
                                break;
                            case "devices":
                                devices = csvJSON[expressionNUM + 1][expreElement];
                                break;
                            case "sensor":
                                sensor = csvJSON[expressionNUM + 1][expreElement];
                                break;
                            case "type":
                                if (inActions == false)
                                    type = csvJSON[expressionNUM + 1][expreElement];
                                else
                                    actionJSON += '"type":"' + csvJSON[expressionNUM + 1][expreElement] + '",';
                                break;
                            case "mode":
                                mode = csvJSON[expressionNUM + 1][expreElement];
                                break;
                            case "actionType":

                                inActions = true;
                                if (actionJSON != '') {
                                    actionJSONArray.push(actionJSON + '}');
                                    actionJSON = '';
                                }
                                actionJSON += '{"actionType":"' + csvJSON[expressionNUM + 1][expreElement] + '"';
                                break;
                            case "emailEvent":
                                actionJSON += ',"emailEvent":{';
                                break;
                            case "subject":
                                actionJSON += '"subject":"' + csvJSON[expressionNUM + 1][expreElement] + '",';
                                break;
                            case "email":
                                actionJSON += '"email":"' + csvJSON[expressionNUM + 1][expreElement] + '",';
                                break;
                            case "content":
                                actionJSON += '"content":"' + csvJSON[expressionNUM + 1][expreElement] + '"}';
                                break;
                            case "urlEvent":
                                actionJSON += ',"urlEvent":{';
                                break;
                            case "url":
                                actionJSON += '"url":"' + csvJSON[expressionNUM + 1][expreElement] + '",';
                                break;
                            case "method":
                                actionJSON += '"method":"' + csvJSON[expressionNUM + 1][expreElement] + '"}';
                                break;

                            case "deviceEvent":
                                actionJSON += ',"deviceEvent":{';
                                break;
                            case "deviceId":
                                actionJSON += '"deviceId":"' + csvJSON[expressionNUM + 1][expreElement] + '",';
                                break;
                            case "sensorId":
                                actionJSON += '"sensorId":"' + csvJSON[expressionNUM + 1][expreElement] + '",';
                                break;
                            case "value":
                                actionJSON += '"value":"' + csvJSON[expressionNUM + 1][expreElement] + '"}';
                                break;

                            case "lineNotifyEvent":
                                actionJSON += ',"lineNotifyEvent":{';
                                break;
                            case "ids":
                                actionJSON += '"ids":"' + csvJSON[expressionNUM + 1][expreElement] + '",';
                                break;
                            case "tokens":
                                actionJSON += '"tokens":"' + csvJSON[expressionNUM + 1][expreElement] + '",';
                                break;
                            case "message":
                                actionJSON += '"message":"' + csvJSON[expressionNUM + 1][expreElement] + '"}';
                                break;
                            default:
                                break;
                        }


                        if (csvJSON[expressionNUM][expreElement + 1] == undefined && actionJSON) { //push all actionJSON before end of the loop
                            //console.log(actionJSON);
                            actionJSONArray.push(actionJSON + '}');
                        }

                    }


                    for (let i = 0; i < actionJSONArray.length; i++) {
                        actionJSONArray[i] = JSON.parse(actionJSONArray[i]);

                    }

                    //console.log(actionJSONArray);
                    var expressionID = await request_expression_POST(KEY, currentDeviceID, name, desc, expression, sensor, type, mode, actionJSONArray);
                    if (expressionID.expressionIds) {
                        console.log(chalk.yellow("Add expression Success!!!"))
                    }
                    else {
                        console.log(chalk.red("Add expression Failed!!!"))
                    }
                }
                operateStatus = DEVICEOPTIONS;
                break;
            default:
                break;
        }


    }
}

/////////////////////////////////main
clear();
console.log(chalk.yellow('Bulid CHT Package'));
question();

/////////////////////////////////
