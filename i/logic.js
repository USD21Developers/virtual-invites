let inviteObject = {
  event: null,
  user: null,
  recipient: null,
};
let iti;

function buildCalendarDescription(event) {
  let locationName =
    event.locationvisibility === "public" && event.locationname
      ? event.locationname + "\n"
      : "";
  let locationAddress =
    event.locationvisibility === "public"
      ? getAddressForMaps(event).address + "\n\n"
      : "";
  let description = `${getPhrase("you-are-invited-to")}
${event.title.toUpperCase().trim() + "\n\n"}`;

  // BEGIN LOCATION
  if (locationName.length) {
    if (locationAddress.length) {
      description += `=====

${locationName}
${locationAddress}`;
    } else {
      description += `=====

${locationName}`;
    }
  } else if (locationAddress.length) {
    description += `=====

${locationAddress}`;
  }

  // BEGIN MAIN EVENT INFO
  const headlineAboutEvent = event.descriptionHeading;

  description += `=====

${headlineAboutEvent.toUpperCase()}

${event.description}
  `;
  description = description.trim();
  description = description + "\n\n";
  // END MAIN EVENT INFO

  // BEGIN RECURRING EVENT
  if (event.frequency !== "once") {
    description += `=====\n
${getPhrase("is-recurring")}
    `;
    description = description.trim();
    description = description + "\n\n";
  }
  // END RECURRING EVENT

  // BEGIN OTHER LOCATION DETAILS
  if (event.otherlocationdetails && event.locationvisibility !== "discreet") {
    const headlineLocationDetails = getPhrase("headlineLocationDetails");

    description += `=====

${headlineLocationDetails.toUpperCase()}

${event.otherlocationdetails}
    `;
    description = description.trim();
    description = description + "\n\n";
  }
  // END OTHER LOCATION DETAILS

  // BEGIN ATTENTING VIRTUALLY
  if (event.virtualconnectiondetails) {
    const attendOnline_headlineCantAttendInPerson = getPhrase(
      "cant-attend-in-person"
    );
    const attendOnline_text = getPhrase("text-connect");
    const attendOnline_headlineHowToConnect = getPhrase(
      "headline-how-to-connect"
    );
    const calAttendingVirtually = `=====

${attendOnline_headlineCantAttendInPerson.toUpperCase()}

${attendOnline_text}

${attendOnline_headlineHowToConnect.toUpperCase()}

${event.virtualconnectiondetails.trim()}
    `;
    description += calAttendingVirtually;
    description = description.trim();
    description = description + "\n\n";
  }
  // END ATTENDING VIRTUALLY

  // BEGIN CONTACT INFORMATION
  const headlineQuestions = getPhrase("headline-questions");
  const textQuestions =
    event.locationvisibility === "discreet"
      ? getPhrase("questionsPlusLocation")
      : getPhrase("questions");
  const labelPhoneCallOrTextMessage = getPhrase("phone-call-or-text-message");
  const labelEmail = getPhrase("email");

  description += `=====

${headlineQuestions.toUpperCase()}

${textQuestions}
  `;
  description = description.trim();
  description = description + "\n\n";

  // Contact Name
  description += `${event.contactfirstname.toUpperCase()} ${
    event.contactlastname && event.contactlastname.length
      ? event.contactlastname.toUpperCase()
      : ""
  }\n\n`;

  // Contact Phone or Text Message
  if (
    event.contactphone &&
    event.contactphone.length &&
    window.libphonenumber
  ) {
    const phoneNumberObject = window.libphonenumber.parsePhoneNumber(
      event.contactphone
    );
    const contactPhoneFormatted = phoneNumberObject.formatNational();
    description += `* ${labelPhoneCallOrTextMessage}\n${contactPhoneFormatted}\n\n`;
  }

  // Contact E-mail
  if (event.contactemail && event.contactemail.length) {
    description += `* ${labelEmail}:\n${event.contactemail}\n\n`;
  }

  // END CONTACT INFORMATION

  return description;
}

function getAddressForMaps(event) {
  const {
    locationaddressline1: addressLine1,
    locationaddressline2: addressLine2,
    locationaddressline3: addressLine3,
    locationcoordinates,
  } = event;
  let address = "";
  let addressLink = "";
  if (addressLine1) {
    address += addressLine1.trim();
    addressLink += encodeURIComponent(addressLine1.trim());
  }
  if (addressLine2) {
    if (addressLine1) {
      address += ", ";
      addressLink += ",";
    }
    address += addressLine2.trim();
    addressLink += encodeURIComponent(addressLine2.trim());
  }
  if (addressLine3) {
    if (addressLine1 || addressLine2) {
      address += ", ";
      addressLink += ",";
    }
    address += addressLine3.trim();
    addressLink += encodeURIComponent(addressLine3.trim());
  }

  const operatingSystem = getMobileOperatingSystem();
  const { x: latitude, y: longitude } = locationcoordinates;

  // Use Apple Maps if we're on iOS. For all other operating systems, use Google Maps.
  if (operatingSystem === "iOS") {
    // Docs for Apple Maps URLs:  https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html
    if (address.length > 0) {
      addressLink = `https://maps.apple.com/?daddr=${addressLink}&dirflg=d&t=m`;
    } else if (latitude.length > 0 && longitude.length > 0) {
      addressLink = `https://maps.apple.com/?ll=${latitude},${longitude}&t=m`;
    }
  } else {
    // Docs for Google Maps URLs:  https://developers.google.com/maps/documentation/urls
    if (address.length > 0) {
      addressLink = `https://www.google.com/maps/dir/?api=1&destination=${addressLink}&sensor=true`;
    } else if (latitude.length > 0 && longitude.length > 0) {
      addressLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    }
  }

  const returnObject = {
    address: address,
    addressLink: addressLink,
  };

  return returnObject;
}

