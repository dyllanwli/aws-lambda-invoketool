'use strict';

const fs = require('fs');
const lambda = require('./index');
const config = require('./config.json');

let mock = require('mockjs');
let Random = mock.Random;
const interval = 60 * 1000; // set 60 sec time interval

const total_invokes = 1;
const each_invokes = 2000;
let success_count = 0;
let fail_count = 0;

let INVOKE = new Promise(function (resolve, reject) {
    for (let j = 0; j < total_invokes; j++) {
        setTimeout(function (j) {
            console.log("invoking " + j + " times...");
            for (let i = 0; i <= each_invokes; i++) {
                config.events.forEach(element => {
                    element.url = element.url + '&randomParam=' + Random.word(1)
                    lambda.invokeAsync(config.name, element).then(result => {
                        if (result.StatusCode == 200) {
                            let payload = JSON.parse(result.Payload)
                            if (payload.statusCode == 200) {
                                if (!payload.body.data.length) {
                                    // let payloadDecode = payload.body.replace(/^data:image\/png;base64,/, "");
                                    // fs.writeFileSync(j + i + "output.png", payload.body.data, 'base64');
                                    // deprecate convert base64encode to image
                                    let buffer = new Buffer(new Uint8Array(payload.body.data));
                                    fs.writeFileSync(String(j) + String(i) + "output.png", buffer, 'binary');
                                }
                                console.log('[success]');
                                // console.log(result);
                                success_count += 1
                                let res = {
                                    fail_count: fail_count,
                                    success_count: success_count
                                };
                                resolve(res);
                            } else {
                                fail_count += 1
                                let res = {
                                    fail_count: fail_count,
                                    success_count: success_count
                                };
                                console.log("Failed payload:  \n", payload)
                                reject(res);
                            }
                        } else {
                            fail_count += 1
                            let res = {
                                fail_count: fail_count,
                                success_count: success_count
                            };
                            console.log("Failed result:  \n", result)
                            reject(res);
                        }
                    });
                });
            }
            console.log('time interval for 60 sec...');
        }, interval * j, j);
        // invoke lambda per $interval sec
    }
})

INVOKE.then(res => {
        console.log(res);
    }).catch(res => {

    });

// console.log("Result (Success/Total) :\n" + success_count + "/" + total_invokes * each_invokes);