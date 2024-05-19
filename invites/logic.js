let table = null;

function getMaxUtcDate(interactions) {
  if (interactions.length === 0) return "1970-01-01T00:00:00Z"; // Default date for no interactions
  return interactions.reduce((maxDate, interaction) => {
    return interaction.utcdate > maxDate ? interaction.utcdate : maxDate;
  }, interactions[0].utcdate);
}

function populateRecipientsTable() {
  return new Promise(async (resolve, reject) => {
    const recipientsEl = document.querySelector("#recipients");
    const noRecipientsEl = document.querySelector("#norecipients");
    const userDateTimePrefs = Intl.DateTimeFormat().resolvedOptions();
    const translationURL = getDatatablesTranslationURL();
    const languageData = await fetch(translationURL).then((res) => res.json());
    localforage.getItem("invites").then((invites) => {
      if (!invites.length) {
        recipientsEl.classList.add("d-none");
        noRecipientsEl.classList.remove("d-none");
        return resolve();
      }
      invites = invites.filter((item) => !!!item.deleted);
      invites = invites.sort((a, b) => {
        const maxUtcDateA = getMaxUtcDate(a.interactions);
        const maxUtcDateB = getMaxUtcDate(b.interactions);

        return new Date(maxUtcDateB) - new Date(maxUtcDateA);
      });
      let rows = "";

      invites.forEach((item) => {
        let lastInteractionUtcTime = item.utctime;
        let lastInteractionTimezone = item.timezone;
        let action = getPhrase("wasInvited");

        if (item.interactions.length) {
          lastInteractionUtcTime = getMaxUtcDate(item.interactions);
          const lastInteractionObj = item.interactions.find(
            (item) => item.utcdate === lastInteractionUtcTime
          );
          lastInteractionTimezone = lastInteractionObj.recipienttimezone;
          switch (lastInteractionObj.action) {
            case "viewed invite":
              action = getPhrase("viewedInvite");
              break;
            case "added to calendar":
              action = getPhrase("clickedAddToCalendar");
              break;
            case "rsvp":
              action = getPhrase("clickedRsvp");
              break;
            case "rescinded rsvp":
              action = getPhrase("rescindedRsvp");
              break;
          }
        }

        if (!lastInteractionUtcTime) return resolve(invites);

        const epochTime = new Date(lastInteractionUtcTime).getTime();
        const recipientName = item.recipient.name;
        const invitationid = item.invitationid;

        const localDateTime = Intl.DateTimeFormat(userDateTimePrefs.locale, {
          month: "long",
          day: "numeric",
          year: "numeric",
          timeZone: userDateTimePrefs.timeZone,
        }).format(new Date(lastInteractionUtcTime));

        if (!recipientName) return resolve(invites);

        const row = `
              <tr>
                <td data-search="${recipientName}">
                  <a href="../r/#/${invitationid}">${recipientName}</a>
                </td>
      
                <td
                  data-order="${epochTime}"
                  data-search="${action}"
                >
                  ${localDateTime}
                  <div>
                    <small class="text-secondary">${action}</small>
                  </div>
                </td>
              </tr>
            `;

        rows += row;
      });

      if (rows === "") {
        recipientsEl.classList.add("d-none");
        noRecipientsEl.classList.remove("d-none");
        return resolve(invites);
      }

      recipientsEl.querySelector("tbody").innerHTML = rows;

      if (!table) {
        table = $("#recipients").DataTable({
          language: languageData,
          order: [[1, "desc"]],
        });
      } else {
        if ($.fn.DataTable.isDataTable("#recipients")) {
          table.draw();
        }
      }

      noRecipientsEl.classList.add("d-none");
      recipientsEl.classList.remove("d-none");

      return resolve(invites);
    });
  });
}

async function init() {
  await populateContent();
  globalHidePageSpinner();
  await populateRecipientsTable();

  syncInvites().then(() => {
    populateRecipientsTable();
  });
}

init();
