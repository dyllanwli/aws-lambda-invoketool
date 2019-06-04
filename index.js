'use strict';

const AWS = require('aws-sdk');
const pify = require("pify");
const parse = require('parse-aws-lambda-name');


module.exports.raw = new AWS.Lambda();

module.exports.invoke = (name, payload) => {
    if (!name) {
        return Promise.reject(new TypeError('input name error'));
    }

    const parsed = parse(name);

    if (!parsed) {
        return Promise.reject(new Error('function name invalid'));
    }

    const params = {
        FunctionName: parsed.functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(payload)
    }

    if (parsed.Qualifier) {
        params.Qualifier = parsed.Qualifier;
    }

    return pify(this.raw.invoke.bind(this.raw))(params)
        .then(data => {
            let payload = data.payload;

            try {
                payload = JSON.parse(payload);
            } catch (error) {
                throw error;
            }

            if (payload && payload.errorMessage) {
                throw new Error(payload.errorMessage);
            }

            return payload;
        });
};

module.exports.invokeAsync = (name, payload) => {
    if (!name) {
        return Promise.reject(new TypeError('input name error'));
    }

    const parsed = parse(name);

    if (!parsed) {
        return Promise.reject(new Error('function name invalid'));
    }

    const params = {
        FunctionName: parsed.functionName,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(payload)
    }

    if (parsed.Qualifier) {
        params.Qualifier = parsed.Qualifier;
    }

    return pify(this.raw.invoke.bind(this.raw), Promise)(params);
}