function getCalendar(clickEvent, inviteEvent) {
  const {
    duration,
    durationInHours,
    frequency,
    locationvisibility,
    multidaybegindate,
    multidayenddate,
    startdate,
    timezone,
    title,
  } = inviteEvent;
  const description = buildCalendarDescription(inviteEvent);
  let locationObject = null;
  let location = "";
  let locationName = "";
  const isRecurring = frequency === "once" ? false : true;
  const isMultiDay = duration === "multiple days" ? true : false;
  let recurringWeekday;
  let eventStart;
  let eventEnd;
  let config;

  clickEvent.preventDefault();

  if (isRecurring) {
    const startDateUTC = moment(startdate).format("YYYY-MM-DD");
    const startTimeUTC = moment(startdate).format("HH:mm");
    const nextOccurrenceInTimezone = moment
      .tz(
        `${getNextRecurringWeekday(
          startDateUTC,
          startTimeUTC
        )}T${startTimeUTC}`,
        timezone
      )
      .format();
    eventStart = new Date(nextOccurrenceInTimezone);
    eventEnd = new Date(
      moment(eventStart).add(durationInHours, "hours").format()
    );

    switch (frequency) {
      case "Every Sunday":
        recurringWeekday = "SU";
        break;
      case "Every Monday":
        recurringWeekday = "MO";
        break;
      case "Every Tuesday":
        recurringWeekday = "TU";
        break;
      case "Every Wednesday":
        recurringWeekday = "WE";
        break;
      case "Every Thursday":
        recurringWeekday = "TH";
        break;
      case "Every Friday":
        recurringWeekday = "FR";
        break;
      case "Every Saturday":
        recurringWeekday = "SA";
        break;
    }

    if (locationvisibility !== "discreet") {
      locationObject = getAddressForMaps(inviteEvent);
      location =
        locationObject.address === ""
          ? locationObject.addressLink
          : locationObject.address;
      locationName = inviteEvent.locationname ? inviteEvent.locationname : "";
    }

    config = {
      title: title,
      location: `${locationName.length ? locationName + ", " : ""}${location}`,
      description: description,
      start: eventStart,
      end: eventEnd,
      recurrence: {
        frequency: "WEEKLY",
        interval: 1,
        weekdays: recurringWeekday,
        count: 12,
      },
    };
  } else if (!isMultiDay) {
    eventStart = new Date(moment(startdate).format());
    eventEnd = new Date(
      moment(eventStart).add(durationInHours, "hours").format()
    );

    if (locationvisibility !== "discreet") {
      locationObject = getAddressForMaps(inviteEvent);
      location =
        locationObject.address === ""
          ? locationObject.addressLink
          : locationObject.address;
      locationName = inviteEvent.locationname ? inviteEvent.locationname : "";
    }

    config = {
      title: title,
      location: `${locationName.length ? locationName + ", " : ""}${location}`,
      description: description,
      start: eventStart,
      end: eventEnd,
    };
  } else if (isMultiDay) {
    eventStart = new Date(multidaybegindate);
    eventEnd = new Date(multidayenddate);
    if (locationvisibility !== "discreet") {
      locationObject = getAddressForMaps(inviteEvent);
      location =
        locationObject.address === ""
          ? locationObject.addressLink
          : locationObject.address;
      locationName = inviteEvent.locationname ? inviteEvent.locationname : "";
    }
    config = {
      title: title,
      location: `${locationName.length ? locationName + ", " : ""}${location}`,
      description: description,
      start: eventStart,
      end: eventEnd,
    };
  }

  const calType = clickEvent.currentTarget.attributes["data-destination"].value;

  switch (calType) {
    case "apple":
      getCalendarApple(config);
      break;
    case "google":
      getCalendarGoogle(config);
      break;
    case "ical":
      getCalendarIcal(config);
      break;
  }
}

function getCalendarApple(config) {
  const {
    contactemail,
    contactfirstname,
    contactlastname,
    contactphone,
    timezone,
    title,
    descriptionHeading,
    description,
  } = inviteObject.event;
  const appleCal = new datebook.ICalendar(config);
  const alarm1Time = new Date(
    moment(config.start).subtract(1, "days").format()
  );
  const alarm2Time = new Date(
    moment(config.start).subtract(1, "hours").format()
  );
  const alarm1 = {
    action: "DISPLAY",
    trigger: alarm1Time,
    summary: title,
    description: `${descriptionHeading}\n\n${description}`,
    duration: {
      after: true,
      minutes: 3,
    },
  };
  const alarm2 = {
    action: "DISPLAY",
    trigger: alarm2Time,
    description: title,
    summary: `${descriptionHeading}\n\n${description}`,
    duration: {
      after: true,
      minutes: 3,
    },
  };

  const contactName = contactlastname
    ? `${contactfirstname} ${contactlastname}`
    : `${contactfirstname}`;

  const eventContact = contactphone ? `${contactName}, ${contactphone}` : null;

  const eventOrganizer = contactemail
    ? `CN=${contactName}:MAILTO:${contactemail}`
    : null;

  let appleCalContent;
  if (eventContact && eventOrganizer) {
    appleCalContent = appleCal
      .addAlarm(alarm1)
      .addAlarm(alarm2)
      .addProperty("TZID", timezone)
      .addProperty("CONTACT", eventContact)
      .addProperty("ORGANIZER", eventOrganizer)
      .render();
  } else if (eventContact) {
    appleCalContent = appleCal
      .addAlarm(alarm1)
      .addAlarm(alarm2)
      .addProperty("TZID", timezone)
      .addProperty("CONTACT", eventContact)
      .render();
  } else {
    appleCalContent = appleCal
      .addAlarm(alarm1)
      .addAlarm(alarm2)
      .addProperty("TZID", timezone)
      .render();
  }

  const appleCalLink = document.createElement("a");
  const appleCalFile = new Blob([appleCalContent], {
    type: "text/calendar",
  });
  appleCalLink.href = URL.createObjectURL(appleCalFile);
  appleCalLink.download = "appleCal.ics";
  appleCalLink.click();
  URL.revokeObjectURL(appleCalLink.href);
}

