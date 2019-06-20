'use strict';

const AWS = require('aws-sdk');
const pify = require("pify");
const parse = require('parse-aws-lambda-name');
let config = require('./config.json');
const fs = require('fs');
const path = require('path');
let Random = require("mockjs").Random

AWS.config.loadFromPath('./appstudioApiKey.json');
let lambda = new AWS.Lambda();
const total_invokes = 1;
const each_invokes = 50;
let invoke_count = 0;
let instances = {};

let randomRange = {
    min: 1000,
    max: 800000
};
let retryMax = 2;
let retryCounts = 0;

// if true, add protalURL and token from config file
let protalParam = '';

// for image storage
const tempDir = './temp';


// setting
let restoreImg = false;
let portal = true;
let randomObject = true;
if (!randomObject) {
    config = require('./config-err.json');
}
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
    fs.writeFileSync(tempDir + '/' + naming + "_output.png", buffer, 'binary');
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
            if (JSON.parse(data.Payload).hasOwnProperty('errorMessage')) {
                console.log("Error:");
                console.log(JSON.parse(data.Payload)['errorMessage']);
                console.log("==============================retry");
                this.wait(1000);
                retryCounts += 1
                if (retryCounts <= retryMax) {
                    this.LAMBDA_INVOKE(params);
                }
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
                    // console.log(payload);
                    if (restoreImg) {
                        printImg(instanceID + '_' + date.getTime(), payload.body.data);
                    }

                } else {
                    if (data.Payload) {
                        console.log('missing instanceID; logs:', logs)
                    } else {
                        console.log('missing data')
                    }
                }
            }
        }
        console.log(Object.keys(instances).length)
    });
}

module.exports.MAIN = (total_invokes, each_invokes) => {
    if (portal) {
        protalParam = config.portalUrl + config.token;
        console.log("Portal params added:", protalParam);
    }
    for (let j = 0; j < total_invokes; j++) {
        for (let i = 0; i < each_invokes; i++) {
            let randomStr = ''
            if (randomObject) {
                randomStr = '&queryParameters=%7B%22objectIds%22:%22' + Random.natural(randomRange.min + j, randomRange.max) + '%22%7D';
            }
            // get the url
            config.events.forEach(element => {

                let params = this.invokeParams(config.name, Object.assign({}, element, {
                    url: element.url + randomStr + protalParam
                }));

                console.log("start invoke ", invoke_count);
                // console.log(params)
                invoke_count += 1;
                this.LAMBDA_INVOKE(params);
            });
        }
    }
}

this.clearTemp(tempDir);
this.MAIN(total_invokes, each_invokes)