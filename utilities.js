// ==UserScript==
// @name         Utilities
// @namespace    KK
// @version      1.0
// @description  Utilities for other scripts
// @author       You
// @grant        none
// ==/UserScript==

async function request(method, url) {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method,
      url,
      onload: resolve,
      onerror: reject,
    });
  }); // end new Promise()
} // end request()

console.log('Loading utilities');

(function() {
  'use strict';

  console.log('Loaded utilities ()');
})();