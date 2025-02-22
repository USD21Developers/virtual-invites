let churches = [];

let countries = [];

let regContent = null;

let intervalId;

function checkIfPrivilegedEmailIsConfirmed() {
  return new Promise(async (resolve, reject) => {
    if (!navigator.onLine) {
      return resolve(false);
    }

    const controller = new AbortController();
    const endpoint = `${getApiHost()}/profile-is-privileged-email-confirmed`;
    const accessToken = await getAccessToken();

    fetch(endpoint, {
      mode: "cors",
      method: "post",
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        switch (data.msg) {
          case "confirmed":
            if (data.refreshToken) {
              localStorage.setItem("refreshToken", data.refreshToken);
            }

            if (data.accessToken) {
              sessionStorage.setItem("accessToken", data.accessToken);
            }

            clearInterval(intervalId);
            toggleEmailConfirmationAlert();

            return resolve(true);

          default:
            return resolve(false);
        }
      })
      .catch((err) => {
        console.error(err);
        return resolve(false);
      });

    setTimeout(() => {
      return resolve(false);
    }, 30000);
  });
}

function toggleEmailConfirmationAlert() {
  const mustConfirmEmailEl = document.querySelector("#mustConfirmEmail");
  const refreshToken = localStorage.getItem("refreshToken");
  const refreshTokenParsed = JSON.parse(atob(refreshToken.split(".")[1]));
  let isUnverified = false;

  mustConfirmEmailEl.classList.add("d-none");

  if (refreshToken.canAuthorize === 1 && refreshToken.canAuthToAuth === 1) {
    return isUnverified;
  }

  if (refreshTokenParsed.hasOwnProperty("churchEmailUnverified")) {
    if (refreshTokenParsed.churchEmailUnverified === 1) {
      isUnverified = true;
      mustConfirmEmailEl.classList.remove("d-none");
      customScrollTo("#mustConfirmEmail");
    }
  }

  return isUnverified;
}

async function populateChurches() {
  const churchDropdown = document.querySelector("#churchid");
  const countryData = await getCountries(getLang());
  const countries = countryData.names;
  const churches = await getChurches();
  let churchesHtml = "";

  countries.sort((a, b) => (a.name > b.name ? 1 : -1));

  for (let i = 0; i < countries.length; i++) {
    const countryIso = countries[i].iso;
    const countryName = countries[i].name;
    const churchesInCountry = churches.filter(
      (item) => item.country === countryIso
    );
    let churchesInCountryHtml = "";

    if (!churchesInCountry.length) continue;

    churchesInCountry.sort((a, b) => (a.place > b.place ? 1 : -1));
    churchesInCountry.forEach((church) => {
      const { country, id, name, place } = church;
      if (!place) return;
      const option = `<option value="${id}" data-name="${name}">${place}</option>`;
      churchesInCountryHtml += option;
    });

    churchesInCountryHtml = `<optgroup label="${countryName}" data-country="${countryIso}">${churchesInCountryHtml}</optgroup>`;
    if (churchesInCountryHtml.length) {
      churchesHtml += churchesInCountryHtml;
    }
  }

  churchDropdown.innerHTML = churchesHtml;

  selectUserChurch();
}

function populateForm() {
  const userData = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  );
  const {
    profilephoto,
    username,
    email,
    firstname,
    lastname,
    nameDisplayedOnInvite,
    churchid,
    gender,
  } = userData;

  const altText = getPhrase("profilePhoto")
    .replaceAll("{FIRST-NAME}", firstname)
    .replaceAll("{LAST-NAME}", lastname);

  const photoLinkEl = document.querySelector("#profilePhoto");

  const defaultImg =
    gender === "male" ? "avatar_male.svg" : "avatar_female.svg";
  const img = document.createElement("img");
  img.setAttribute("src", profilephoto);
  img.setAttribute("alt", altText);
  img.setAttribute("title", altText);
  img.setAttribute("width", 140);
  img.setAttribute("height", 140);
  img.setAttribute(
    "onerror",
    `this.onerror=null;this.src='/_assets/img/${defaultImg}';this.alt='${altText}';`
  );

  photoLinkEl.innerHTML = "";
  photoLinkEl.appendChild(img);

  document.querySelector("#username").innerHTML = username;
  document.querySelector("#username_hidden").value = username;
  document.querySelector("#email").value = email;
  document.querySelector("#firstname").value = firstname;
  document.querySelector("#lastname").value = lastname;
  if (nameDisplayedOnInvite) {
    document.querySelector("#nameDisplayedOnInvite").value =
      nameDisplayedOnInvite;
  } else {
    document.querySelector("#nameDisplayedOnInvite").value = firstname;
  }
  document.querySelector("#churchid").value = churchid;
}

async function selectUserChurch() {
  const userid = getUserId();
  const churchid = await getUserChurchId(userid);
  const church = getStoredChurch(churchid);
  const userChurchId = churchid;
  const churchEl = document.querySelector("#churchid");

  if (typeof userChurchId !== "number") return;

  churchEl.value = userChurchId;

  const churchName = church.name;
  const churchNameEl = document.querySelector("#selectedChurchName");

  churchNameEl.innerText = churchName;
}

