'use strict';

const lambda = require('./index');
const interval = 60 * 1000; // set 60 sec time interval
const events = require('./events.json')

for (let j = 0; j < 20; j++){
    for (let i = 0; i <= 100; i++){
        setTimeout( function(i){
            lambda.invokeAsync('label:test', events).then(result => {
                console.log(result);
            });
        }, interval * i, i);
        // invoke lambda per $interval sec
        console.log('time interval for 60 sec...')
    }
}


