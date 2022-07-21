function renderEvents() {
  return new Promise((resolve, reject) => {
    localforage.getItem("events")
      .then((json) => {
        const myEvents = JSON.parse(json);
        const el = document.querySelector("#myEvents");
        let eventsHTML = "";
        if (!Array.isArray(myEvents)) return resolve();
        if (!myEvents.length) return resolve();
        myEvents.forEach((myEvent) => {
          const { country, lang, eventid, frequency, multidayBeginDate, multidayEndDate, startdate, timezone, title } = myEvent;
          const locale = `${lang.toLowerCase()}-${country.toUpperCase()}`;
          const from = getPhrase("from");
          const to = getPhrase("to");
          let when = "";

          if (frequency === "once") {
            if (multidayBeginDate) {
              const multidayBeginDateLocal = new Date(moment.tz(multidayBeginDate, timezone).format());
              const multidayEndDateLocal = new Date(moment.tz(multidayEndDate, timezone).format());
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
            let whenDate = "";
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

          const template = `
            <div class="row border-bottom pb-2 mb-2">
              <div class="col-12 col-md-8 mb-3 pl-0">
                <strong>${title}</strong>
                <div class="small secondary">${when}</div>
              </div>
              <div class="col col-md-4 text-right text-nowrap">
                <a
                  href="edit/#${eventid}"
                  class="action_editLink small d-inline-block text-center"
                >
                  <span class="material-icons material-symbols-outlined">
                    edit
                  </span>
                  <div class="mt-1 small" data-i18n="btnEdit"></div>
                </a>

                <a
                  href="delete/#${eventid}"
                  class="action_deleteLink small danger d-inline-block text-center"
                >
                  <span class="material-icons material-symbols-outlined">
                    delete
                  </span>
                  <div class="mt-1 small" data-i18n="btnDelete"></div>
                </a>
              </div>
            </div>
          `;
          eventsHTML += template;
        });
        el.innerHTML = eventsHTML;
        showMaterialIcons();
        resolve(myEvents);
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
}

async function syncEvents() {
  const endpoint = `${getAPIHost()}/invites/sync-events`;
  const accessToken = await getAccessToken();
  const phraseEventsWereUpdated = getPhrase("eventsWereUpdated");
  const isOnline = navigator.onLine;

  return new Promise((resolve, reject) => {
    if (!isOnline) return reject(new Error("sync failed because user is offline"));

    fetch(endpoint, {
      mode: "cors",
      method: "GET",
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`
      })
    })
      .then((res) => res.json())
      .then(async (data) => {
        const { events } = data;
        const eventsLocal = await localforage.getItem("events");
        const eventsRemote = JSON.stringify(events);
        const hash = {};

        // Validate sync response
        if (!Array.isArray(events)) {
          hideToast();
          reject(new Error("Events in sync response must be an array."));
        }

        await localforage.setItem("events", eventsRemote);

        // Compare local vs. remote events, and update the UI only if a change occurred
        hash.local = await invitesCrypto.hash(eventsLocal) || JSON.stringify([]);
        hash.remote = await invitesCrypto.hash(eventsRemote) || JSON.stringify([]);

        hideToast();

        // Respond to new data
        if (hash.local !== hash.remote) {
          const numCurrentEvents = (eventsLocal) ? JSON.parse(eventsLocal).length : 0;

          if (numCurrentEvents === 0) {
            await renderEvents();
          } else {
            showToast(phraseEventsWereUpdated, 0);
          }
        }

        resolve(data);
      })
      .catch((err) => {
        console.error(err);
        hideToast();
        reject(err);
      });
  });
}

async function init() {
  await populateContent();
  await renderEvents();
  await populateContent();
  syncEvents();
}

init();