function showProfilePhoto() {
  const refreshToken = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  );
  const { firstname, lastname, profilephoto } = refreshToken;
  const profilePhoto400 = profilephoto;
  const profilePhotoEl = document.querySelector("#profilePhoto");
  const altText = getPhrase("profilePhoto")
    .replaceAll("{FIRST-NAME}", firstname)
    .replaceAll("{LAST-NAME}", lastname);

  const img = document.createElement("img");
  img.setAttribute("src", profilePhoto400);
  img.setAttribute("width", 140);
  img.setAttribute("height", 140);
  img.setAttribute("alt", altText);
  img.setAttribute("title", altText);

  profilePhotoEl.appendChild(img);
}

function onChurchChanged() {
  const churchEl = document.querySelector("#churchid");
  const churchName = churchEl.selectedOptions[0].getAttribute("data-name");
  const churchNameEl = document.querySelector("#selectedChurchName");

  churchNameEl.innerText = churchName;
}

async function onSubmit(e) {
  e.preventDefault();

  formErrorsReset();

  if (!regContent) {
    regContent = await fetch(`../register/i18n/${getLang()}.json`).then((res) =>
      res.json()
    );
  }

  const password = document.querySelector("#password").value.trim() || "";
  const email =
    document.querySelector("#email").value.trim().toLowerCase() || "";
  const firstname = document.querySelector("#firstname").value.trim() || "";
  const lastname = document.querySelector("#lastname").value.trim() || "";
  const nameDisplayedOnInvite =
    document.querySelector("#nameDisplayedOnInvite").value.trim() || "";
  const churchid = document.querySelector("#churchid").value.trim() || "";
  const datakey = localStorage.getItem("datakey");

  const emailSenderText = getPhrase("emailSenderText");
  const emailSubject = getPhrase("emailSubject");
  let emailParagraph1 = getPhrase("emailParagraph1");
  const emailLinkText = getPhrase("emailLinkText");
  const emailSignature = getPhrase("emailSignature");

  document.querySelector("#mustConfirmEmail").classList.add("d-none");

  emailParagraph1 = emailParagraph1.replaceAll(
    "${fullname}",
    `${firstname} ${lastname}`
  );

  if (!email.length) {
    return formError("#email", getPhrase("emailrequired", regContent));
  }

  if (!firstname.length) {
    return formError("#firstname", getPhrase("firstnamerequired", regContent));
  }

  if (!lastname.length) {
    return formError("#lastname", getPhrase("lastnamerequired", regContent));
  }

  if (!nameDisplayedOnInvite.length) {
    return formError(
      "#nameDisplayedOnInvite",
      getPhrase("nameDisplayedOnInviteRequired")
    );
  }

  if (!churchid.length) {
    return formError("#churchid", getPhrase("churchrequired", regContent));
  }

  // TODO:  now do server-side validation
  if (!navigator.onLine) {
    return showToast(getGlobalPhrase("youAreOffline"), 5000, "danger");
  }

  const endpoint = `${getApiHost()}/profile`;
  const accessToken = await getAccessToken();

  globalShowPageSpinner();

  fetch(endpoint, {
    mode: "cors",
    method: "post",
    body: JSON.stringify({
      password: password,
      datakey: datakey,
      email: email,
      firstname: firstname,
      lastname: lastname,
      nameDisplayedOnInvite: nameDisplayedOnInvite,
      churchid: churchid,
      emailSenderText: emailSenderText,
      emailSubject: emailSubject,
      emailParagraph1: emailParagraph1,
      emailLinkText: emailLinkText,
      emailSignature: emailSignature,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
    }),
  })
    .then((res) => res.json())
    .then(async (data) => {
      const { refreshToken, accessToken } = data;
      if (data.msgType !== "success") {
        throw data.msg;
      }
      localStorage.setItem("refreshToken", refreshToken);
      sessionStorage.setItem("accessToken", accessToken);

      const refreshTokenParsed = JSON.parse(atob(refreshToken.split(".")[1]));
      let canAuth = false;

      if (refreshTokenParsed.canAuthorize) canAuth = true;
      if (refreshTokenParsed.canAuthToAuth) canAuth = true;

      if (refreshTokenParsed.hasOwnProperty("churchEmailUnverified")) {
        if (
          refreshTokenParsed.churchEmailUnverified === 1 &&
          canAuth === false
        ) {
          const mustConfirmEmailEl =
            document.querySelector("#mustConfirmEmail");
          mustConfirmEmailEl.classList.remove("d-none");
          globalHidePageSpinner();
          customScrollTo("#mustConfirmEmail");

          intervalId = setInterval(async () => {
            const hideMustConfirmEmail =
              await checkIfPrivilegedEmailIsConfirmed();
            if (hideMustConfirmEmail) {
              mustConfirmEmailEl.classList.add("d-none");
              clearInterval(intervalId);
            }
          }, 5000);
        } else {
          showToast(getPhrase("profileUpdated"), 5000, "success");
        }
      } else {
        showToast(getPhrase("profileUpdated"), 5000, "success");
      }

      document.querySelector("#profileform").reset();
      populateForm();
      document.querySelector("body").scrollIntoView();
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      globalHidePageSpinner();
    });
}

function attachListeners() {
  document.querySelector("#profileform").addEventListener("submit", onSubmit);

  document
    .querySelector("#churchid")
    .addEventListener("change", onChurchChanged);
}

async function init() {
  selectUserChurch();
  populateChurches();
  await populateContent();
  showProfilePhoto();
  populateForm();
  attachListeners();
  const isUnverified = toggleEmailConfirmationAlert();
  if (isUnverified) {
    checkIfPrivilegedEmailIsConfirmed();
  }
  globalHidePageSpinner();
}

init();
