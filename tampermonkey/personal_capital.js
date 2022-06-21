// ==UserScript==
// @name         PersonalCapital
// @namespace    KK
// @version      1.0
// @description  PersonalCapital allocation dump
// @author       You
// @match        https://home.personalcapital.com/page/login/app
// @grant        GM_xmlhttpRequest
// @require      https://raw.githubusercontent.com/konstk1/web-userscripts/master/tampermonkey/utilities.js
// ==/UserScript==

/* globals request */

(async () => {
  'use strict';

    const displayOrder = {
    'U.S. Stocks': 1,
    'Intl Stocks': 2,
    'U.S. Bonds': 3,
    'Intl Bonds': 4,
    'Alternatives': 6,
    'Cash': 5,
    'Unclassified': 7,
  };

  console.log('Fetching allocations: ', location);

  var processed = false;

  function processAllocation(json) {
    // in case the api is called multiple times, only need this once
    if (processed) return;
    processed = true;

    let topLevel = json.spData.classifications[0].classifications;

    // console.log(topLevel);
    console.log('================================================');

    topLevel.sort((a,b) => displayOrder[a.classificationTypeName] - displayOrder[b.classificationTypeName]).forEach((asset) => {
      switch (asset.classificationTypeName) {
        case 'U.S. Stocks':
          processUsStocks(asset);
          break;
        case 'Intl Stocks':
          processIntlStocks(asset);
          break;
        case 'U.S. Bonds':
          processUsBonds(asset);
          break;
        case 'Intl Bonds':
          processIntlBonds(asset);
          break;
        case 'Alternatives':
          processAlternatives(asset);
          break;
        case 'Cash':
          processCash(asset);
          break;
        case 'Unclassified':
          processUnclassified(asset);
          break;
        default:
          console.error('Invalid asset type: ', asset.classifciationTypeName);
      };

    });

    console.log('================================================');

    function processUsStocks(asset) {
      var largeCap = 0;
      var midCap = 0;
      var smallCap = 0;

      asset.classifications.forEach(cap => {
        if (cap.classificationTypeName.startsWith('Large')) {
          largeCap += cap.percentOfTMV;
        } else if (cap.classificationTypeName.startsWith('Mid')) {
          midCap += cap.percentOfTMV;
        } else if (cap.classificationTypeName.startsWith('Small')) {
          smallCap += cap.percentOfTMV;
        } else {
          console.log('Invalid US Stocks cap type: ', cap.classificationTypeName);
        }
      });

      console.log('-- US Stocks --------------------------------');
      console.log(`\tLarge: \t\t ${largeCap.toFixed(2).toString().padStart(6, ' ')}%`);
      console.log(`\tMed: \t\t ${midCap.toFixed(2).toString().padStart(6, ' ')}%`);
      console.log(`\tSmall: \t\t ${smallCap.toFixed(2).toString().padStart(6, ' ')}%`);
    };

    function processIntlStocks(asset) {
      var developed = 0;
      var emerging = 0;

      asset.classifications.forEach(cap => {
        if (cap.classificationTypeName.startsWith('Developed')) {
          developed += cap.percentOfTMV;
        } else if (cap.classificationTypeName.startsWith('Emerging')) {
          emerging += cap.percentOfTMV;
        } else {
          console.log('Invalid Intl Stocks type: ', cap.classificationTypeName);
        }
      });

      console.log('-- Intl Stocks ------------------------------');
      console.log(`\tDeveloped: \t ${developed.toFixed(2).toString().padStart(6, ' ')}%`);
      console.log(`\tEmerging: \t ${emerging.toFixed(2).toString().padStart(6, ' ')}%`);
    };

    function processUsBonds(asset) {
      var bonds = asset.percentOfTMV;

      console.log('-- US Bonds ---------------------------------');
      console.log(`\tUS Bonds \t ${bonds.toFixed(2).toString().padStart(6, ' ')}%`);
    };

    function processIntlBonds(asset) {
      var bonds = asset.percentOfTMV;

      console.log('-- Intl Bonds -------------------------------');
      console.log(`\tIntl Bonds \t ${bonds.toFixed(2).toString().padStart(6, ' ')}%`);
    };

    function processAlternatives(asset) {
      var realEstate = 0;
      var other = 0;

      asset.classifications.forEach(cap => {
        if (cap.classificationTypeName.startsWith('Real Estate')) {
          realEstate += cap.percentOfTMV;
        } else {
          other += cap.percentOfTMV;
        }
      });

      console.log('-- Alternatives -----------------------------');
      console.log(`\tReal Est: \t ${realEstate.toFixed(2).toString().padStart(6, ' ')}%`);
      console.log(`\tOther: \t\t ${other.toFixed(2).toString().padStart(6, ' ')}%`);
    };

    function processCash(asset) {
      var cash = asset.percentOfTMV;

      console.log('-- Cash -------------------------------------');
      console.log(`\tCash \t\t ${cash.toFixed(2).toString().padStart(6, ' ')}%`);
    };

    function processUnclassified(asset) {
      var unclass = asset.percentOfTMV;

      console.log('-- Unclassified -----------------------------');
      console.log(`\tUnclass \t ${unclass.toFixed(2).toString().padStart(6, ' ')}%`);
    };
  }

  // intercept getHoldings api call
  (function(open) {
    XMLHttpRequest.prototype.open = function() {
        this.addEventListener("readystatechange", function() {
            if (this.readyState == 4 && this.responseURL.endsWith('/api/invest/getHoldings')) {
              let response = JSON.parse(this.response);
              processAllocation(response);
            }
        }, false);
        open.apply(this, arguments);
    };
  })(XMLHttpRequest.prototype.open);
})();