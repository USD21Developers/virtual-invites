let table = null;
let hashBeforeSync = null;

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
    const deleteInviteBtnEl = document.querySelector("#deleteInviteBtn");

    localforage.getItem("invites").then(async (invites) => {
      if (!invites.length) {
        hashBeforeSync = await invitesCrypto.hash(JSON.stringify([]));
        recipientsEl.classList.add("d-none");
        noRecipientsEl.classList.remove("d-none");
        return resolve();
      }
      hashBeforeSync = await invitesCrypto.hash(JSON.stringify(invites));
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
                <td class="px-2">
                  ${invitationid}
                </td>
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

      table = $("#recipients").DataTable({
        language: languageData,
        columnDefs: [
          {
            targets: 0,
            checkboxes: {
              selectRow: true,
              selectCallback: (nodes, selected) => {
                let atLeastOneSelected = false;
                document.querySelectorAll(".dt-checkboxes").forEach((item) => {
                  if (item.checked) {
                    atLeastOneSelected = true;
                  }
                });
                if (atLeastOneSelected) {
                  deleteInviteBtnEl.classList.remove("d-none");
                  deleteInviteBtnEl.removeAttribute("disabled");
                } else {
                  deleteInviteBtnEl.classList.add("d-none");
                  deleteInviteBtnEl.setAttribute("disabled", "");
                }
              },
            },
          },
        ],
        order: [[1, "desc"]],
        select: {
          style: "multi",
        },
      });

      $("#deleteInviteBtn").on("click", () => {
        const selected_rows = table.column(0).checkboxes.selected();
        const ids = [];

        $.each(selected_rows, (key, invitationid) => {
          ids.push(Number(invitationid));
        });

        showConfirmDeleteModal(ids);
      });

      noRecipientsEl.classList.add("d-none");
      recipientsEl.classList.remove("d-none");
      deleteInviteBtnEl.classList.remove("d-none");

      return resolve(invites);
    });
  });
}

async function showConfirmDeleteModal(invitationIds) {
  const modal = document.querySelector("#deleteModal");
  const invites = await localforage.getItem("invites");
  const invitesToDelete = invites.filter((item) =>
    invitationIds.includes(item.invitationid)
  );
  const ids = invitesToDelete.filter((item) => item.invitationid);
  let html = "";

  if (invitesToDelete.length === 1) {
    document.querySelector("[data-i18n='deleteAreYouSure']").innerHTML =
      getPhrase("deleteAreYouSure1");
  }

  invitesToDelete.forEach((item) => {
    const userDateTimePrefs = Intl.DateTimeFormat().resolvedOptions();
    const dateInvited = Intl.DateTimeFormat(userDateTimePrefs.locale, {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: userDateTimePrefs.timeZone,
    }).format(new Date(item.utctime));
    const whenInvitedPhrase = getPhrase("invitedOn").replaceAll(
      "{DATETIME}",
      dateInvited
    );

    html += `
      <li class="mb-3">
        <a href="/r/#/${item.invitationid}" class="font-weight-bold text-primary underline">
          ${item.recipient.name}
        </a>
        <div class="text-dark small">
          ${whenInvitedPhrase}
        </div>
  </li>
    `;
  });

  html = `<ol class="my-2 mb-1">${html}</ol>`;

  modal.querySelector(".modal-body blockquote").innerHTML = html;

  $("#deleteModal").on("shown.bs.modal", (e) => {
    const el = document.querySelector("#deletionIds");
    if (el) {
      el.value = JSON.stringify(ids);
    }
  });
  $("#deleteModal").on("hide.bs.modal", (e) => {
    const el = document.querySelector("#deletionIds");
    if (el) {
      el.value = "";
    }
  });
  $("#deleteModal").modal();
}

async function onInvitesDelete() {
  const ids = inviteIdsToDelete ? inviteIdsToDelete : null;
  const deleteInviteBtnEl = document.querySelector("#deleteInviteBtn");
  if (!ids || !ids.length) return;

  // TODO:  delete stuff

  // Cleanup
  // deleteInviteBtnEl.setAttribute("disabled", "");
  // $("#deleteModal").modal("hide");
  window.location.reload();
}

function addEventListeners() {
  document
    .querySelector("#confirmDeleteButton")
    .addEventListener("click", onInvitesDelete);
}

async function init() {
  await populateContent();
  globalHidePageSpinner();
  await populateRecipientsTable();

  addEventListeners();

  syncInvites().then(async (invitesObj) => {
    const { invites, changed } = invitesObj;
    const hashAfterSync = await invitesCrypto.hash(JSON.stringify(invites));
    let mustReRender = false;

    if (changed) mustReRender = true;
    if (hashBeforeSync !== hashAfterSync) mustReRender = true;

    if (mustReRender) {
      if (table) {
        table.destroy();
        await populateRecipientsTable();
      } else {
        window.location.reload();
      }
    }
  });
}

init();
