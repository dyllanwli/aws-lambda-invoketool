'use strict';

const AWS = require('aws-sdk');
const pify = require("pify");
const parse = require('parse-aws-lambda-name');
const config = require('./config.json')
let Random = require("mockjs").Random

AWS.config.loadFromPath('./appstudioApiKey.json');
const total_invokes = 1;
const each_invokes = 50;
let instance_count = 0;
let invoke_count = 0;
let instances = {};
let lambda = new AWS.Lambda();
let randomRange = {
    min: 1000,
    max: 789000
};
let portal = true;
// if true, add protalURL and token from config file
let protalParam = ''

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
    fs.writeFileSync(naming + "_output.png", buffer, 'binary');
}

function getRandomString() {
    return Math.random()
        .toString(36)
        .substring(7);
}

module.exports.LAMBDA_INVOKE = (params) => {
    lambda.invoke(params, function (err, data) {
        if (err) {
            console.log(err, err.stack);
        } else {
            // console.log(data);
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
    if (portal) {
        console.log("add portal params");
        protalParam = config.portalUrl + config.token;
    }
    for (let j = 0; j < total_invokes; j++) {
        for (let i = 0; i < each_invokes; i++) {
            let randomStr = Random.natural(randomRange.min + j, randomRange.max) + '%22%7D';

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

this.MAIN(total_invokes, each_invokes)