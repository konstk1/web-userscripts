// ==UserScript==
// @name         CVS Vac Search
// @namespace    KK
// @version      1.0
// @description  CVS Covid Vac
// @author       KK
// @match        https://www.cvs.com/*
// @grant        none
// ==/UserScript==

// settings
let minDelaySec = 20;
let maxDelaySec = 30;
let alertAudioUrl = 'https://soundbible.com/grab.php?id=2154&type=mp3';
let alertDurationSec = 5;
let requestCount = 1;
let pollTimer = 0;

(async () => {
    'use strict';

    console.log('CVS Vac Search: ', new Date());

    function processImzResponse(response) {
        const timestamp = new Date().toLocaleTimeString();
        //console.log(Date().toLocaleString());
        console.log(response);
        const status = response.responseMetaData.statusDesc;

        let contSchedButton = document.evaluate('//button[contains(text(),"Continue scheduling")]', document).iterateNext();
        //console.log('contSchedButton:', contSchedButton);

        if (status.includes('No stores')) {
            let delaySec = minDelaySec + Math.round(Math.random() * (maxDelaySec - minDelaySec));
            console.log(`Nothing found, delaying ${delaySec} secs`);

            // if no active poll timer
            if (pollTimer == 0) {
                pollTimer = setTimeout(() => {
                    console.log(`${timestamp} - Clicking...(${++requestCount})`);
                    pollTimer = 0; // indicate timer is no longer active
                    contSchedButton.click();
                }, delaySec * 1000);
            } else {
                console.log(`Timer already active (${pollTimer})`);
            }

            return;
        }

        console.log('Vac slots found, playing alert');

        let alertSound = document.createElement('audio');
        alertSound.src = alertAudioUrl;
        alertSound.preload = 'auto';
        alertSound.loop = true;
        alertSound.play();

        setTimeout(() => { alertSound.loop = false; }, alertDurationSec * 1000);
    }

    window.stopPoll = function() {
        console.log(`Stopping polling (timer ${pollTimer})`);
        clearTimeout(pollTimer);
        pollTimer = 0;
    };

    window.setTiming = function(minDelay, maxDelay) {
        minDelaySec = minDelay;
        maxDelaySec = maxDelay;
        console.log(`Set timing: ${minDelaySec}-${maxDelaySec} sec`);
    };

    window.getTiming = function() {
        console.log(`Current timing: ${minDelaySec}-${maxDelaySec} sec`);
    };

    // intercept search api call
    (function(open) {
        XMLHttpRequest.prototype.open = function() {
            //console.log(this)
            if (this.method == 'POST' && this.url.includes('publishmemberevents')) {
                console.log(this.headers);
                this.headers['Accept-Language'] = 'en-us';
            }
            this.addEventListener("readystatechange", function() {
                if (this.readyState == 4 && this.responseURL.endsWith('/getIMZStores')) {
                    let response = JSON.parse(this.response);
                    processImzResponse(response)
                }
            }, false);
            open.apply(this, arguments);
        };
    })(XMLHttpRequest.prototype.open);

})();