function getCalendarGoogle(config) {
  const googleCal = new datebook.GoogleCalendar(config);
  window.location.href = googleCal.render();
}

function getCalendarIcal(config) {
  const {
    contactemail,
    contactfirstname,
    contactlastname,
    contactphone,
    timezone,
    title,
    descriptionHeading,
    description,
  } = inviteObject.event;
  const iCal = new datebook.ICalendar(config);
  const alarm1Time = new Date(
    moment(config.start).subtract(1, "days").format()
  );
  const alarm2Time = new Date(
    moment(config.start).subtract(1, "hours").format()
  );
  const alarm1 = {
    action: "DISPLAY",
    trigger: alarm1Time,
    summary: title,
    description: `${descriptionHeading}\n\n${description}`,
    duration: {
      after: true,
      minutes: 3,
    },
  };
  const alarm2 = {
    action: "DISPLAY",
    trigger: alarm2Time,
    description: title,
    summary: `${descriptionHeading}\n\n${description}`,
    duration: {
      after: true,
      minutes: 3,
    },
  };

  const contactName = contactlastname
    ? `${contactfirstname} ${contactlastname}`
    : `${contactfirstname}`;

  const eventContact = contactphone ? `${contactName}, ${contactphone}` : null;

  const eventOrganizer = contactemail
    ? `CN=${contactName}:MAILTO:${contactemail}`
    : null;

  let iCalContent;
  if (eventContact && eventOrganizer) {
    iCalContent = iCal
      .addAlarm(alarm1)
      .addAlarm(alarm2)
      .addProperty("TZID", timezone)
      .addProperty("CONTACT", eventContact)
      .addProperty("ORGANIZER", eventOrganizer)
      .render();
  } else if (eventContact) {
    iCalContent = iCal
      .addAlarm(alarm1)
      .addAlarm(alarm2)
      .addProperty("TZID", timezone)
      .addProperty("CONTACT", eventContact)
      .render();
  } else {
    iCalContent = iCal
      .addAlarm(alarm1)
      .addAlarm(alarm2)
      .addProperty("TZID", timezone)
      .render();
  }

  const iCalLink = document.createElement("a");
  const iCalFile = new Blob([iCalContent], { type: "text/calendar" });
  iCalLink.href = URL.createObjectURL(iCalFile);
  iCalLink.download = "ical.ics";
  iCalLink.click();
  URL.revokeObjectURL(iCalLink.href);
}

async function getInvite() {
  return new Promise(async (resolve, reject) => {
    const hash = window.location.hash;
    let inviteParts = hash.split("/") || null;
    if (!inviteParts) {
      return reject(new Error("Required URL parameters are missing"));
    }
    if (!Array.isArray(inviteParts)) {
      return reject(new Error("URL parameters must be separated by slashes"));
    }
    if (!inviteParts.length) {
      return reject(new Error("At least one URL parameter is required"));
    }

    let eventid = Number(inviteParts[1]) || null;
    let userid = Number(inviteParts[2]) || null;
    let recipientid = inviteParts[3] || null;
    const userDateTimePrefs = Intl.DateTimeFormat().resolvedOptions();
    const timezone = userDateTimePrefs.timeZone || "";
    const emailHtml = await fetch("./sender-notification-email.html?v=1").then(
      (res) => res.text()
    );
    const emailPhrases = {
      "email-subject-viewed-invite": getPhrase("email-subject-viewed-invite"),
      "email-recipient-viewed-your-invite": getPhrase(
        "email-recipient-viewed-your-invite"
      ),
      "email-event-label": getPhrase("email-event-label"),
      "email-date-sent-label": getPhrase("email-date-sent-label"),
      "email-date-viewed-label": getPhrase("email-date-viewed-label"),
      "email-timezone": getPhrase("email-timezone"),
      "email-follow-up-link-text": getPhrase("email-follow-up-link-text"),
      "email-about-app-headline": getPhrase("email-about-app-headline"),
      "email-unsubscribe": getPhrase("email-unsubscribe"),
      "email-message-id-text": getPhrase("email-message-id-text"),
    };

    if (!eventid) return reject();

    const endpoint = `${getApiHost()}/invite`;

    showSpinner();

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        eventid: eventid,
        userid: userid,
        recipientid: recipientid,
        timezone: timezone,
        emailHtml: emailHtml,
        emailPhrases: emailPhrases,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const msg = data.msg;
        switch (msg) {
          case "invite retrieved":
            renderInvite(data.invite);
            resolve();
            break;
          default:
            showSpinner();
            reject();
        }
      })
      .catch((err) => {
        console.error(err);
        showSpinner();
      });
  });
}

