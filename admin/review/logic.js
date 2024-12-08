let table = null;

function addDatatablesTranslationToCache() {
  return new Promise(async (resolve, reject) => {
    const cache = await caches.open("dynamic-cache");
    const translationFile = getDatatablesTranslationURL();
    const response = await fetch(translationFile);

    await cache.put(translationFile, response);

    resolve();
  });
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

function populatePhotosPendingReview() {
  return new Promise(async (resolve, reject) => {
    const endpoint = `${getApiHost()}/photos-pending-review`;
    const accessToken = await getAccessToken();

    fetch(endpoint, {
      mode: "cors",
      method: "post",
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const { photos } = data;

        if (!photos) return resolve([]);
        if (!Array.isArray(photos))
          return reject(new Error("photos must be an array of objects"));

        if (photos.length === 0) {
          reviewLinkEl.classList.add("d-none");
          return resolve([]);
        }

        renderPhotos(photos);

        return resolve(photos);
      })
      .catch((error) => {
        console.error(error);
      });
  });
}

function renderPhotos(photos) {
  const photosEl = document.querySelector("#photos");

  photos.forEach((item) => {
    const {
      createdAt,
      firstname,
      gender,
      lastname,
      profilephoto,
      updatedAt,
      userid,
      userstatus,
      usertype,
    } = item;
    const profilePhoto140 = profilephoto.replaceAll("__400.jpg", "__140.jpg");
    const photoNode = document.createElement("div");
    photoNode.setAttribute("class", "col text-center");
    photoNode.innerHTML = `
      <a href="#" class="thumbnail" data-userid="${userid}">
        <img src="${profilePhoto140}" width="70" height="70" alt="${firstname} ${lastname}" />
        <br><small>${firstname} ${lastname}</small>
      </a>
    `;

    photosEl.appendChild(photoNode);
  });
}

function onThumbClicked(e) {
  e.preventDefault();
}

function attachListeners() {
  document.querySelectorAll(".thumbnail").forEach((item) => {
    item.addEventListener("click", onThumbClicked);
  });
}

async function init() {
  await populateContent();
  await populatePhotosPendingReview();

  // await populateRecipientsTable();
  // await addDatatablesTranslationToCache();

  attachListeners();
  globalHidePageSpinner();
}

init();
