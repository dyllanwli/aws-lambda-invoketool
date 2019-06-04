'use strict';

const lambda = require('./index');

const params = {
    FunctionName: 'test',
    Qualifier: 'alias',
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({hello: 'world'})
};

lambda.raw.invoke(params, (err, result) => {
    // handle the result
});