'use strict';

const lambda = require('./index');
const events = require('./event.json')

const params = {
    FunctionName: 'test',
    Qualifier: 'alias',
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify(events)
};

lambda.raw.invoke(params, (err, result) => {
    // handle the result
});