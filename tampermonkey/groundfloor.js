// ==UserScript==
// @name         Groundfloor
// @namespace    KK
// @version      0.1
// @description  Show groundloor history on loan list page
// @author       KK
// @match        https://www.groundfloor.us/batch_investment_portal
// @grant        GM_xmlhttpRequest
// @require      https://raw.githubusercontent.com/konstk1/web-userscripts/master/tampermonkey/utilities.js
// ==/UserScript==

/* globals request */

(async () => {
  'use strict';

  console.log('KK: Fetching Groundfloor history...');
  document.querySelectorAll('td.loan-address').forEach((loanRow, idx) => {
    const link = loanRow.querySelector('a');
    // console.log(link.href);

    // need to async IIFE because async doesn't work at the top level
    (async () => {
      try {
        const response = await request('GET', link.href);
        const parser = new DOMParser();
        const loan = parser.parseFromString(response.responseText, "text/html");

        let loansFunded = loan.evaluate("//div[contains(., 'Loans Funded')]/following-sibling::div[@class='value-in-box']", loan).iterateNext().innerHTML;
        let loansRepaid = loan.evaluate("//div[contains(., 'Loans Repaid')]/following-sibling::div[@class='value-in-box']", loan).iterateNext().innerHTML;
        let onTimeRepaid = loan.evaluate("//div[contains(., 'On Time')]/following-sibling::div[@class='value-in-box']", loan).iterateNext().innerHTML;

        // console.log(`Funded ${loansFunded.trim()} / ${loansRepaid.trim()} / ${onTimeRepaid.trim()}`);

        const historyEl = document.createElement('div');
        historyEl.setAttribute('class', 'subheadline');
        historyEl.innerHTML = `${loansFunded.trim()} / ${loansRepaid.trim()} / ${onTimeRepaid.trim()}`;

        loanRow.appendChild(historyEl);
      } catch (err) {
        console.error(err);
      }
    })(); // end async IIFE

  }); // each order
})();