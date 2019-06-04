'use strict';

const lambda = require('./index');
const interval = 60 * 1000; // set 60 sec time interval

for (let i = 0; i <= 100; i++){
    setTimeout( function(i){
        // lambda.invokeAsync('label:test', {test: 'test'}).then(result => {
        //     console.log(result);
        // });
        console.log('time interval for 60 sec...')
    }, interval * i, i);
    // invoke lambda per $interval sec
}

