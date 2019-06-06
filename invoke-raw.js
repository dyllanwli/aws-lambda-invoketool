'use strict';

const lambda = require('./index');
const config = require('./config.json')

const params = {
    FunctionName: config.name,
    Qualifier: config.Qualifier,
    InvocationType: config.InvocationType,
    Payload: JSON.stringify(config.events)
};

lambda.raw.invoke(params, (err, result) => {
    // handle the result
    console.log(result);
});