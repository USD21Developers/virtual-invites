let table = null;
let hashBeforeSync = null;

function addDatatablesTranslationToCache() {
  return new Promise(async (resolve, reject) => {
    const cache = await caches.open("dynamic-cache");
    const translationFile = getDatatablesTranslationURL();
    const response = await fetch(translationFile);

    await cache.put(translationFile, response);

    resolve();
  });
}

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
      if (!invites || !invites.length) {
        hashBeforeSync = await invitesCrypto.hash(JSON.stringify([]));
        recipientsEl.classList.add("d-none");
        noRecipientsEl.classList.remove("d-none");
        return resolve();
      }
      const invitesLite = invites.map((item) => {
        return {
          eventid: item.eventid,
          utctime: item.utctime,
          recipient: {
            id: item.recipient.id,
            name: item.recipient.name,
          },
        };
      });
      hashBeforeSync = await invitesCrypto.hash(JSON.stringify(invitesLite));
      invites = invites.filter((item) => item.isDeleted === 0);
      invites = invites.sort((a, b) => {
        const maxUtcDateA = getMaxUtcDate(a.interactions);
        const maxUtcDateB = getMaxUtcDate(b.interactions);

        return new Date(maxUtcDateB) - new Date(maxUtcDateA);
      });
      let rows = "";

      invites.forEach((item) => {
        let lastInteractionUtcTime = item.utctime + "Z";
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
                    <small class="text-dark">${action}</small>
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

      const deleteInviteBtnContainerEl = document.querySelector(
        "#deleteInviteBtnContainer"
      );

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
                  deleteInviteBtnContainerEl.classList.remove("d-none");
                } else {
                  deleteInviteBtnEl.classList.add("d-none");
                  deleteInviteBtnEl.setAttribute("disabled", "");
                  deleteInviteBtnContainerEl.classList.add("d-none");
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

      table.order([2, "desc"]).draw();

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
  let ids = invitesToDelete
    .filter((item) => item.invitationid)
    .map((item) => item.invitationid);
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
    }).format(new Date(`${item.utctime}Z`));
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

  html = `<ol id="confirmInvitesToDelete" class="my-2 mb-1" data-quantity="${invitesToDelete.length}">${html}</ol>`;

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

async function onInvitesDeleteSubmitted(e) {
  const json = e.target["deletionIds"].value;

  e.preventDefault();

  if (!json.length) return;
  if (!navigator.onLine) {
    return showToast(getGlobalPhrase("youAreOffline"), 5000, "danger");
  }

  const ids = JSON.parse(json);
  const endpoint = `${getApiHost()}/delete-invites`;
  const accessToken = await getAccessToken();

  $("#deleteModal").modal("hide");

  globalShowPageSpinner();

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      ids: ids,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      // TODO:  handle potential errors

      // Happy path:
      syncInvites()
        .then(() => {
          window.location.reload();
        })
        .catch((error) => {
          console.error(error);
          globalHidePageSpinner();
        });
    })
    .catch((error) => {
      console.error(error);
      globalHidePageSpinner();
    });
}

function addEventListeners() {
  document
    .querySelector("#formDeleteInvites")
    .addEventListener("submit", onInvitesDeleteSubmitted);
}

async function init() {
  await populateContent();
  await populateRecipientsTable();

  globalHidePageSpinner();

  await addDatatablesTranslationToCache();

  addEventListeners();

  syncInvites().then(async (invitesObj) => {
    const { invites, changed } = invitesObj;
    const invitesLite = invites.map((item) => {
      return {
        eventid: item.eventid,
        utctime: item.utctime,
        recipient: {
          id: item.recipient.id,
          name: item.recipient.name,
        },
      };
    });
    const hashAfterSync = await invitesCrypto.hash(JSON.stringify(invitesLite));
    let mustReRendered = false;

    if (changed) mustReRendered = true;
    if (hashBeforeSync !== hashAfterSync) mustReRendered = true;

    if (mustReRendered) {
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
