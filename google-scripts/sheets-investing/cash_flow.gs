// Asset allocation sheet
var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Cash Flow");
var forecastDays = 7

// Sheet setup
var itemCol = 1
var amountCol = 2
var dateCol = 3
var balanceCol = 5

var firstItemRow = 4

function updateCashFlow() {
  var data = getData();
  
  //Logger.log(data[0]);
  
  const lastDate = getLastDate(data);
  const forecastEndDate = new Date(lastDate);
  forecastEndDate.setDate(forecastEndDate.getDate() + forecastDays);
  
  Logger.log("Last date: %s", lastDate);
  Logger.log("End date %s", forecastEndDate);
  
  while (lastDate < forecastEndDate) {
    lastDate.setDate(lastDate.getDate() + 1);  // increment date
    data = forecastDate(data, lastDate);
  }
  
  //Logger.log(data);
  
  // write data back to the sheet
  var range = sheet.getRange(firstItemRow, 1, data.length, data[0].length)
  range.setValues(data);
  
  // update balance formulas
  range = sheet.getRange(firstItemRow, balanceCol, data.length);
  range.setFormulaR1C1(`R[0]C${amountCol}+R[-1]C${balanceCol}`)
}

function forecastDate(data, date) {
  Logger.log("Forecasting %s", date);
  
  var row = processMonthlyEvents(date);
  if (row) {
    data.push(row);
  }

  row = processBiweeklyEvents(data, date)
  if (row) {
    data.push(row)
  }
  
  row = processWeeklyEvents(data, date)
  if (row) {
    data.push(row)
  }
  
  return data;
}

function processMonthlyEvents(date) {
  const day = date.getDate();
  var amount = 0;
  var item = "";
  
  if (day == 2) {
    item = "BofA Cash CC";
    amount = -0;
  } else if (day == 3) {
    item = "Amzn Visa";
    amount = -0;
  } else if (day == 7) {
    item = "BofA Visa";
    amount = -0;
  } else if (day == 23) {
    item = "Mortgage"
    amount = -0;
  } else {
    return undefined
  }
  
  
  
  return [item, amount, dateToStr(date), "", 0];
}

function processBiweeklyEvents(data, date) {
  const day = date.getDate();
  var amount = 0;
  var item = "";
  
  const kkDate = getLastDateOf("Paycheck KK", data);
  const sdDate = getLastDateOf("Paycheck SD", data);
  
  kkDate.setDate(kkDate.getDate() + 14);
  sdDate.setDate(sdDate.getDate() + 14);
  
  Logger.log("KK %s vs %s", kkDate, date);
  Logger.log("SD %s vs %s", sdDate, date);
  
  if (date.getTime() == kkDate.getTime()) {
    item = "Paycheck KK"
    amount = 0;
  } else if (date.getTime() == sdDate.getTime()) {
    item = "Paycheck SD"
    amount = 0;
  } else {
    return undefined
  }
    
  return [item, amount, dateToStr(date), "", 0];
}

function processWeeklyEvents(data, date) {
  const day = date.getDay();
  var amount = 0;
  var item = "";
  
  return undefined;     // nothing weekly for now
  
  if (day == 5) {       // each Friday, Project M
    item = "Project M"
    amount = -0;
  } else { 
    return undefined;
  }
  
  return [item, amount, dateToStr(date), "", 0];
}

function getLastDate(data) {
  const val = data[data.length - 1][dateCol - 1];
  return new Date(val);
}

function getLastDateOf(item, data) {
  const rows = data.filter(row => row[itemCol-1] == item);
  return new Date(rows[rows.length - 1][dateCol-1]);
}

function getData() {
  const values = sheet.getRange("A:E").getValues();
  var lastRow = -1;
  const firstRow = firstItemRow - 1;  // 0-based
  
  for (var i = firstRow; i < values.length; ++i) {
    const item = values[i][0];
    //Logger.log("%s: %d", item, item.length);
    if (item == "") {
      break;
    }
    
    lastRow = i;
  }
  
  Logger.log("Last row: %d", lastRow);
  
  // clip off header rows and all empty rows at the end of range
  return values.slice(firstRow, lastRow+1);
}

function dateToStr(date) {
  return (date.getMonth()+1) + "/" + date.getDate() + "/" + (date.getFullYear()%100)
}