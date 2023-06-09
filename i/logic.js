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

  eventTitleEl.innerHTML = event.title;

  if (isRecurring) {
    const timeAndDateRepeatingEl = document.querySelector(
      "#timeAndDateRepeating"
    );
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
  } else if (isMultiDay) {
    //
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
}

async function init() {
  showSpinner();
  await populateTemplate();
  attachListeners();
  await populateContent();
  await getInvite().catch((err) => console.error(err));
}

init();
