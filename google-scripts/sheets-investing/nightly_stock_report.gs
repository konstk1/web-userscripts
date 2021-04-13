function nightlyUpdate() {
  var date = new Date();
  
  // if trigger is after midnight but before market open,
  // the data is for previous day so subtract 1 day from the date
  if (date.getHours() < 9) {
    date.setDate(date.getDate() - 1);
  }
  
  var dayOfWeek = date.getDay();  // 0 = Sunday, 6 = Saturday
  var hour = date.getHours();
  
  // only run report on weekdays (Days 1-5)
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    weekdayUpdate(date);
  }
  // on saturday, send weekly report
  else if (dayOfWeek == 6) {
    weeklyReport();
  }
}

function weekdayUpdate(date) {
  // get spreadsheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("History - KK");

  var todaysData = getStockData(date);
  
  var firstDataRow = 2;
  sheet.insertRows(firstDataRow);
  var rangeData = sheet.getRange(firstDataRow,1,1,todaysData.length);
  rangeData.setValues([todaysData]);
    
  // copy conditional formattting from row below
  var rangeFormat = sheet.getRange(firstDataRow+1,1,1,todaysData.length);
  rangeFormat.copyTo(rangeData,{formatOnly:true});
  
  // update formula to track most recent update
  const ytdCell = sheet.getRange('M1');
  const jan1TotalReturn = getCellFor(sheet, 'Fri Jan 01 2021 00:00:00 GMT-0500 (Eastern Standard Time)', 'Total Return'); 
//  Logger.log(jan1Cell.getA1Notation());
  ytdCell.setFormula("$E$2 - " + jan1TotalReturn);
  
  const ytdPercentCell = sheet.getRange('L1')
  ytdPercentCell.setFormula("$M$1 / ($B$2 - $M$1)")
}

function weeklyReport() {
}

function getStockData(date) { 
  const stockSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Investments - KK");
  var openVal      = getCellFor(stockSheet,"Open", "Current Value");
  var openReturn   = getCellFor(stockSheet,"Open", "Return");
  var openPercent  = getCellFor(stockSheet,"Open", "Return %");
  var totalReturn  = getCellFor(stockSheet,"Total", "Return");
  var totalPercent = getCellFor(stockSheet,"Total", "Return %");
  
  // If market is closed, data doesn't update and daily return in Investments 
  // doesn't change.  Calculate daily return by subtracting today's total return
  // from yesterday's total return (which is first data row in history sheet).
  const historySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("History - KK")
  var dailyReturn = totalReturn - getCellVal(historySheet, 2, 'E'.charCodeAt()-64);  // E2
  // daily return divided by previous open val (which is today's open value minus today's return)
  var dailyPercent = dailyReturn / (openVal - dailyReturn); 

  const dateStr = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })
  return [dateStr, openVal, openReturn, openPercent, totalReturn, totalPercent, dailyReturn, dailyPercent, date.toLocaleTimeString()];
}

function testError() {
  Logger.log("Running: ");
  getCellLocation("Total", "Return");
}

function getCellFor(sheet, rowLabel, columnLabel) {
  Logger.log("Getting: [%s / %s]", rowLabel, columnLabel);
  
  const range = sheet.getDataRange().getValues();

  var cellRow = -1, cellCol = -1;
  
  for (var row = 0; row < range.length; ++row) {
    var val = range[row][0].toString();
    // Logger.log("Row: %s %s", val, val.indexOf(columnLabel));
    if (val.indexOf(rowLabel) >= 0) {
      cellRow = row + 1;  // start from 1
      break;
    }
  }
  
  for (var col = 0; col < range[0].length; ++col) {
    var val = range[0][col].toString();
    Logger.log("Col: %s %s", val, val.indexOf(columnLabel));
    if (val.indexOf(columnLabel) >= 0) {
      cellCol = col + 1;  // start from 1
      break;
    }
  }
    
  return getCellVal(sheet, cellRow, cellCol);
}

function getCellVal(sheet, row, col) { 
  var val = sheet.getRange(row, col).getValue();
  var count = 0;
  
  // if cell val hasn't loaded, try several times
  while (val == "#N/A" || val == "#ERROR!") {
    Utilities.sleep(1000);
    val = sheet.getRange(row, col).getValue();
    
    // limit number of tries to prevent infinite loop
    if (++count > 120) {  // 2 minutes
      break;
    }
  }
  
  return val;
}
