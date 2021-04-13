// Morningstar API Keys
var dataApiKey = 'lstzFDEOhfFNMLikKa0am9mgEKLBl49T';
var searchApiKey = 'Nrc2ElgzRkaTE43D5vA7mrWj2WpSBR35fvmaqfte';

// Asset allocation sheet
var assetAllocSheetTitle = "AllocTest"

function myOnEdit(e) {
  var sheet = e.range.getSheet()
  if (sheet.getName() == assetAllocSheetTitle) {
    var row = e.range.getRow();
    var col = e.range.getColumn();
    var ticker = e.value

    Logger.log('On Edit Alloc: '+ticker);

    // do nothing if not first column or empty cell (deleted value)
    if (col > 1) return;
    
    var range = sheet.getRange('B'+row+':F'+row)
    range.clearContent();
    
    if (!ticker) {
      return
    }
    
    var alloc = getAllocationForTicker(ticker);
    
    range.setValues([[alloc.usEquity, alloc.intlEquity, alloc.bonds, alloc.cash, (alloc.other + alloc.notClassified)]]);
  }
}

function getAllocationForTicker(ticker) {
  var fundId = getFundIdFromTicker(ticker);
  var allocation = getAllocationForFundId(fundId);
  
  Logger.log(allocation);
  return allocation;
}

function searchSecurity(ticker) {
  var url = 'https://www.morningstar.com/api/v1/search/entities?q='+ticker+'&limit=1&autocomplete=false';
  var options = {
    headers: searchHeaders,
  };
  
  var response = UrlFetchApp.fetch(url, options);
  var json = JSON.parse(response.getContentText());
  var sec = json.results[0];
  
  if (!sec) return;
  
  var security = {
    ticker: ticker,
    type: sec.securityType,
    exchange: sec.exchange,
  };
  
  return security;
}

function getFundIdFromTicker(ticker, type, exchange) {
  var sec = searchSecurity(ticker);
  
  if (!sec) {
    SpreadsheetApp.getUi().alert('Failed to search security: ' + ticker);
    return;
  }
  
  var url = 'https://www.morningstar.com/api/v1/securities/search?type='+sec.type+'&exchange='+sec.exchange+'&ticker='+sec.ticker;
  var options = {
    headers: searchHeaders,
  };
  
  var response = UrlFetchApp.fetch(url, options);
  var json = JSON.parse(response.getContentText());
  
  var fundId = json[0].secId;
  
  Logger.log('Fetched ticker ' + ticker + ' : SecID ' + fundId);
  return fundId;
}

function getAllocationForFundId(fundId) {
  var url = 'https://api-global.morningstar.com/sal-service/v1/fund/process/asset/'+fundId+'/data?locale=en';
  const options = {
    headers: {
      'accept-encoding': 'gzip, deflate, br',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'ApiKey': dataApiKey,
    },
  };
  
  var response = UrlFetchApp.fetch(url, options);
  var json = JSON.parse(response.getContentText());
  var map = json.allocationMap;

  var allocation = {
    bonds: parseFloat(map.AssetAllocBond.netAllocation) / 100.0,
    cash: parseFloat(map.AssetAllocCash.netAllocation) / 100.0,
    usEquity: parseFloat(map.AssetAllocUSEquity.netAllocation) / 100.0,
    intlEquity: parseFloat(map.AssetAllocNonUSEquity.netAllocation) / 100.0,
    notClassified: parseFloat(map.AssetAllocNotClassified.netAllocation) / 100.0,
    other: parseFloat(map.AssetAllocOther.netAllocation) / 100.0,
  };

  return allocation;
}

function getCapInfoForFundId(fundId) {
  var url = 'https://api-global.morningstar.com/sal-service/v1/fund/process/marketCap/'+fundId+'/data?clientId=MDC';
  const options = {
    headers: {
      'accept-encoding': 'gzip, deflate, br',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'ApiKey': dataApiKey,
    },
  };
  
  var response = UrlFetchApp.fetch(url, options);
  var json = JSON.parse(response.getContentText());
  var fund = json.fund;
  
  Logger.log(equity);
  
  var equity = {
    large: fund.giant + fund.large,
    medium: fund.medium,
    small: fund.small + fund.micro,
  }
  
  Logger.log(equity);
  return equity;
}

function test() {
//  getFundIdFromTicker('VFIAX');
  getAllocationForTicker('VOO');
//  searchSecurity('VOO');
}

var searchHeaders = {
  'accept-encoding': 'gzip, deflate, br',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36',
  'accept': 'application/json, text/plain, */*',
  'x-api-key': searchApiKey,
};