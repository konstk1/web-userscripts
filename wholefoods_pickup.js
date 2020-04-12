// ==UserScript==
// @name         Whole Foods Pickup/Delivery
// @namespace    KK
// @version      1.0
// @description  Poll Whole Foods for pickup slots
// @author       KK
// @match        https://primenow.amazon.com/checkout/enter-checkout*
// @grant        none
// ==/UserScript==

// settings
let minDelaySec = 60;
let maxDelaySec = 120;
let alertAudioUrl = 'https://soundbible.com/grab.php?id=2154&type=mp3';
let alertDurationSec = 5;

(async () => {
    'use strict';

    console.log('Whole Foods pickup: ', new Date());

    let noPickup = document.evaluate('//span[contains(text(),"No pickup")]', document).iterateNext();
    let noDelivery = document.evaluate('//span[contains(text(),"No delivery windows available")]', document).iterateNext();
    console.log('noPickup:', noPickup, 'noDelivery: ', noDelivery);

    if (noPickup || noDelivery) {
        let delaySec = minDelaySec + Math.round(Math.random() * (maxDelaySec - minDelaySec));
        console.log(`No pickup/delivery, refreshing in ${delaySec} seconds.`);
        setTimeout(() => {
            console.log('Refreshing');
            location.reload();
        }, delaySec * 1000);
        return;
    }

    console.log('Pickup/delivery slots found, playing alert');

    let alertSound = document.createElement('audio');
    alertSound.src = alertAudioUrl;
    alertSound.preload = 'auto';
    alertSound.loop = true;
    alertSound.play();

    setTimeout(() => { alertSound.loop = false; }, alertDurationSec * 1000);
})();
