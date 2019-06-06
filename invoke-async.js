'use strict';

const lambda = require('./index');
const config = require('./config.json');

const interval = 60 * 1000; // set 60 sec time interval

const total_invokes = 1;
const each_invokes = 100;
let success_count = 0;

async function invokePromise() {
    return new Promise(function (resolve, reject) {
        for (let j = 0; j < total_invokes; j++) {
            setTimeout(function (j) {
                console.log("invoking " + j + " times...");
                for (let i = 0; i <= each_invokes; i++) {
                    lambda.invokeAsync(config.name, config.events).then(result => {
                        if (result.StatusCode == 200) {
                            let payload = JSON.parse(result.Payload)
                            if (payload.statusCode == 200) {
                                console.log("[success] === body length:", payload.body.length);
                                success_count += 1
                            }
                        } else {
                            console.error("payload false");
                        }
                    });
                }
            }, interval * j, j);
            // invoke lambda per $interval sec
            console.log('time interval for 60 sec...');
        }
    })
    console.log("Result (Success/Total) :\n" + success_count + "/" + total_invokes * each_invokes);
}

function main() {
    let invoke = invokePromise();
    invoke.then(function (result) {

    })
}