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
        console.log(Date().toLocaleString());
        console.log(response);
        const status = response.responseMetaData.statusDesc;

        let contSchedButton = document.evaluate('//button[contains(text(),"Continue scheduling")]', document).iterateNext();
        //console.log('contSchedButton:', contSchedButton);

        if (status.includes('No stores')) {
            let delaySec = minDelaySec + Math.round(Math.random() * (maxDelaySec - minDelaySec));
            console.log(`Nothing found, delaying ${delaySec} secs`);
            pollTimer = setTimeout(() => {
                console.log(`Clicking...(${++requestCount})`);
                contSchedButton.click();
            }, delaySec * 1000);
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
    };

    window.setTiming = function(minDelay, maxDelay) {
        minDelaySec = minDelay;
        maxDelaySec = maxDelay;
        console.log(`Set timing: ${minDelaySec}-${maxDelaySec} sec`);
    };

    window.getTiming = function() {
        console.log(`Current timing: ${minDelaySec}-${maxDelaySec} sec`);
    };

    // intercept getHoldings api call
    (function(open) {
        XMLHttpRequest.prototype.open = function() {
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
