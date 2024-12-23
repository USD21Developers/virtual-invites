let table = null;
let flaggedUserLangs = [];

function getEmailPhrases() {
  return new Promise((resolve) => {
    const emailPhrasesPhotoWasFlagged = {};
    const promises = [];

    flaggedUserLangs.forEach((lang) => {
      const revPhrases = fetch(`./i18n/${lang}.json`).then((res) => res.json());
      const regPhrases = fetch(`../../register/i18n/${lang}.json`).then((res) =>
        res.json()
      );

      promises.push(revPhrases);
      promises.push(regPhrases);
    });

    Promise.all(promises).then((result) => {
      const revPhrases = result[0];
      const regPhrases = result[1];

      flaggedUserLangs.forEach((lang) => {
        emailPhrasesPhotoWasFlagged[lang] = {
          emailSubject: getPhrase("emailSubject", revPhrases),
          emailP1: getPhrase("emailP1", revPhrases),
          emailP2: getPhrase("emailP2", revPhrases),
          emailP3: getPhrase("emailP3", revPhrases),
          emailP4: getPhrase("emailP4", revPhrases),
          emailP5: getPhrase("emailP5", revPhrases),
          emailP6: getPhrase("emailP6", revPhrases),
          emailP7: getPhrase("emailP7", revPhrases),
          emailP8: getPhrase("emailP8", revPhrases),
          emailUpdatePhotoLink: getPhrase("emailUpdatePhotoLink", revPhrases),
          emailP10: getPhrase("emailP10", revPhrases),
          emailSincerely: getPhrase("emailSincerely", revPhrases),
          emailTheCyberministry: getPhrase("emailTheCyberministry", revPhrases),
          emailAboutApp: getPhrase("emailAboutApp", revPhrases),
          emailTimezone: getPhrase("emailTimezone", revPhrases),
          emailMessageID: getPhrase("emailMessageID", revPhrases),
          photoRules: {
            headlineRulesAboutPhotos: getPhrase(
              "headlineRulesAboutPhotos",
              regPhrases
            ),
            ruleMustShowYourFace: getPhrase("ruleMustShowYourFace", regPhrases),
            explanationMustShowYourFace: getPhrase(
              "explanationMustShowYourFace",
              regPhrases
            ),
            ruleFaceMustBeProminent: getPhrase(
              "ruleFaceMustBeProminent",
              regPhrases
            ),
            explanationFaceMustBeProminent: getPhrase(
              "explanationFaceMustBeProminent",
              regPhrases
            ),
            ruleOnlyYou: getPhrase("ruleOnlyYou", regPhrases),
            explanationOnlyYou: getPhrase("explanationOnlyYou", regPhrases),
            ruleMustBeAppropriate: getPhrase(
              "ruleMustBeAppropriate",
              regPhrases
            ),
            explanationMustBeAppropriate: getPhrase(
              "explanationMustBeAppropriate",
              regPhrases
            ),
          },
        };
      });

      resolve(emailPhrasesPhotoWasFlagged);
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
  const noPhotosEl = document.querySelector("#nophotos");
  const photosEl = document.querySelector("#photos");
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
      lang,
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

    const photoAddedOn = getPhrase("photoAddedOn").replaceAll(
      "{DATE}",
      datePhotoAdded
    );

    html += `
        <div class="photo mt-4" data-userid="${userid}" data-lang="${lang}">
          <div class="text-center">
            <img class="profileImage" src="${profilephoto}" width="200" height="200" alt="${firstname} ${lastname}" data-userid="${userid}" />
            <h3 class="mt-2 mb-0 name text-center">
              ${firstname} ${lastname}
            </h3>
            <div class="text-muted small my-2 balancedTextWrap">${photoAddedOn}</div>
            <div class="form-check form-check-inline mr-4">
              <label class="form-check-label">
                <input class="form-check-input" type="radio" name="decision_${userid}" data-userid="${userid}" data-firstName="${firstname}" data-lastName="${lastname}" value="approve" data-on-approve="possible_reasons_${userid}" checked>
                <span>${getPhrase("approve")}</span>
              </label>
            </div>
            <div class="form-check form-check-inline">
              <label class="form-check-label">
                <input class="form-check-input" type="radio" name="decision_${userid}" data-userid="${userid}" data-firstName="${firstname}" data-lastName="${lastname}" value="flag" data-on-flag="possible_reasons_${userid}">
                <span>${getPhrase("flag")}</span>
              </label>
            </div>
          </div>

          <div class="text-center mt-3 d-none" id="possible_reasons_${userid}">
            <div class="d-inline-block text-left">
              <p class="text-center reasonForFlagging">${getPhrase(
                "reasonForFlagging"
              )}</p>

              <div class="form-check">
                <label class="form-check-label">
                  <input class="form-check-input reason" type="radio" name="reason_${userid}" value="no face" data-userid="${userid}" data-firstName="${firstname}" data-lastName="${lastname}" data-gender="${gender}">
                  <span>${getPhrase("doesNotShowUsersFace")}</span>
                </label>
              </div>

              <div class="form-check">
                <label class="form-check-label">
                  <input class="form-check-input reason" type="radio" name="reason_${userid}" value="face not prominent enough" data-userid="${userid}" data-firstName="${firstname}" data-lastName="${lastname}" data-gender="${gender}">
                  <span>${getPhrase("usersFaceNotProminentEnough")}</span>
                </label>
              </div>

              <div class="form-check">
                <label class="form-check-label reason">
                  <input class="form-check-input" type="radio" name="reason_${userid}" value="additional people" data-userid="${userid}" data-firstName="${firstname}" data-lastName="${lastname}" data-gender="${gender}">
                  <span>${getPhrase("additionalPeople")}</span>
                </label>
              </div>

              <div class="form-check">
                <label class="form-check-label reason">
                  <input class="form-check-input" type="radio" name="reason_${userid}" value="not appropriate" data-userid="${userid}" data-firstName="${firstname}" data-lastName="${lastname}" data-gender="${gender}">
                  <span>${getPhrase("notAppropriate")}</span>
                </label>
              </div>

              <div class="form-check">
                <label class="form-check-label mb-0">
                  <input class="otherRadio form-check-input" type="radio" name="reason_${userid}" value="other" data-userid="${userid}" data-firstName="${firstname}" data-lastName="${lastname}" id="reason_${userid}_other" data-gender="${gender}">
                  <span>${getPhrase("other")}</span>
                </label>
              </div>
              <div class="form-group pl-4">
                <input
                  class="otherInput form-control"
                  type="text"
                  id="reason_${userid}_other_text"
                  data-firstName="${firstname}"
                  data-lastName="${lastname}"
                  data-userid="${userid}"
                  data-gender="${gender}"
                  placeholder="${getPhrase("otherReason")}"
                >
                <div class="invalid-feedback" data-i18n="reasonIsRequired"></div>
              </div>
            </div>
          </div>
        </div>
      `;
  });

  photosEl.innerHTML = html;
  noPhotosEl.classList.add("d-none");
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

async function onSubmit(e) {
  let userIdsApproved = [];
  let userIdsFlagged = [];
  let photosFlagged = [];
  const userDateTimePrefs = Intl.DateTimeFormat().resolvedOptions();

  e.preventDefault();

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
      const rootEl = document.querySelector(`.photo[data-userid="${userid}"]`);
      const lang = rootEl.getAttribute("data-lang");
      const reasonEl = document.querySelector(
        `[name='reason_${userid}']:checked`
      );
      const reasonOther = document
        .querySelector(`#reason_${userid}_other_text`)
        .value.trim();
      const gender = reasonEl.getAttribute("data-gender");

      if (!reasonEl) {
        const errorSelector = `#reason_${userid}_other_text`;
        const errorText = getPhrase("reasonIsRequired");

        return formError(errorSelector, errorText);
      }

      const flaggedPhotoURL = document
        .querySelector(`.profileImage[data-userid="${userid}"]`)
        .getAttribute("src");

      const firstName = reasonEl.getAttribute("data-firstName");
      const lastName = reasonEl.getAttribute("data-lastName");
      const reasonValue = reasonEl.value;
      let reason;

      switch (reasonValue) {
        case "no face":
          reason = getPhrase("doesNotShowUsersFace");
          break;
        case "face not prominent enough":
          reason = getPhrase("usersFaceNotProminentEnough");
          break;
        case "additional people":
          reason = getPhrase("additionalPeople");
          break;
        case "not appropriate":
          reason = getPhrase("notAppropriate");
          break;
        case "other":
          reason = getPhrase("other");
          break;
      }

      const flagObject = {
        userid: userid,
        firstName: firstName,
        lastName: lastName,
        lang: lang,
        reason: reason,
        other: reasonOther,
        gender: gender,
        flaggedPhotoURL: flaggedPhotoURL,
      };

      photosFlagged.push(flagObject);
    }
  }

  const endpoint = `${getApiHost()}/photo-reviews`;

  globalShowPageSpinner();

  const accessToken = await getAccessToken();

  const htmlYourPhotoWasFlagged = await fetch(
    "./email-your-photo-was-flagged.html"
  ).then((res) => res.text());

  const flaggedUserLangsWithDupes = photosFlagged.map((item) => item.lang);

  flaggedUserLangs = [...new Set(flaggedUserLangsWithDupes)];
  flaggedUserLangs.sort();

  const emailPhrasesPhotoWasFlagged = await getEmailPhrases();

  fetch(endpoint, {
    mode: "cors",
    method: "post",
    body: JSON.stringify({
      userIdsApproved: userIdsApproved,
      userIdsFlagged: userIdsFlagged,
      photosFlagged: photosFlagged,
      htmlYourPhotoWasFlagged: htmlYourPhotoWasFlagged,
      emailPhrasesPhotoWasFlagged: emailPhrasesPhotoWasFlagged,
      adminTimeZone: userDateTimePrefs.timeZone,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      const photosContainerEl = document.querySelector("#photosContainer");
      const photosEl = document.querySelector("#photos");
      const noPhotosEl = document.querySelector("#nophotos");

      // TODO:  HANDLE ERRORS

      // TODO:  HANDLE SUCCESS
      if (data.msg === "photo reviews processed successfully") {
        photosEl.innerHTML = "";
        photosContainerEl.classList.add("d-none");
        noPhotosEl.classList.remove("d-none");
        globalHidePageSpinner();
        showToast(getPhrase("reviewsProcessedSuccessfully"), 5000, "success");
      }
    })
    .catch((error) => {
      console.error(error);
      globalHidePageSpinner();
    });
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
  document.querySelector("#photosForm").addEventListener("submit", onSubmit);
}

async function init() {
  await populateContent();
  await populatePhotosPendingReview();

  attachListeners();
  globalHidePageSpinner();
}

init();
