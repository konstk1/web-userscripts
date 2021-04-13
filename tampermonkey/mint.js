// ==UserScript==
// @name         Mint Accepted
// @namespace    KK
// @version      1.0
// @description  Highlight new transactions in Mint.
// @author       KK
// @match        https://mint.intuit.com/transaction.event
// @require      https://github.com/kostyan5/web-userscripts/raw/master/tampermonkey/utilities.js
// ==/UserScript==

/* globals request */

// TODO: update dynamically on https://mint.intuit.com/updateTransaction.xevent
// TODO: poll for transaction table load (vs set delay)

(() => {
  'use strict';

  console.log('KK: Mint processing...');

  let transactions;

  function updateTable() {
    console.log('KK: Updating table');
    const rows = document.querySelectorAll('#transaction-list-body>tr:not(.hide)').forEach(row => {
      const date = row.querySelector('.date').innerText.toUpperCase();
      const description = row.querySelector('.description').innerText.toUpperCase();
      const amount = row.querySelector('.money').innerText.replace('-', ''); // strip negative sign
      const tId = parseInt(row.id.split('-')[1]);

      // console.log(tId, date, description, amount);

      // find matching transaction for row
      let match = transactions.find(t => t.id === tId);

      if (!match) {
        console.warn('No match for: ', tId, date, description, amount);
        return;
      }

      // look for Accepted label, and if not found, apply bold to row
      const isAccepted = match.labels.find(l => l.name === "Accepted") != null;
      if (!isAccepted) {
        row.classList.add('bold');
      } else {
        row.classList.remove('bold');
      }
    });
  }

  // override open method to intercept XHR requests
  ((open) => {
    XMLHttpRequest.prototype.open = function() {
      // forward to original handler
      open.apply(this, arguments);
      this.addEventListener('readystatechange', function() {
        if (this.responseURL.startsWith('https://mint.intuit.com/app/getJsonData.xevent') && this.readyState == XMLHttpRequest.DONE) {
          console.log('Intercepted transactions request: ', this.responseURL);
          try {
            transactions = JSON.parse(this.response).set.find(s => s.id === 'transactions').data;
            setTimeout(updateTable, 1500);
          } catch (err) {
            console.error('Failed to parse transactions response: ', err.message);
          }
        } // end getJsonData event
      }, false);
    };
  })(XMLHttpRequest.prototype.open);
})();