'use strict';

const lambda = require('./index');
const config = require('./config.json');

function sleep(sec) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

async function main() {
    console.log("invoking lambda...");
    for (let i = 0; i < 100; i++) {
        await sleep(60);
        lambda.invoke(config.name, config.events).then(result => {
            console.log(result)
        })
    }
}
