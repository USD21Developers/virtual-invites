async function getEvent() {
  const eventid = Math.abs(parseInt(getHash()));
  if (typeof eventid !== "number") return;

  const events = await localforage.getItem("events") || [];
  if (!events) return;
  if (!Array.isArray(events)) return;
  if (!events.length) return;

  let event;
  for (i in events) {
    const evt = events[i];
    if (evt.eventid === eventid) {
      event = evt;
      break;
    }
  }
  if (typeof event !== "object") return;

  populateDetails(event);
}

async function populateDetails(data) {
  const pageSpinner = document.querySelector("#pageSpinner");
  const pageContent = document.querySelector("#pageContent");
  const details = document.querySelector("#eventdetails");
  const { country, eventid, frequency, lang, multidaybegindate, multidayenddate, startdate, timezone, title } = data;
  const locale = `${lang.toLowerCase()}-${country.toUpperCase()}`;
  const from = getPhrase("from");
  const to = getPhrase("to");
  let when = "";

  if (frequency === "once") {
    if (multidaybegindate) {
      const multidayBeginDateLocal = new Date(moment.tz(multidaybegindate, timezone).format());
      const multidayEndDateLocal = new Date(moment.tz(multidayenddate, timezone).format());
      const whenDateFrom = Intl.DateTimeFormat(locale, { dateStyle: 'short' }).format(multidayBeginDateLocal);
      const whenTimeFrom = Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(multidayBeginDateLocal);
      const whenDateTo = Intl.DateTimeFormat(locale, { dateStyle: 'short' }).format(multidayEndDateLocal);
      const whenTimeTo = Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(multidayEndDateLocal);
      when = `
        ${from} ${whenDateFrom} &bull; ${whenTimeFrom}<br>
        ${to} ${whenDateTo} &bull; ${whenTimeTo}<br>
      `;
    } else {
      const whenDateLocal = new Date(moment.tz(startdate, timezone).format());
      const whenDate = Intl.DateTimeFormat(locale, { dateStyle: 'short' }).format(whenDateLocal);
      const whenTime = Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(whenDateLocal);
      when = `
        ${whenDate} &bull; ${whenTime}
      `;
    }
  } else {
    let whenDate;
    switch (frequency) {
      case "Every Sunday":
        whenDate = getPhrase("frequencyEverySunday");
        break;
      case "Every Monday":
        whenDate = getPhrase("frequencyEveryMonday");
        break;
      case "Every Tuesday":
        whenDate = getPhrase("frequencyEveryTuesday");
        break;
      case "Every Wednesday":
        whenDate = getPhrase("frequencyEveryWednesday");
        break;
      case "Every Thursday":
        whenDate = getPhrase("frequencyEveryThursday");
        break;
      case "Every Friday":
        whenDate = getPhrase("frequencyEveryFriday");
        break;
      case "Every Saturday":
        whenDate = getPhrase("frequencyEverySaturday");
        break;
    }
    const whenTimeLocal = new Date(moment.tz(startdate, timezone).format());
    const whenTime = Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(whenTimeLocal);
    when = `${whenDate} &bull; ${whenTime}`;
  }

  details.innerHTML = `
    <h3>${title}</h3>
    ${when}
  `;

  await populateContent();
  pageSpinner.classList.add("d-none");
  pageContent.classList.remove("d-none");
}

function spinner(action = "show") {
  const actionButtons = document.querySelector("#actionbuttons");
  const progressBar = document.querySelector("#progressbar");

  if (action === "show") {
    actionButtons.classList.add("d-none");
    progressBar.classList.remove("d-none");
  } else if (action === "hide") {
    actionButtons.classList.remove("d-none");
    progressBar.classList.add("d-none");
  }
}

async function onSubmit() {
  const eventid = Math.abs(parseInt(getHash()));
  const endpoint = `${getApiHost()}/event-delete`;
  const accessToken = await getAccessToken();
  const controller = new AbortController();

  if (typeof eventid !== "number") return;

  spinner("show");

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      eventid: eventid
    }),
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`
    }),
    signal: controller.signal
  })
    .then(res => res.json())
    .then(async (data) => {
      switch (data.msg) {
        case "user is not authorized for this action":
          break;
        case "unable to delete event":
          break;
        case "event not found":
          break;
        case "event not created by user":
          break;
        case "event deleted":
          await localforage.setItem("events", data.events);
          window.location.href = "../";
          break;
      }
    })
    .catch(err => {
      console.error(err);
      spinner("hide");
    });

  setTimeout(() => {
    controller.abort();

    // TODO:  handle timeout

    spinner("hide");
  }, 8000);
}

function attachListeners() {
  document.querySelector("#btnDelete").addEventListener("click", onSubmit);
}

async function init() {
  await populateContent();
  await getEvent();
  attachListeners();
  globalHidePageSpinner();
}

init();