function personalizeGreeting() {
  const { event, user, recipient } = inviteObject;

  if (event && user && recipient) {
    populateGreetingParagraph1();
  } else if (event && user) {
    console.warn("WARNING:  RECIPIENT IS UNKNOWN.");
    populateGreetingParagraph1UnknownRecipient();
  } else if (event) {
    console.warn("WARNING:  SENDER AND RECIPIENT ARE UNKNOWN.");
    populateGreetingParagraph1UnknownUser();
  } else {
    // Just show a spinner
    console.error("ERROR:  EVENT IS UNKNOWN. CANNOT DISPLAY ANYTHING.");
  }
}

function renderInvite(invite) {
  const { event, user, recipient } = invite;
  const eventTitleEl = document.querySelector("#eventTitle");
  const titleTagEl = document.querySelector("title");
  const isDiscreet = event.locationvisibility === "discreet" ? true : false;
  const isRecurring = event.frequency !== "once" ? true : false;
  const isSameDay = event.duration === "same day" ? true : false;
  const isMultiDay = event.duration === "multiple days" ? true : false;
  const userDateTimePrefs = Intl.DateTimeFormat().resolvedOptions();
  const timeAndDateRepeatingEl = document.querySelector(
    "#timeAndDateRepeating"
  );
  const timeAndDateSingleDayEl = document.querySelector(
    "#timeAndDateSingleDay"
  );
  const timeAndDateMultipleDays = document.querySelector(
    "#timeAndDateMultipleDays"
  );

  // Store invite in global scope
  inviteObject.event = event;
  inviteObject.user = user;
  inviteObject.recipient = recipient;

  // Hide by default
  timeAndDateRepeatingEl.classList.add("d-none");
  timeAndDateSingleDayEl.classList.add("d-none");
  timeAndDateMultipleDays.classList.add("d-none");
  implementDiscreetLocation(event);

  titleTagEl.innerText = event.title;
  eventTitleEl.innerHTML = event.title;

  // EVENT TIME AND DATE
  if (isRecurring) {
    const repeatingWeekdayEl =
      timeAndDateRepeatingEl.querySelector("#repeatingWeekday");
    const repeatingStartTimeEl = timeAndDateRepeatingEl.querySelector(
      "#repeatingStartTime"
    );

    // Populate recurring weekday
    const frequency = getRecurringWeekdayName(event.frequency);
    repeatingWeekdayEl.innerHTML = frequency;

    // Populate recurring start time
    const startDateUTC = moment(event.startdate).format("YYYY-MM-DD");
    const startTimeUTC = moment(event.startdate).format("HH:mm");
    const nextOccurrenceInTimezone = moment
      .tz(
        `${getNextRecurringWeekday(
          startDateUTC,
          startTimeUTC
        )}T${startTimeUTC}`,
        event.timezone
      )
      .format();

    const starttime = new Intl.DateTimeFormat(userDateTimePrefs.locale, {
      timeZone: event.timezone,
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(nextOccurrenceInTimezone));
    repeatingStartTimeEl.innerHTML = starttime;

    timeAndDateRepeatingEl.classList.remove("d-none");
  } else if (isSameDay) {
    const timeAndDateSingleDayEl = document.querySelector(
      "#timeAndDateSingleDay"
    );
    const singleDayWeekdayEl =
      timeAndDateSingleDayEl.querySelector("#singleDayWeekday");
    const singleDayDateEl =
      timeAndDateSingleDayEl.querySelector("#singleDayDate");
    const singleDayStartTimeEl = timeAndDateSingleDayEl.querySelector(
      "#singleDayStartTime"
    );

    // Populate one-time weekday
    const weekday = Intl.DateTimeFormat(userDateTimePrefs.locale, {
      timeZone: event.timezone,
      weekday: "long",
    }).format(new Date(event.startdate));
    singleDayWeekdayEl.innerHTML = weekday;

    // Populate one-time date
    const date = Intl.DateTimeFormat(userDateTimePrefs.locale, {
      timeZone: event.timezone,
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(event.startdate));
    singleDayDateEl.innerHTML = date;

    // Populate one-time start time
    const starttime = new Intl.DateTimeFormat(userDateTimePrefs.locale, {
      timeZone: event.timezone,
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(event.startdate));
    singleDayStartTimeEl.innerHTML = starttime;

    // Unhide
    timeAndDateSingleDayEl.classList.remove("d-none");
  } else if (isMultiDay) {
    const multiDayStartingWeekdayEl = timeAndDateMultipleDays.querySelector(
      "#multiDayStartingWeekday"
    );
    const multiDayStartingDateEl = timeAndDateMultipleDays.querySelector(
      "#multiDayStartingDate"
    );
    const multiDayStartingTimeEl = timeAndDateMultipleDays.querySelector(
      "#multiDayStartingTime"
    );
    const multiDayEndingWeekdayEl = timeAndDateMultipleDays.querySelector(
      "#multiDayEndingWeekday"
    );
    const multiDayEndingDateEl = timeAndDateMultipleDays.querySelector(
      "#multiDayEndingDate"
    );
    const multiDayEndingTimeEl = timeAndDateMultipleDays.querySelector(
      "#multiDayEndingTime"
    );
    const { multidaybegindate, multidayenddate } = event;

    // Populate beginning weekday
    const beginWeekday = Intl.DateTimeFormat(userDateTimePrefs.locale, {
      timeZone: event.timezone,
      weekday: "short",
    }).format(new Date(multidaybegindate));
    multiDayStartingWeekdayEl.innerHTML =
      userDateTimePrefs.locale.substring(0, 2) == "en"
        ? `${beginWeekday}.`
        : beginWeekday;

    // Populate beginning date
    const beginDate = Intl.DateTimeFormat(userDateTimePrefs.locale, {
      timeZone: event.timezone,
      year: "2-digit",
      month: "numeric",
      day: "numeric",
    }).format(new Date(multidaybegindate));
    multiDayStartingDateEl.innerHTML = beginDate;

    // Populate beginning time
    const beginTime = Intl.DateTimeFormat(userDateTimePrefs.locale, {
      timeZone: event.timezone,
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(multidaybegindate));
    multiDayStartingTimeEl.innerHTML = beginTime;

    // Populate ending weekday
    const endWeekday = Intl.DateTimeFormat(userDateTimePrefs.locale, {
      timeZone: event.timezone,
      weekday: "short",
    }).format(new Date(multidayenddate));
    multiDayEndingWeekdayEl.innerHTML =
      userDateTimePrefs.locale.substring(0, 2) == "en"
        ? `${endWeekday}.`
        : endWeekday;

    // Populate ending date
    const endDate = Intl.DateTimeFormat(userDateTimePrefs.locale, {
      timeZone: event.timezone,
      year: "2-digit",
      month: "numeric",
      day: "numeric",
    }).format(new Date(multidayenddate));
    multiDayEndingDateEl.innerHTML = endDate;

    // Populate ending time
    const endTime = Intl.DateTimeFormat(userDateTimePrefs.locale, {
      timeZone: event.timezone,
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(multidayenddate));
    multiDayEndingTimeEl.innerHTML = endTime;

    // Enforce location visibility
    const locationVisibility = event.locationvisibility || "discreet"; // [ public | discreet ]
    const inviteLocationInfoEl = document.querySelector("#inviteLocationInfo");
    const requestLocationInfoEl = document.querySelector(
      "#requestLocationInfo"
    );
    if (locationVisibility !== "public") {
      inviteLocationInfoEl.classList.add("d-none");
      requestLocationInfoEl.classList.remove("d-none");
    } else {
      inviteLocationInfoEl.classList.remove("d-none");
      requestLocationInfoEl.classList.add("d-none");
    }

    // unhide
    timeAndDateMultipleDays.classList.remove("d-none");
  }

  // POPULATE LOCATION
  if (!isDiscreet) {
    const inviteLocationNameEl = document.querySelector("#inviteLocationName");
    const eventAddressEl = document.querySelector("#eventAddress");
    const address_line_1_el = document.querySelector("#address_line_1");
    const address_line_2_el = document.querySelector("#address_line_2");
    const address_line_3_el = document.querySelector("#address_line_3");
    const locationName = event.locationname || "";
    const locationAddress1 = event.locationaddressline1 || "";
    const locationAddress2 = event.locationaddressline2 || "";
    const locationAddress3 = event.locationaddressline3 || "";
    const hasAddress =
      locationAddress1.length ||
      locationAddress2.length ||
      locationAddress3.length
        ? true
        : false;
    inviteLocationNameEl.innerHTML = locationName;
    if (hasAddress) {
      address_line_1_el.innerHTML = locationAddress1;
      address_line_2_el.innerHTML = locationAddress2;
      address_line_3_el.innerHTML = locationAddress3;
    } else {
      eventAddressEl.classList.add("d-none");
    }

    // OTHER LOCATION DETAILS
    const otherLocationDetailsEl = document.querySelector(
      "#previewOtherLocationDetails"
    );
    const otherLocationDetails = event.otherlocationdetails || "";
    if (otherLocationDetails.length) {
      otherLocationDetailsEl.innerHTML = otherLocationDetails;
      otherLocationDetailsEl.classList.remove("d-none");
    }

    // MAP AND DIRECTIONS
    const mapAndDirectionsEl = document.querySelector("#mapAndDirections");
    const addressObject = getAddressForMaps(event);
    mapAndDirectionsEl.setAttribute("href", addressObject.addressLink);
  }
}

function hideSpinner() {
  const spinnerEl = document.querySelector("#pageSpinner");
  const pageEl = document.querySelector("main");
  spinnerEl.classList.add("d-none");
  pageEl.classList.remove("d-none");
}

function showSpinner() {
  const spinnerEl = document.querySelector("#pageSpinner");
  const pageEl = document.querySelector("main");
  spinnerEl.classList.remove("d-none");
  pageEl.classList.add("d-none");
}

function populateEventDescription() {
  const descriptionHeadlineEl = document.querySelector("#headline-about-event");
  const eventDescriptionEl = document.querySelector("#eventDescription");
  const { descriptionHeading: descriptionHeadline, description } =
    inviteObject.event;
  const text = breakify(description);

  descriptionHeadlineEl.innerHTML = descriptionHeadline;
  eventDescriptionEl.innerHTML = text;
}

function populateGreetingParagraph1() {
  const defaultGreetingParagraph1El = document.querySelector(
    "#defaultGreetingParagraph1"
  );
  const {
    type: eventType,
    title: eventTitle,
    lang: eventLang,
    frequency,
    durationInHours,
    startdate,
    multidaybegindate,
    multidayenddate,
    timezone: eventTimeZone,
  } = inviteObject.event;
  const { invitedAt, recipientname, sharedfromtimezone } =
    inviteObject.recipient;
  const { firstname: senderFirstName, lastname: senderLastname } =
    inviteObject.user;
  const recipientDateTimePrefs = Intl.DateTimeFormat().resolvedOptions();
  const { locale, timeZone: recipientTimeZone } = recipientDateTimePrefs;
  const dateInvitedMoment = moment.tz(invitedAt, sharedfromtimezone);
  const dateNowMoment = moment().tz(recipientTimeZone);
  const daysAgo = moment.duration(dateInvitedMoment.diff(dateNowMoment))._data
    .days;
  const invitedDate = getRelativeDate(daysAgo, locale);
  const isRecurringEvent = frequency === "once" ? false : true;
  const isMultiDay = multidaybegindate ? true : false;
  let eventStartDateTime;
  let eventEndDateTime;

  if (isRecurringEvent) {
    eventStartDateTime = moment.tz(startdate, eventTimeZone).format();
    eventEndDateTime = moment
      .tz(eventStartDateTime, eventTimeZone)
      .add(durationInHours, "hours")
      .format();
    const firstOccurrence = {
      date: moment(eventStartDateTime).format("YYYY-MM-DD"),
      time: moment(eventStartDateTime).format("HH:mm"),
    };
    const nextOccurrenceDate = getNextRecurringWeekday(
      firstOccurrence.date,
      firstOccurrence.time
    );
    const nextOccurrenceStart = moment
      .tz(`${nextOccurrenceDate} ${firstOccurrence.time}`, eventTimeZone)
      .format();
    const nextOccurrenceEnd = moment(nextOccurrenceStart)
      .add(durationInHours, "hours")
      .format();
  } else if (!isMultiDay) {
    eventStartDateTime = moment.tz(startdate, eventTimeZone).format();
    eventEndDateTime = moment(eventStartDateTime)
      .add(durationInHours, "hours")
      .format();
  } else if (isMultiDay) {
    eventStartDateTime = moment.tz(multidaybegindate, eventTimeZone).format();
    eventEndDateTime = moment.tz(multidayenddate, eventTimeZone).format();
  }

  let text = "";

  if (eventType === "bible talk") {
    text = getPhrase("default-greeting-paragraph-1-bible-talk");
  } else if (eventType === "church") {
    text = getPhrase("default-greeting-paragraph-1-church");
  } else if (eventType === "other") {
    text = getPhrase("default-greeting-paragraph-1-other");
  }

  let canUseTitleCase = false;

  if (text.includes("{EVENT-TITLE}") && eventLang.substring(0, 2) === "en") {
    canUseTitleCase = true;
  }

  text = text.replaceAll("{RECIPIENT-NAME}", recipientname);
  text = text.replaceAll("{SENDER-FIRST-NAME}", senderFirstName);
  text = text.replaceAll("{INVITED-DATE}", invitedDate);
  text = canUseTitleCase
    ? text.replaceAll("{EVENT-TITLE}", eventTitle.toTitleCase())
    : text.replaceAll("{EVENT-TITLE}", eventTitle);
  text = text.replaceAll(
    "{EVENT-START-DATE}",
    Intl.DateTimeFormat(recipientDateTimePrefs.locale, {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date(eventStartDateTime))
  );
  text = text.replaceAll(
    "{EVENT-START-TIME}",
    Intl.DateTimeFormat(recipientDateTimePrefs.locale, {
      timeZone: recipientDateTimePrefs.timeZone,
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(eventStartDateTime))
  );

  defaultGreetingParagraph1El.innerHTML = text;
}

function populateGreetingParagraph1UnknownRecipient() {
  const defaultGreetingParagraph1El = document.querySelector(
    "#defaultGreetingParagraph1"
  );
  const {
    type: eventType,
    title: eventTitle,
    lang: eventLang,
    frequency,
    durationInHours,
    startdate,
    multidaybegindate,
    multidayenddate,
    timezone: eventTimeZone,
  } = inviteObject.event;
  const { firstname: senderFirstName, lastname: senderLastname } =
    inviteObject.user;
  const recipientDateTimePrefs = Intl.DateTimeFormat().resolvedOptions();
  const isRecurringEvent = frequency === "once" ? false : true;
  const isMultiDay = multidaybegindate ? true : false;
  let eventStartDateTime;
  let eventEndDateTime;

  if (isRecurringEvent) {
    eventStartDateTime = moment.tz(startdate, eventTimeZone).format();
    eventEndDateTime = moment
      .tz(eventStartDateTime, eventTimeZone)
      .add(durationInHours, "hours")
      .format();
    const firstOccurrence = {
      date: moment(eventStartDateTime).format("YYYY-MM-DD"),
      time: moment(eventStartDateTime).format("HH:mm"),
    };
    const nextOccurrenceDate = getNextRecurringWeekday(
      firstOccurrence.date,
      firstOccurrence.time
    );
    const nextOccurrenceStart = moment
      .tz(`${nextOccurrenceDate} ${firstOccurrence.time}`, eventTimeZone)
      .format();
    const nextOccurrenceEnd = moment(nextOccurrenceStart)
      .add(durationInHours, "hours")
      .format();
  } else if (!isMultiDay) {
    eventStartDateTime = moment.tz(startdate, eventTimeZone).format();
    eventEndDateTime = moment(eventStartDateTime)
      .add(durationInHours, "hours")
      .format();
  } else if (isMultiDay) {
    eventStartDateTime = moment.tz(multidaybegindate, eventTimeZone).format();
    eventEndDateTime = moment.tz(multidayenddate, eventTimeZone).format();
  }

  let text = "";

  if (eventType === "bible talk") {
    text = getPhrase(
      "default-greeting-paragraph-1-bible-talk-unknown-recipient"
    );
  } else if (eventType === "church") {
    text = getPhrase("default-greeting-paragraph-1-church-unknown-recipient");
  } else if (eventType === "other") {
    text = getPhrase("default-greeting-paragraph-1-other-unknown-recipient");
  }

  let canUseTitleCase = false;

  if (text.includes("{EVENT-TITLE}") && eventLang.substring(0, 2) === "en") {
    canUseTitleCase = true;
  }

  text = text.replaceAll("{SENDER-FIRST-NAME}", senderFirstName);
  text = canUseTitleCase
    ? text.replaceAll("{EVENT-TITLE}", eventTitle.toTitleCase())
    : text.replaceAll("{EVENT-TITLE}", eventTitle);
  text = text.replaceAll(
    "{EVENT-START-DATE}",
    Intl.DateTimeFormat(recipientDateTimePrefs.locale, {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date(eventStartDateTime))
  );
  text = text.replaceAll(
    "{EVENT-START-TIME}",
    Intl.DateTimeFormat(recipientDateTimePrefs.locale, {
      timeZone: recipientDateTimePrefs.timeZone,
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(eventStartDateTime))
  );

  defaultGreetingParagraph1El.innerHTML = text;
}

function populateGreetingParagraph1UnknownUser() {
  const defaultGreetingParagraph1El = document.querySelector(
    "#defaultGreetingParagraph1"
  );
  const {
    type: eventType,
    title: eventTitle,
    lang: eventLang,
    frequency,
    durationInHours,
    startdate,
    multidaybegindate,
    multidayenddate,
    timezone: eventTimeZone,
  } = inviteObject.event;
  const recipientDateTimePrefs = Intl.DateTimeFormat().resolvedOptions();
  const isRecurringEvent = frequency === "once" ? false : true;
  const isMultiDay = multidaybegindate ? true : false;
  let eventStartDateTime;
  let eventEndDateTime;

  if (isRecurringEvent) {
    eventStartDateTime = moment.tz(startdate, eventTimeZone).format();
    eventEndDateTime = moment
      .tz(eventStartDateTime, eventTimeZone)
      .add(durationInHours, "hours")
      .format();
    const firstOccurrence = {
      date: moment(eventStartDateTime).format("YYYY-MM-DD"),
      time: moment(eventStartDateTime).format("HH:mm"),
    };
    const nextOccurrenceDate = getNextRecurringWeekday(
      firstOccurrence.date,
      firstOccurrence.time
    );
    const nextOccurrenceStart = moment
      .tz(`${nextOccurrenceDate} ${firstOccurrence.time}`, eventTimeZone)
      .format();
    const nextOccurrenceEnd = moment(nextOccurrenceStart)
      .add(durationInHours, "hours")
      .format();
  } else if (!isMultiDay) {
    eventStartDateTime = moment.tz(startdate, eventTimeZone).format();
    eventEndDateTime = moment(eventStartDateTime)
      .add(durationInHours, "hours")
      .format();
  } else if (isMultiDay) {
    eventStartDateTime = moment.tz(multidaybegindate, eventTimeZone).format();
    eventEndDateTime = moment.tz(multidayenddate, eventTimeZone).format();
  }

  let text = "";

  if (eventType === "bible talk") {
    text = getPhrase(
      "default-greeting-paragraph-1-bible-talk-unknown-sender-unknown-recipient"
    );
  } else if (eventType === "church") {
    text = getPhrase(
      "default-greeting-paragraph-1-church-unknown-sender-unknown-recipient"
    );
  } else if (eventType === "other") {
    text = getPhrase(
      "default-greeting-paragraph-1-other-unknown-sender-unknown-recipient"
    );
  }

  let canUseTitleCase = false;

  if (text.includes("{EVENT-TITLE}") && eventLang.substring(0, 2) === "en") {
    canUseTitleCase = true;
  }

  text = canUseTitleCase
    ? text.replaceAll("{EVENT-TITLE}", eventTitle.toTitleCase())
    : text.replaceAll("{EVENT-TITLE}", eventTitle);
  text = text.replaceAll(
    "{EVENT-START-DATE}",
    Intl.DateTimeFormat(recipientDateTimePrefs.locale, {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date(eventStartDateTime))
  );
  text = text.replaceAll(
    "{EVENT-START-TIME}",
    Intl.DateTimeFormat(recipientDateTimePrefs.locale, {
      timeZone: recipientDateTimePrefs.timeZone,
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(eventStartDateTime))
  );

  defaultGreetingParagraph1El.innerHTML = text;
}

function populateHeadlineAboutEvent() {
  const headlineAboutEventEl = document.querySelector("#headline-about-event");
  const { title: eventTitle, lang: eventLang } = inviteObject.event;
  let text = getPhrase("headline-about-event");
  let canUseTitleCase = false;

  if (text.includes("{EVENT-TITLE}") && eventLang.substring(0, 2) === "en") {
    canUseTitleCase = true;
  }

  text = text.replaceAll("{EVENT-TITLE}", eventTitle);

  if (canUseTitleCase) {
    text = text.toTitleCase();
  }

  headlineAboutEventEl.innerHTML = text;
}

function populateQuestionsSection() {
  const eventContactNameEl = document.querySelector("#eventContactName");
  const contactViaSmsEl = document.querySelector("#contactViaSms");
  const contactViaPhoneEl = document.querySelector("#contactViaPhone");
  const contactViaEmailEl = document.querySelector("#contactViaEmail");
  const contactViaSmsContainerEl = document.querySelector(
    "#contactViaSmsContainer"
  );
  const contactViaPhoneContainerEl = document.querySelector(
    "#contactViaPhoneContainer"
  );
  const contactTelContainerEl = document.querySelector("#contactTelContainer");
  const contactViaEmailContainerEl = document.querySelector(
    "#contactViaEmailContainer"
  );
  const {
    contactemail,
    contactfirstname,
    contactlastname,
    contactphone,
    contactphonecountrydata,
  } = inviteObject.event;

  const contactName =
    contactlastname && contactlastname.length
      ? `${contactfirstname} ${contactlastname}`
      : contactfirstname;

  eventContactNameEl.innerHTML = contactName;

  if (contactphone) {
    contactViaSmsEl.setAttribute("href", `sms:${contactphone}`);
    contactViaPhoneEl.setAttribute("href", `tel:${contactphone}`);
  } else {
    contactTelContainerEl.classList.add("d-none");
    contactViaEmailContainerEl.classList.remove("col-sm-4");
  }

  if (contactemail) {
    contactViaEmailEl.setAttribute("href", `mailto:${contactemail}`);
  } else {
    contactViaEmailEl.classList.add("d-none");
    contactViaSmsContainerEl.classList.replace("col-sm-4", "col-sm-6");
    contactViaPhoneContainerEl.classList.replace("col-sm-4", "col-sm-6");
  }
}

function populateTemplate(version = "default") {
  return new Promise((resolve, reject) => {
    const path = `../templates/${version}/index.html`;
    fetch(path)
      .then((res) => res.text())
      .then((unparsed) => {
        const parser = new DOMParser();
        const parsed = parser.parseFromString(unparsed, "text/html");
        const templateContent = parsed.querySelector(".container");
        const el = document.querySelector("main");
        el.appendChild(templateContent);
        removeDefaultContent();
        resolve();
      });
  });
}

function removeDefaultContent() {
  document
    .querySelectorAll(".defaultContent")
    .forEach((item) => (item.innerHTML = ""));
}

function implementDiscreetLocation(event) {
  const inviteLocationInfo = document.querySelector("#inviteLocationInfo");
  const requestLocationInfo = document.querySelector("#requestLocationInfo");
  const isDiscreet = event.locationvisibility === "discreet" ? true : false;

  if (isDiscreet) {
    inviteLocationInfo.classList.add("d-none");
    requestLocationInfo.classList.remove("d-none");
  } else {
    inviteLocationInfo.classList.remove("d-none");
    requestLocationInfo.classList.add("d-none");
  }
}

function warnIfEventIsPast() {
  const expiredMessage = getPhrase("eventExpired");
  const { event } = inviteObject;
  const isRecurring = event.frequency === "once" ? false : true;

  if (!isRecurring) {
    const isPast = inviteObject.event.isPast === 1 ? true : false;
    if (isPast) {
      showToast(expiredMessage, 0, "danger");
    }
  }
}

function onClickAway(event) {
  const addToCalendar = document.querySelector("#addToCalendar");
  const clickedCalendar = addToCalendar.contains(event.target);
  const addToCalendarButton = addToCalendar.querySelector(
    "#addToCalendarButton"
  );
  if (!clickedCalendar) {
    $(".collapse").collapse("hide");
  }

  if (!clickedCalendar) {
    addToCalendarButton.classList.add("collapsed");
    addToCalendarButton.setAttribute("aria-expanded", "false");
  }
}

function onCalendarExpand() {
  const addToCalendar = document.querySelector("#addToCalendar");

  addToCalendar.scrollIntoView({ behavior: "smooth" });
}

function attachListeners() {
  window.addEventListener("hashchange", () => {
    window.location.reload();
  });

  document.addEventListener("click", onClickAway);

  document
    .querySelector("a[data-destination='apple']")
    .addEventListener("click", (clickEvent) =>
      getCalendar(clickEvent, inviteObject.event)
    );

  document
    .querySelector("a[data-destination='google']")
    .addEventListener("click", (clickEvent) =>
      getCalendar(clickEvent, inviteObject.event)
    );

  document
    .querySelector("a[data-destination='ical']")
    .addEventListener("click", (clickEvent) =>
      getCalendar(clickEvent, inviteObject.event)
    );

  $(".collapse").on("show.bs.collapse", onCalendarExpand);

  $(".collapse").on("hide.bs.collapse", () => {
    document.querySelector("#atcbOptions").classList.add("d-none");
  });

  $(".collapse").on("hidden.bs.collapse", () => {
    document.querySelector("#atcbOptions").classList.remove("d-none");
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      window.location.reload();
    }
  });
}

async function init() {
  showSpinner();
  await populateTemplate();
  attachListeners();
  await populateContent();
  await getInvite().catch((err) => console.error(err));
  personalizeGreeting();
  populateHeadlineAboutEvent();
  populateEventDescription();
  populateQuestionsSection();
  hideSpinner();
  warnIfEventIsPast();
}

init();
