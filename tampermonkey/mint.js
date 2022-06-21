// ==UserScript==
// @name         Mint Accepted
// @namespace    KK
// @version      1.0
// @description  Highlight new transactions in Mint.
// @author       KK
// @match        https://mint.intuit.com/transactions
// @require      https://raw.githubusercontent.com/konstk1/web-userscripts/master/tampermonkey/utilities.js
// ==/UserScript==

/* globals request */

// TODO: update dynamically on https://mint.intuit.com/updateTransaction.xevent
// TODO: poll for transaction table load (vs set delay)

(async () => {
  'use strict';

  console.log('KK: Mint processing...');

  let transactions;

  function updateTable() {
    console.log('KK: Updating table');
      //data-automation-id="TRANSACTION_TABLE_ROW_READ_2134927_1790129326_0"
    const rows = document.querySelectorAll('table[data-automation-id="TRANSACTIONS_LIST_TABLE"]>tbody>tr').forEach(row => {
      //const date = row.querySelector('.date').innerText.toUpperCase();
      const title = row.getAttribute('title');
      //const amount = row.querySelector('.money').innerText.replace('-', ''); // strip negative sign
      const tId = row.getAttribute('data-automation-id');

      if (!title || !tId) {
        console.warn('Skipping row (no title or id)');
        return;
      }

      // console.log(tId, title);

      // find matching transaction for row
      let match = transactions.find(t => tId.includes(t.id));

      if (!match) {
        console.warn('No match for: ', tId, title); //, title, amount);
        return;
      }

      let isAccepted = false;
      const tagData = match.tagData;
      // skip if not tags
      if (tagData) {
        isAccepted = tagData.tags.find(tag => tag.name === "Accepted") != null;
      }

      // add bold as necessary to each td>div in this row
      row.querySelectorAll('td>div').forEach(d => d.style.fontWeight = isAccepted ? '' : 'bold' );
      // look for Accepted label, and if not found, apply bold to row
      if (!isAccepted) {
        row.classList.add('bold');
        console.log('Not accepted: ', row.classList);
      } else {
        console.log('Accepted: ', title);
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
        if (this.responseURL.startsWith('https://mint.intuit.com/pfm/v1/transactions/search') && this.readyState == XMLHttpRequest.DONE) {
          console.log('Intercepted transactions request: ', this.responseURL);
          try {
            transactions = JSON.parse(this.response).Transaction;
            setTimeout(updateTable, 1500);
          } catch (err) {
            console.error('Failed to parse transactions response: ', err.message);
          }
        } // end getJsonData event
      }, false);
    };
  })(XMLHttpRequest.prototype.open);
})();