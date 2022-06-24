function renderEvents() {
  const locale = getLocale();
  return new Promise((resolve, reject) => {
    localforage.getItem("events")
      .then((myEvents) => {
        const el = document.querySelector("#myEvents");
        let eventsHTML = "";
        if (!Array.isArray(myEvents)) return;
        if (!myEvents.length) return;
        myEvents.forEach((myEvent) => {
          const { eventid, frequency, multidayBeginDate, multidayEndDate, startdate, timezone, title } = myEvent;
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
                From ${whenDateFrom} &bull; ${whenTimeFrom}<br>
                To ${whenDateTo} &bull; ${whenTimeTo}<br>
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
            const whenDate = frequency;
            const whenTimeLocal = new Date(moment.tz(startdate, timezone).format());
            const whenTime = Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(whenTimeLocal);
            when = `${whenDate} &bull; ${whenTime}`;
          }

          const template = `
            <div class="container">
              <div class="row border-bottom pb-2">
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
                    <div class="mt-1 small">Edit</div>
                  </a>

                  <a
                    href="delete/#${eventid}"
                    class="action_deleteLink small danger d-inline-block text-center"
                  >
                    <span class="material-icons material-symbols-outlined">
                      delete
                    </span>
                    <div class="mt-1 small">Delete</div>
                  </a>
                </div>
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

function attachListeners() {
  //
}

async function init() {
  await populateContent();
  await renderEvents();
  attachListeners();
}

init();
