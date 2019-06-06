'use strict';

const lambda = require('./index');
const config = require('./config.json');

const interval = 60 * 1000; // set 60 sec time interval

for (let j = 0; j < 1; j++) {
    setTimeout(function (j) {
        console.log("invoking " + j + " times...");
        for (let i = 0; i <= 10; i++) {
            lambda.invokeAsync(config.name, config.events).then(result => {
                console.log(result);
            });
        }
    }, interval * j, j);
    // invoke lambda per $interval sec
    console.log('time interval for 60 sec...');
}