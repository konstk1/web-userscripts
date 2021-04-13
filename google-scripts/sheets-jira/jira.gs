function onEdit(e) {
  var regex = /^[A-Z]{1,10}-\d+$/    // regex for JIRA tickets
  
  var range = e.range;
  var val = e.range.getValue();
  
  Logger.log(range.getA1Notation());
  Logger.log(val);
  
  // if not a jira ticket, do nothing
  if (!regex.test(val)) {
    return;
  }
  
  // for jira tickets, replace with hyperlink
  range.getCell(1,1).setFormula('HYPERLINK("https://domain.atlassian.net/browse/' + val + '", "' + val + '")');
}