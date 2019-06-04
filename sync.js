'use strict';

const lambda = require('./index');

function sleep(sec) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

async function main() {
    console.log("invoking lambda...");
    for (let i = 0; i < 100; i++) {
        await sleep(60);
        lambda.invoke('screenshot-service', {test: 'test'}).then(result => {
            console.log(result)
        })
    }
}
