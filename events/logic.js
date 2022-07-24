function renderEvents() {
  const pageSpinner = document.querySelector("#pageSpinner");
  const pageContent = document.querySelector("#pageContent");
  return new Promise((resolve, reject) => {
    localforage.getItem("events")
      .then((myEvents) => {
        const el = document.querySelector("#myEvents");
        let eventsHTML = "";
        if (!Array.isArray(myEvents)) return resolve();
        if (!myEvents.length) return resolve();
        myEvents.forEach((myEvent) => {
          const { country, lang, eventid, frequency, multidaybegindate, multidayenddate, startdate, timezone, title, locationname, locationaddressline1, locationaddressline2, locationaddressline3 } = myEvent;
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
              <div class="col-8 mb-3 pl-0">
                <strong>${title}</strong>
                <div class="small secondary">${when}</div>
                <div class="small text-secondary">
                  ${locationname && locationname.length ? locationname + "<br>" : ""}
                  ${locationaddressline1 && locationaddressline1.length ? locationaddressline1 : ""}
                  ${locationaddressline2 && locationaddressline2.length ? "<br>" + locationaddressline2 : ""}
                  ${locationaddressline3 && locationaddressline3.length ? "<br>" + locationaddressline3 : ""}
                </div>
              </div>
              <div class="col-4 text-right text-nowrap px-0">
                <a
                  href="edit/#${eventid}"
                  class="action_editLink d-inline-block text-center"
                >
                  <span class="material-icons material-symbols-outlined">
                    edit
                  </span>
                  <div class="mt-1 small" data-i18n="btnEdit"></div>
                </a>

                <a
                  href="delete/#${eventid}"
                  class="action_deleteLink danger d-inline-block text-center"
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
      }).finally(() => {
        pageSpinner.classList.add("d-none");
        pageContent.classList.remove("d-none");
      });
  });
}

async function syncEvents() {
  const endpoint = `${getApiHost()}/sync-events`;
  const accessToken = await getAccessToken();
  const phraseEventsWereUpdatedReload = getPhrase("eventsWereUpdatedReload");
  const phraseEventsSynced = getPhrase("eventsSynced");
  const isOnline = navigator.onLine;
  const myEventsEl = document.querySelector("#myEvents");
  const pageSpinner = document.querySelector("#pageSpinner");
  const pageContent = document.querySelector("#pageContent");

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
        let localEvents = await localforage.getItem("events") || [];

        // Validate sync response
        if (!Array.isArray(events)) {
          hideToast();
          reject(new Error("Events in sync response must be an array."));
        }

        // Compare local vs. remote events, and update the UI only if a change occurred
        const hash = {};
        const eventsLocalJSON = JSON.stringify(localEvents);
        const eventsRemoteJSON = JSON.stringify(events);
        hash.local = await invitesCrypto.hash(eventsLocalJSON) || JSON.stringify([]);
        hash.remote = await invitesCrypto.hash(eventsRemoteJSON) || JSON.stringify([]);

        hideToast();

        // Update IDB
        if (events.length) {
          await localforage.setItem("events", events);
        } else {
          await localforage.setItem("events", []);
        }

        // Update the view if events have changed
        if (hash.local !== hash.remote) {
          pageContent.classList.add("d-none");
          pageSpinner.classList.remove("d-none");
          if (events.length) {
            setTimeout(async () => {
              await renderEvents();
              pageContent.classList.remove("d-none");
              pageSpinner.classList.add("d-none");
              showToast(phraseEventsSynced, 2000);
            }, 1000);
          } else {
            if (localEvents.length) {
              setTimeout(() => {
                myEventsEl.innerHTML = "";
                pageContent.classList.remove("d-none");
                pageSpinner.classList.add("d-none");
                showToast(phraseEventsSynced, 2000);
              }, 1000);
            } else {
              showToast(phraseEventsWereUpdatedReload, 0);
            }
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
