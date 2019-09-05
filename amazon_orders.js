// ==UserScript==
// @name         Amazon Orders
// @namespace    KK
// @version      1.1
// @description  Show Amazon transactions for the order.
// @author       KK
// @match        https://*.amazon.com/gp/*/order-history*
// @grant        GM_xmlhttpRequest
// @require      https://github.com/kostyan5/web-userscripts/raw/master/utilities.js
// ==/UserScript==

/* globals request */

(async () => {
  'use strict';

  console.log('KK: Fetching Amazon order transactions...');
  document.querySelectorAll('.order').forEach((orderBox, idx) => {
    const links = Array.from(orderBox.querySelectorAll('a'));
    // console.log(links);
    // links.forEach(x => console.log(x.innerText));
    const orderDetailsLink = links.find(link => link.innerText.includes('Order Details'))
    console.log(orderDetailsLink.href);

    // need to async IIFE because async doesn't work at the top level
    (async () => {
      try {
        const response = await request('GET', orderDetailsLink.href);
        const parser = new DOMParser();
        const order = parser.parseFromString(response.responseText, "text/html");
        let transactionsDiv = order.querySelector('#orderDetails .a-expander-content');

        // console.log(transactionsDiv);

        const transEl = document.createElement('div');
        transEl.setAttribute('class', 'a-box');
        const innerBox = document.createElement('div');
        innerBox.setAttribute('class', 'a-box-inner');
        innerBox.innerHTML = transactionsDiv.innerHTML;

        transEl.appendChild(innerBox)
        orderBox.appendChild(transEl);
      } catch (err) {
        console.err(err);
      }
    })(); // end async IIFE

  }); // each order
})();