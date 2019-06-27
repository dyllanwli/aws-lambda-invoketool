'use strict';

const AWS = require('aws-sdk');
const pify = require("pify");
const parse = require('parse-aws-lambda-name');

const fs = require('fs');
const path = require('path');
let Random = require("mockjs").Random

AWS.config.loadFromPath('./appstudioApiKey.json');
let lambda = new AWS.Lambda();


let invoke_count = 0;
let instances = {};

// ========= invoke config ==========
let INVOKE_CONFIG = {
    "restoreImg": true,
    "portal": true,
    "randomObject": true,
    "randomRange": {
        min: 1000,
        max: 800000
    },
    "tempDir": './temp',
    "retryMax": 0,
    "retryCounts": 0,
    "total_invokes": 1,
    "each_invokes": 2,
    "configFilePath": './config.json'
}

let config = require(INVOKE_CONFIG.configFilePath);

module.exports.clearTemp = async (tempDir) => {
    await fs.readdir(tempDir, (err, files) => {
        if (err) throw err;
        for (const file of files) {
            console.log(path.join(tempDir, file))
            fs.unlinkSync(path.join(tempDir, file))
        }
    });
}


module.exports.invokeParams = (name, payload) => {
    if (!name) {
        return Promise.reject(new TypeError('input name error'));
    }

    const parsed = parse(name);

    if (!parsed) {
        return Promise.reject(new Error('function name invalid'));
    }

    const params = {
        FunctionName: parsed.functionName,
        Payload: JSON.stringify(payload),
        InvocationType: "RequestResponse ",
        LogType: "Tail"
    }

    if (parsed.Qualifier) {
        params.Qualifier = parsed.Qualifier;
    }
    // console.log(params);
    return params
}

module.exports.INVOKE_ASYNC = (params) => {
    return pify(lambda.invoke.bind(lambda), Promise)(params);
}

function printImg(naming, payloadData) {
    let buffer = new Buffer(new Uint8Array(payloadData));
    fs.writeFileSync(INVOKE_CONFIG.tempDir + '/' + naming + "_output.png", buffer, 'binary');
}

function getRandomString() {
    return Math.random()
        .toString(36)
        .substring(7);
}

module.exports.wait = (ms) => new Promise(r => setTimeout(r, ms));

module.exports.LAMBDA_INVOKE = (params) => {
    lambda.invoke(params, (err, data) => {
        if (err) {
            /*
             * if get too many request error invoke one more time
             */
            // if (err.statusCode === 429) {
            //     let paramsAsync = {
            //         FunctionName: params.FunctionName,
            //         InvokeArgs: params.Payload
            //     }
            //     lambda.invokeAsync(paramsAsync, (errAsync, data) => {
            //         if (errAsync) console.log("errAsync:", errAsync, err.stack); // an error occurred
            //         else console.log("Async retry:", data); // successful response
            //     });
            // }
            console.log(err);
            console.log("==============================retry");
            this.LAMBDA_INVOKE(params);
        } else {
            let logs = Buffer.from(data.LogResult, 'base64').toString('utf8');
            // console.log(logs);
            // let instanceID = logs.match(new RegExp("(?:\\$InstanceID: )(.*?)(?: \\$END)", "ig"));
            let instanceID = logs.match(new RegExp("\\$InstanceID: (.*?) \\$END", "ig"));
            if (instanceID) {
                instanceID = instanceID[0].split(" ")[1];
                if (instances.hasOwnProperty(instanceID)) {
                    instances[instanceID] += 1
                } else {
                    instances[instanceID] = 0
                }
                console.log(instanceID, instances[instanceID], 'StatusCode:', data.StatusCode);
                let date = new Date();
                let payload = JSON.parse(data.Payload);
                if (payload.hasOwnProperty('errorMessage')) {
                    console.log(JSON.parse(data.Payload)['errorMessage']);
                    if (INVOKE_CONFIG.retryCounts < INVOKE_CONFIG.retryMax) {
                        console.log("==============================retry");
                        this.wait(1000);
                        INVOKE_CONFIG.retryCounts += 1
                        this.LAMBDA_INVOKE(params);
                    }
                } else {
                    if (INVOKE_CONFIG.restoreImg) {
                        console.log("printing image")
                        printImg(instanceID + '_' + date.getTime(), payload.body.data);
                    }
                }
                // console.log(payload);
            } else {
                if (data.Payload) {
                    console.log('missing instanceID; logs:', logs)
                } else {
                    console.log('missing data')
                }
            }
        }
        console.log(Object.keys(instances).length)
    });
}

module.exports.MAIN = (total_invokes, each_invokes) => {
    if (INVOKE_CONFIG.portal) {
        INVOKE_CONFIG.protalParam = config.portalUrl + config.token;
        console.log("Portal params added:", INVOKE_CONFIG.protalParam);
    }
    for (let j = 0; j < total_invokes; j++) {
        for (let i = 0; i < each_invokes; i++) {
            let randomStr = ''
            if (INVOKE_CONFIG.randomObject) {
                randomStr = '&queryParameters=%7B%22objectIds%22:%22' + Random.natural(INVOKE_CONFIG.randomRange.min + j, INVOKE_CONFIG.randomRange.max) + '%22%7D';
            }
            // get the url
            config.events.forEach(element => {

                let params = this.invokeParams(config.name, Object.assign({}, element, {
                    url: element.url + randomStr + INVOKE_CONFIG.protalParam
                }));

                console.log("start invoke ", invoke_count);
                // console.log(params)
                invoke_count += 1;
                this.LAMBDA_INVOKE(params);
            });
        }
    }
}



console.log(INVOKE_CONFIG);
this.clearTemp(INVOKE_CONFIG.tempDir);
this.MAIN(INVOKE_CONFIG.total_invokes, INVOKE_CONFIG.each_invokes)