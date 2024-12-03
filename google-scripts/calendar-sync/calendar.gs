// Ref: https://medium.com/@willroman/auto-block-time-on-your-work-google-calendar-for-your-personal-events-2a752ae91dab
// Events: https://developers.google.com/calendar/v3/reference/events#resource
// List: https://developers.google.com/calendar/v3/reference/events/list

// ---- Settings ---------------------------------------------
const personalCalId = 'personal@gmail.com';
const workCalId = 'work@company.com';
const daysLookAhead = 30;   // number of days to look forward
const blockedOffTitle = 'Unavailable';

const UNAVAILABLE_COLOR = 1 // Lavender
const HOLD_COLOR = 1 // Lavender
//------------------------------------------------------------

function init() {
  // delete all triggers first and replace with new
  const triggers = ScriptApp.getProjectTriggers();
  for (const trig of triggers) {
    ScriptApp.deleteTrigger(trig);
  }

  ScriptApp.newTrigger('onUpdatePersonal')
    .forUserCalendar(personalCalId)
    .onEventUpdated()
    .create()

  ScriptApp.newTrigger('onUpdateWork')
    .forUserCalendar(workCalId)
    .onEventUpdated()
    .create()
}

function getCalendarEvents(calId, startDateTime, endDateTime) {
  const timeMin = new Date(startDateTime);
  const timeMax = new Date(endDateTime);

  const options = {
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    showDeleted: false,
    singleEvents: true,   // convert recurring events into single instances
    maxResults: 100,
    orderBy: 'startTime'
  };

  const response = Calendar.Events.list(calId, options);
  
  return response.items;
}

function isWorkingHours(startTime, endTime) {
  
  // anything on weekdays between 8a and 6p
  return (startTime.getDay() >= 1 && endTime.getDay() <= 5) && 
         (endTime.getHours() >= 8 && startTime.getHours() < 18);
}

function blockOffEvent(event) {
  const workEvent = {
    summary: blockedOffTitle,
    start: event.start,
    end: event.end,
    colorId: UNAVAILABLE_COLOR,
    reminders: { useDefault: false },
  };

  console.log('    Creating Unavailable event');
  Calendar.Events.insert(workEvent, workCalId);
}

// Checks to see if there is an encompassing 'Unavailable' event already in the work calendar
function isBlockedOff(startTime, endTime) {
  const workEvents = getCalendarEvents(workCalId, startTime, endTime);
  console.log('    Found %d overlapping work events', workEvents.length);

  for (const event of workEvents) {
    const eventStart = new Date(event.start.dateTime);
    const eventEnd = new Date(event.end.dateTime);
    if (event.summary == blockedOffTitle && eventStart <= startTime && eventEnd >= endTime) {
      return true;
    }
  };

  return false;
}

function blockOffWorkCalendar(events) {
  // filter out events outside of business hours
  for (const event of events) {
    const startTime = new Date(event.start.dateTime);
    const endTime = new Date(event.end.dateTime);
    console.log('Processing %s (%s - %s) [avail %d]', event.summary, startTime.toLocaleString(), endTime.toLocaleString(), event.transparency == 'transparent');
    
    if(!isWorkingHours(startTime, endTime)) {
      console.log('    Skipping, outside of working hours');
      continue;
    }

    if (isBlockedOff(startTime, endTime)) {
      console.log('    Skipping, already blocked off');
      continue;
    }

    if (event.transparency == 'transparent') {
      console.log('    Skipping, makred as available');
      continue;
    }

    blockOffEvent(event);
  }
}

function onUpdatePersonal(trigger) {
  // console.log('On update event: ', event);
  const personalEvents = getCalendarEvents(personalCalId, new Date(), getRelativeDate(daysLookAhead, 0));
  console.log('Personal events: ', personalEvents.length);
  blockOffWorkCalendar(personalEvents)
}

function autoColorEvent(event) {
  if (event.status !== 'confirmed') {
    return // do nothing for cancelled events
  }

  const title = event.summary.toLowerCase()
  
  if (title.includes('unavailable') || title.includes('commute')) {
    event.colorId = UNAVAILABLE_COLOR
  } else if (title.includes('hold')) {
    event.colorId = HOLD_COLOR
  }

  if (event.colorId !== undefined && event.colorId > 0) {
    console.log('Setting color for event: ', event.title, ' color: ', event.colorId)
    Calendar.Events.update(event, workCalId, event.id)
  }
}

function onUpdateWork(trigger) {
  // get events updated in the last 10 seconds
  const events = Calendar.Events.list(workCalId, {
    orderBy: 'updated',
    updatedMin: new Date(Date.now() - 10*1000).toISOString(),
  })
  
  console.log('Processing work cal updates, length: ', events.items.length)

  events.items.forEach(autoColorEvent)
}
