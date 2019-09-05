// ==UserScript==
// @name         BofA CC Rewards
// @namespace    KK
// @version      1.1
// @description  Show reward rate for BofA credit card
// @author       KK
// @match        https://secure.bankofamerica.com/customer/myrewards/points/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  console.log('KK: BofA Rewards processing...');

  // add Rate table header
  const rewardsHeader = document.querySelector('tr.table-headers-row>th.rewards-cell');
  const rateHeader = rewardsHeader.cloneNode(false);
  rateHeader.innerText = 'Rate';
  rewardsHeader.parentNode.appendChild(rateHeader);

  let totalAmount = 0;
  let totalRewards = 0;

  document.querySelectorAll('tr.trancDetail').forEach(transaction => {
    const description = transaction.querySelector('td.transaction-description-cell').innerText
    const amount = parseFloat(transaction.querySelector('td.amount-cell').innerText.replace(/[$,]/g, '')); // strip $ and comma
    const rewardsCell = transaction.querySelector('.rewards-cell');

    const rewards = parseFloat(rewardsCell.innerText.replace(',', '')); // strip commas and parse to float
    const rate = rewards / amount;

    const rateCell = rewardsCell.cloneNode(false); // shallow copy top level cell
    if (rate) {
      rateCell.innerText = rate.toFixed(1) + '%';
      if (rate > 3) {
        rateCell.innerHTML = `<strong>${rateCell.innerText}</strong>`;
      }
      // don't include bonus rewards into total amount spent (it's duplicated)
      if (!description.includes('Earn 3 Points')) {
        totalAmount += amount;
      }
      totalRewards += rewards;
    }
    transaction.appendChild(rateCell);
  });

  // update rewards summary footer
  const summaryEl = document.querySelector('td.summary-text');
  summaryEl.setAttribute('colspan', 10); // increase span due to new rate column

  // add total rewards line
  const totalRewardsEl = summaryEl.lastElementChild.cloneNode(true); // deep clone last line of summary
  totalRewardsEl.querySelector('.bonus-rewards').innerText = 'Total Rewards';
  totalRewardsEl.querySelector('.total-bonus-rewards>span').innerText = totalRewards.toFixed(2);
  summaryEl.appendChild(totalRewardsEl);

  // add total rate item
  const blendedRateEl = summaryEl.lastElementChild.cloneNode(true); // deep clone last line of summary
  blendedRateEl.querySelector('.bonus-rewards').innerText = 'Blended Rate';
  blendedRateEl.querySelector('.total-bonus-rewards>span').innerText = (totalRewards / totalAmount).toFixed(2) + ' %';
  summaryEl.appendChild(blendedRateEl);
})();