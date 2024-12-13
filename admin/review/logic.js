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
        const photosContainerEl = document.querySelector("#photosContainer");
        const noPhotosEl = document.querySelector("#nophotos");
        const { photos } = data;

        if (!photos) {
          photosContainerEl.classList.add("d-none");
          noPhotosEl.classList.remove("d-none");
          return resolve([]);
        }

        if (!Array.isArray(photos)) {
          photosContainerEl.classList.add("d-none");
          noPhotosEl.classList.remove("d-none");
          return reject(new Error("photos must be an array of objects"));
        }

        if (!photos.length) {
          photosContainerEl.classList.add("d-none");
          noPhotosEl.classList.remove("d-none");
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
  const photosContainerEl = document.querySelector("#photosContainer");
  const explanationEl = document.querySelector("#explanation");
  const userDateTimePrefs = Intl.DateTimeFormat().resolvedOptions();
  const explanationText =
    photos.length === 1
      ? getPhrase("explanation1")
      : getPhrase("explanation").replaceAll("{QUANTITY}", photos.length);

  explanationEl.innerHTML = explanationText;

  let html = "";

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
      photoAddedAt,
      photoUpdatedAt,
    } = item;

    const datePhotoAdded = Intl.DateTimeFormat(userDateTimePrefs.locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: userDateTimePrefs.timeZone,
    }).format(new Date(photoAddedAt));

    html += `
        <div class="photo mt-4" data-userid="${userid}">
          <div class="text-center">
            <img class="profileImage" src="${profilephoto}" width="200" height="200" alt="${firstname} ${lastname}" data-userid="${userid}" />
            <h3 class="mt-2 mb-0 name text-center">
              ${firstname} ${lastname}
            </h3>
            <div class="text-muted small my-2 balancedTextWrap">Photo added on ${datePhotoAdded}</div>
            <div class="form-check form-check-inline mr-4">
              <label class="form-check-label">
                <input class="form-check-input" type="radio" name="decision_${userid}" data-userid="${userid}" value="approve" data-on-approve="possible_reasons_${userid}" checked>
                <span>${getPhrase("approve")}</span>
              </label>
            </div>
            <div class="form-check form-check-inline">
              <label class="form-check-label">
                <input class="form-check-input" type="radio" name="decision_${userid}" data-userid="${userid}" value="flag" data-on-flag="possible_reasons_${userid}">
                <span>${getPhrase("flag")}</span>
              </label>
            </div>
          </div>

          <div class="text-center mt-3 d-none" id="possible_reasons_${userid}">
            <div class="d-inline-block text-left">
              <p>${getPhrase("reasonForFlagging")}</p>

              <div class="form-check">
                <label class="form-check-label">
                  <input class="form-check-input reason" type="radio" name="reason_${userid}" value="no face" data-userid="${userid}">
                  <span>${getPhrase("doesNotShowUsersFace")}</span>
                </label>
              </div>

              <div class="form-check">
                <label class="form-check-label">
                  <input class="form-check-input reason" type="radio" name="reason_${userid}" value="face not prominent enough" data-userid="${userid}">
                  <span>${getPhrase("usersFaceNotProminentEnough")}</span>
                </label>
              </div>

              <div class="form-check">
                <label class="form-check-label reason">
                  <input class="form-check-input" type="radio" name="reason_${userid}" value="additional people" data-userid="${userid}">
                  <span>${getPhrase("additionalPeople")}</span>
                </label>
              </div>

              <div class="form-check">
                <label class="form-check-label reason">
                  <input class="form-check-input" type="radio" name="reason_${userid}" value="not appropriate" data-userid="${userid}">
                  <span>${getPhrase("notAppropriate")}</span>
                </label>
              </div>

              <div class="form-check">
                <label class="form-check-label mb-0">
                  <input class="otherRadio form-check-input" type="radio" name="reason_${userid}" value="other" data-userid="${userid}" id="reason_${userid}_other">
                  <span>${getPhrase("other")}</span>
                </label>
              </div>
              <div class="form-group pl-4">
                <input
                  class="otherInput form-control"
                  type="text"
                  id="reason_${userid}_other_text"
                  data-userid="${userid}"
                  placeholder="${getPhrase("otherReason")}"
                >
                <div class="invalid-feedback" data-i18n="reasonIsRequired"></div>
              </div>
            </div>
          </div>
        </div>
      `;
  });

  photosContainerEl.innerHTML = html;
  photosContainerEl.classList.remove("d-none");
}

function onPhotoFlagged(e) {
  const selector = e.target.getAttribute("data-on-flag");
  const detailsEl = document.querySelector(`#${selector}`);
  detailsEl.classList.remove("d-none");
}

function onPhotoApproved(e) {
  const selector = e.target.getAttribute("data-on-approve");
  const detailsEl = document.querySelector(`#${selector}`);
  detailsEl.classList.add("d-none");
}

function onSubmit(e) {
  let userIdsApproved = [];
  let userIdsFlagged = [];
  let usersFlagged = [];

  document
    .querySelectorAll("input[type='radio'][value='approve']:checked")
    .forEach((el) => {
      const userid = el.getAttribute("data-userid");
      userIdsApproved.push(Number(userid));
    });

  document
    .querySelectorAll("input[type='radio'][value='flag']:checked")
    .forEach((el) => {
      const userid = el.getAttribute("data-userid");
      userIdsFlagged.push(Number(userid));
    });

  if (userIdsFlagged.length) {
    for (var i = 0; i < userIdsFlagged.length; i++) {
      const userid = userIdsFlagged[i];
      const reasonEl = document.querySelector(
        `[name='reason_${userid}']:checked`
      );
      const reasonOther = document
        .querySelector(`#reason_${userid}_other_text`)
        .value.trim();

      if (!reasonEl) {
        const errorSelector = `#reason_${userid}_other_text`;
        const errorText = getPhrase("reasonIsRequired");

        return formError(errorSelector, errorText);
      }

      const flagObject = {
        userid: userid,
        reason: reasonEl.value,
        other: reasonOther,
      };

      usersFlagged.push(flagObject);
    }
  }

  // TODO: create a UI for when no photos are awaiting review (provide a link back to Admin page)
  // TODO: validate
  // TODO: create API endpoint
  // TODO: send data to API
  // TODO: on success, hide UI for photos, replace with UI for no photos
}

function attachListeners() {
  document
    .querySelector("[data-on-flag]")
    .addEventListener("click", onPhotoFlagged);
  document
    .querySelector("[data-on-approve]")
    .addEventListener("click", onPhotoApproved);
  document.querySelectorAll(".reason").forEach((el) => {
    el.addEventListener("change", (e) => {
      if (e.target.checked) {
        const userid = e.target.getAttribute("data-userid");
        const reasonOtherTextEl = document.querySelector(
          `#reason_${userid}_other_text`
        );
        reasonOtherTextEl.value = "";
      }
    });
  });
  document.querySelectorAll(".otherInput").forEach((el) => {
    el.addEventListener("input", (e) => {
      const otherReason = el.value.trim();

      if (otherReason && otherReason.length) {
        const userid = el.getAttribute("data-userid");
        const radioEl = document.querySelector(`#reason_${userid}_other`);
        radioEl.checked = true;
      }
    });
  });
}

async function init() {
  await populateContent();
  await populatePhotosPendingReview();

  attachListeners();
  globalHidePageSpinner();
}

init();
