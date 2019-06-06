'use strict';

const lambda = require('./index');
const events = require('./event.json');

function sleep(sec) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

async function main() {
    console.log("invoking lambda...");
    for (let i = 0; i < 100; i++) {
        await sleep(60);
        lambda.invoke('screenshot-service', events).then(result => {
            console.log(result)
        })
    }
}
