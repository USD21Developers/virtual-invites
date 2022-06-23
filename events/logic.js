function renderEvents() {
  const timezone = moment.tz.guess();
  return new Promise((resolve, reject) => {
    localforage.getItem("events")
      .then((myEvents) => {
        // console.log(myEvents);
        const el = document.querySelector("#myEvents");
        let eventsHTML = "";
        if (!Array.isArray(myEvents)) return;
        if (!myEvents.length > 0) return;
        myEvents.forEach((myEvent) => {
          const { eventid, frequency, multidayBeginDate, multidayEndDate, startdate, title } = myEvent;
          let when = "";

          if (frequency === "once") {
            if (multidayBeginDate) {
              const whenDateFrom = moment.tz(multidayBeginDate, timezone).format("MMMM d, yyyy");
              const whenTimeFrom = moment.tz(multidayBeginDate, timezone).format("h:mm A");
              const whenDateTo = moment.tz(multidayEndDate, timezone).format("MMMM d, yyyy");
              const whenTimeTo = moment.tz(multidayEndDate, timezone).format("h:mm A");
              when = `
                From ${whenDateFrom} &bull; ${whenTimeFrom}<br>
                To ${whenDateTo} &bull; ${whenTimeTo}<br>
              `;
            } else {
              const whenDate = moment.tz(startdate, timezone).format("MMMM d, yyyy");
              const whenTime = moment.tz(startdate, timezone).format("h:mm A");
              when = `
                ${whenDate} &bull; ${whenTime}
              `;
            }
          } else {
            const whenDate = frequency;
            const whenTime = moment.tz(startdate, timezone).format("h:mm A");
            when = `${whenDate} &bull; ${whenTime}`;
          }

          const template = `
            <div class="row">
              <div class="col col-md-8 offset-md-2">
                <strong>${title}</strong>
                <div class="small secondary">${when}</div>
                <div class="my-2 action">
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
