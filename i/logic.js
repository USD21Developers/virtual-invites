async function getInvite() {
  return new Promise((resolve, reject) => {
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
            break;
          default:
            showSpinner();
        }
      })
      .catch((err) => {
        console.error(err);
        showSpinner();
      });
  });
}

function renderInvite(invite) {
  const { event, user, recipient } = invite;
  const eventTitleEl = document.querySelector("#eventTitle");
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

  // Hide by default
  timeAndDateRepeatingEl.classList.add("d-none");
  timeAndDateSingleDayEl.classList.add("d-none");
  timeAndDateMultipleDays.classList.add("d-none");

  eventTitleEl.innerHTML = event.title;

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
    const starttime = new Intl.DateTimeFormat(userDateTimePrefs.locale, {
      timeZone: event.timezone,
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(event.startdate));
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
    timeAndDateRepeatingEl.classList.remove("d-none");
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

    // Populate location
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

    // Other location details
    const otherLocationDetailsEl = document.querySelector(
      "#previewOtherLocationDetails"
    );
    const otherLocationDetails = event.otherlocationdetails || "";
    if (otherLocationDetails.length) {
      otherLocationDetailsEl.innerHTML = otherLocationDetails;
      otherLocationDetailsEl.classList.remove("d-none");
    }

    // Map and Directions
    const mapAndDirectionsEl = document.querySelector("#mapAndDirections");
    const locationcoordinates = event.locationcoordinates || null;
    const { x: latitude, y: longitude } = locationcoordinates;
    const operatingSystem = getMobileOperatingSystem();
    let address = "";
    let addressLink = "";
    if (locationAddress1.length) {
      address += locationAddress1.trim();
      addressLink += encodeURIComponent(locationAddress1.trim());
    }
    if (locationAddress2.length) {
      address += ", ";
      addressLink += ",";
      address += locationAddress2.trim();
      addressLink += encodeURIComponent(locationAddress2.trim());
    }
    if (locationAddress3.length) {
      if (locationAddress1.length || locationAddress2.length) {
        address += ", ";
        addressLink += ",";
      }
      address += locationAddress3.trim();
      addressLink += encodeURIComponent(locationAddress3.trim());
    }
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
    mapAndDirectionsEl.setAttribute("href", addressLink);

    // unhide
    timeAndDateMultipleDays.classList.remove("d-none");
  }

  hideSpinner();
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
        resolve();
      });
  });
}

function onAddToCalendarClick(e) {
  e.preventDefault();
  console.log("Add to Calendar clicked");
}

function attachListeners() {
  document
    .querySelector("#addToCalendarButton")
    .addEventListener("click", onAddToCalendarClick);

  window.addEventListener("hashchange", () => {
    window.location.reload();
  });
}

async function init() {
  showSpinner();
  await populateTemplate();
  attachListeners();
  await populateContent();
  await getInvite().catch((err) => console.error(err));
}

init();
