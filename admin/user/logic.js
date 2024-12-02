let isEditable = false;

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

  syncChurches();
}

async function populateCountries() {
  const lang = getLang();
  const countryEl = document.querySelector("#country");
  const countries = await getCountries(lang);

  countries.names.forEach((item) => {
    const { iso, name } = item;
    const el = document.createElement("option");

    el.setAttribute("value", iso);
    el.innerHTML = name;

    countryEl.appendChild(el);
  });
}

async function populateLanguages() {
  const langEl = document.querySelector("#lang");
  const userLang = getLang();
  const langListEnglish = await fetch("../../data/json/languages.json").then(
    (res) => res.json()
  );
  let langListNative;
  let listToUse = langListEnglish;

  if (userLang !== "en") {
    const entries = Object.entries(listToUse);
    entries.sort((a, b) =>
      a[1].nativeName.localeCompare(b[1].nativeName, undefined, {
        sensitivity: "base",
      })
    );
    langListNative = Object.fromEntries(entries);
    listToUse = langListNative;
  }

  Object.keys(listToUse).forEach((iso) => {
    const { name, nativeName } = listToUse[iso];
    const el = document.createElement("option");
    let displayedNameNonEnglish = nativeName;
    let displayedNameEnglish = name;

    el.value = iso;
    el.innerHTML =
      userLang === "en" ? displayedNameEnglish : displayedNameNonEnglish;
    langEl.appendChild(el);
  });
}

function populateUser() {
  return new Promise(async (resolve, reject) => {
    const userid = Number(getHash().split("/")[1]);
    const endpoint = `${getApiHost()}/admin-user`;
    const accessToken = await getAccessToken();

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        userid: userid,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.hasOwnProperty("editable")) {
          isEditable = data.editable;

          if (isEditable) {
            document
              .querySelectorAll(".showOnlyIfEditable")
              .forEach((item) => item.classList.remove("d-none"));
          }
        }

        document.querySelector("#userid").value = data.user.userid;

        renderUser(data.user);
        return resolve();
      })
      .catch((error) => {
        console.error(error);
        return reject(error);
      });
  });
}

function renderUser(user) {
  const viewingUserId = getUserId();
  const viewingUserType = getUserType();
  const {
    authorizedby,
    canAuthToAuth,
    canAuthorize,
    churchEmailUnverified,
    churchid,
    country,
    createdAt,
    email,
    firstname,
    gender,
    isAuthorized,
    lang,
    lastname,
    profilephoto,
    userid,
    username,
    userstatus,
    usertype,
  } = user;

  const fullname = `${firstname} ${lastname}`;
  const regDate = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(user.createdAt));
  const txtRegistered = getPhrase("registered").replaceAll(
    "{DATE}",
    `<span class="registrationDate">
      ${regDate}
    </span>`
  );

  const txtPreauthorizationP2Male = getPhrase("preauthorizationP2Male")
    .replaceAll("{FIRST-NAME}", firstname)
    .replaceAll("{LAST-NAME}", lastname);
  const txtPreauthorizationP2Female = getPhrase("preauthorizationP2Female")
    .replaceAll("{FIRST-NAME}", firstname)
    .replaceAll("{LAST-NAME}", lastname);
  const txtDelegatingPreauthorizationP1Male = getPhrase(
    "delegatingPreauthorizationP1Male"
  )
    .replaceAll("{FIRST-NAME}", firstname)
    .replaceAll("{LAST-NAME}", lastname);
  const txtDelegatingPreauthorizationP1Female = getPhrase(
    "delegatingPreauthorizationP1Female"
  )
    .replaceAll("{FIRST-NAME}", firstname)
    .replaceAll("{LAST-NAME}", lastname);
  const txtDelegatingPreauthorizationP2Male = getPhrase(
    "delegatingPreauthorizationP2Male"
  );
  const txtDelegatingPreauthorizationP2Female = getPhrase(
    "delegatingPreauthorizationP2Female"
  );

  document.title = fullname;

  document.querySelector(
    "#profilePhoto"
  ).innerHTML = `<img src="${profilephoto}" alt="${fullname}" />`;
  document.querySelector("#userFullName").innerHTML = fullname;
  document.querySelector("#registrationDate").innerHTML = txtRegistered;
  document.querySelector(".breadcrumb-item.active").innerHTML = fullname;
  document.querySelector("#country").value = country;
  document.querySelector("#lang").value = lang;
  document.querySelector("#firstname").value = firstname;
  document.querySelector("#lastname").value = lastname;
  document.querySelector("#email").value = email;

  if (usertype === "sysadmin") {
    document.querySelector("#usertypeSysadmin").checked = true;
  } else {
    document.querySelector("#usertypeUser").checked = true;

    if (viewingUserType !== "sysadmin") {
      document
        .querySelectorAll("[name='usertype']")
        .forEach((item) => item.setAttribute("disabled", ""));
    }
  }
  if (viewingUserId === userid) {
    document
      .querySelectorAll("[name='usertype']")
      .forEach((item) => item.setAttribute("disabled", ""));
  }

  if (userstatus === "frozen") {
    document.querySelector("#userstatusFrozen").checked = true;
  } else {
    document.querySelector("#userstatusRegistered").checked = true;
  }
  if (viewingUserId === userid) {
    document
      .querySelectorAll("[name='userstatus']")
      .forEach((item) => item.setAttribute("disabled", ""));
  }

  if (gender === "male") {
    document.querySelector("#labelCanAuthorize").innerHTML =
      getPhrase("canAuthorizeMale");
    document.querySelector("#labelCanAuthToAuth").innerHTML =
      getPhrase("canAuthToAuthMale");
    document.querySelector("#preAuthorizationP2").innerHTML =
      txtPreauthorizationP2Male;
    document.querySelector("#delegatingPreauthorizationP1").innerHTML =
      txtDelegatingPreauthorizationP1Male;
    document.querySelector("#delegatingPreauthorizationP2").innerHTML =
      txtDelegatingPreauthorizationP2Male;
  } else if (gender === "female") {
    document.querySelector("#labelCanAuthorize").innerHTML =
      getPhrase("canAuthorizeFemale");
    document.querySelector("#labelCanAuthToAuth").innerHTML = getPhrase(
      "canAuthToAuthFemale"
    );
    document.querySelector("#preAuthorizationP2").innerHTML =
      txtPreauthorizationP2Female;
    document.querySelector("#delegatingPreauthorizationP1").innerHTML =
      txtDelegatingPreauthorizationP1Female;
    document.querySelector("#delegatingPreauthorizationP2").innerHTML =
      txtDelegatingPreauthorizationP2Female;
  }

  if (canAuthorize === 1) {
    document.querySelector("#canAuthorize").checked = true;
  }

  if (canAuthToAuth === 1) {
    document.querySelector("#canAuthToAuth").checked = true;
  }
}

function showModalUnsuccessful(headline, content) {
  const modal = document.querySelector("#updateUnsuccessfulModal");
  modal.querySelector(".modal-title").innerHTML = headline;
  modal.querySelector(".modal-body").innerHTML = content;
  $("#updateUnsuccessfulModal").modal();
}

async function selectUserChurch() {
  const myUserId = getUserId();
  const myChurchId = await getUserChurchId(myUserId);
  const church = getStoredChurch(myChurchId);
  const userChurchId = church.id;
  const churchEl = document.querySelector("#churchid");

  if (typeof userChurchId !== "number") return;

  churchEl.value = userChurchId;

  const churchName = church.name;
  const churchNameEl = document.querySelector("#selectedChurchName");

  churchNameEl.innerText = churchName;
}

function onChurchChanged() {
  const churchEl = document.querySelector("#churchid");
  const churchName = churchEl.selectedOptions[0].getAttribute("data-name");
  const churchNameEl = document.querySelector("#selectedChurchName");

  churchNameEl.innerText = churchName;
}

function onHelpClickedForPreauthorization(e) {
  e.preventDefault();
  $("#aboutPreauthorizationModal").modal();
}

function onHelpClickedForDelegatingPreauthorization(e) {
  e.preventDefault();
  $("#delegatingPreauthorizationModal").modal();
}

async function onSubmit(e) {
  e.preventDefault();

  const form = document.querySelector("#userform");
  const userid = form["userid"].value;
  const churchid = form["churchid"].value;
  const country = form["country"].value;
  const lang = form["lang"].value;
  const firstname = form["firstname"].value;
  const lastname = form["lastname"].value;
  const email = form["email"].value;
  const usertype = form["usertype"].value;
  const userstatus = form["userstatus"].value;
  const canAuthorize = form["canAuthorize"].checked ? 1 : 0;
  const canAuthToAuth = form["canAuthToAuth"].checked ? 1 : 0;

  document.querySelectorAll(".is-invalid").forEach((item) => {
    item.classList.remove("is-invalid");
  });
  document.querySelector("#errorUserTypeIsRequired").classList.add("d-none");
  document.querySelector("#errorUserStatusIsRequired").classList.add("d-none");

  if (!churchid || churchid === "") {
    document.querySelector("#churchid").classList.add("is-invalid");
    formError("#churchid", getPhrase("errorChurchIsRequired"));
    return;
  }

  if (isEditable) {
    if (country.length !== 2) {
      document.querySelector("#country").classList.add("is-invalid");
      formError("#country", getPhrase("errorCountryIsRequired"));
      return;
    }

    if (lang.length !== 2) {
      document.querySelector("#lang").classList.add("is-invalid");
      formError("#lang", getPhrase("errorLangIsRequired"));
      return;
    }

    if (!firstname.trim().length) {
      document.querySelector("#firstname").classList.add("is-invalid");
      formError("#firstname", getPhrase("errorFirstNameIsRequired"));
      return;
    }

    if (!lastname.trim().length) {
      document.querySelector("#lastname").classList.add("is-invalid");
      formError("#lastname", getPhrase("errorLastNameIsRequired"));
      return;
    }

    if (!email.trim().length) {
      document.querySelector("#email").classList.add("is-invalid");
      formError("#email", getPhrase("errorEmailIsRequired"));
      return;
    }

    if (!validateEmail(email.trim())) {
      document.querySelector("#email").classList.add("is-invalid");
      formError("#email", getPhrase("errorEmailIsInvalid"));
      return;
    }

    if (!["user", "sysadmin"].includes(usertype)) {
      document
        .querySelector("#errorUserTypeIsRequired")
        .classList.remove("d-none");
      customScrollTo("#userTypeInput");
      return;
    }
  }

  if (!["registered", "frozen"].includes(userstatus)) {
    document
      .querySelector("#errorUserStatusIsRequired")
      .classList.remove("d-none");
    customScrollTo("#userStatusInput");
    return;
  }

  globalShowPageSpinner();

  const endpoint = `${getApiHost()}/admin-user-update`;
  const accessToken = await getAccessToken();

  fetch(endpoint, {
    mode: "cors",
    method: "post",
    body: JSON.stringify({
      userid: Number(userid),
      churchid: Number(churchid),
      country: country,
      lang: lang,
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: email.trim().toLowerCase(),
      usertype: usertype,
      userstatus: userstatus,
      canAuthorize: canAuthorize,
      canAuthToAuth: canAuthToAuth,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      document.querySelector("#pageSpinner").classList.add("d-none");

      switch (data.msg) {
        case "firstname is required":
          showModalUnsuccessful(
            getPhrase("changes-not-saved"),
            getPhrase("input-first-name")
          );
          return;
        case "firstname must not exceed 255 characters":
          showModalUnsuccessful(
            getPhrase("changes-not-saved"),
            getPhrase("first-name-too-long")
          );
          return;
        case "lastname is required":
          showModalUnsuccessful(
            getPhrase("changes-not-saved"),
            getPhrase("input-last-name")
          );
          return;
        case "lastname must not exceed 255 characters":
          showModalUnsuccessful(
            getPhrase("changes-not-saved"),
            getPhrase("last-name-too-long")
          );
          return;
        case "email is required":
          showModalUnsuccessful(
            getPhrase("changes-not-saved"),
            getPhrase("input-email")
          );
          return;
        case "email must not exceed 255 characters":
          showModalUnsuccessful(
            getPhrase("changes-not-saved"),
            getPhrase("email-too-long")
          );
          return;
        case "email format is invalid":
          showModalUnsuccessful(
            getPhrase("changes-not-saved"),
            getPhrase("email-invalid")
          );
          return;
        case "email is already in use":
          showModalUnsuccessful(
            getPhrase("changes-not-saved"),
            getPhrase("email-in-use")
          );
          return;
        case "insufficient permissions to downgrade usertype for this user":
          showModalUnsuccessful(
            getPhrase("changes-not-saved"),
            getPhrase("cannot-downgrade-usertype")
          );
          return;
        case "insufficient permissions to set userstatus to frozen for this user":
          showModalUnsuccessful(
            getPhrase("changes-not-saved"),
            getPhrase("cannot-downgrade-userstatus")
          );
          return;
        case "insufficient permissions to downgrade canAuthorize for this user":
          showModalUnsuccessful(
            getPhrase("changes-not-saved"),
            getPhrase("cannot-downgrade-canAuthorize")
          );
          return;
        case "insufficient permissions to downgrade canAuthToAuth for this user":
          showModalUnsuccessful(
            getPhrase("changes-not-saved"),
            getPhrase("cannot-downgrade-canAuthToAuth")
          );
          return;
        case "sysadmins cannot downgrade their own usertype":
          showModalUnsuccessful(
            getPhrase("changes-not-saved"),
            getPhrase("sysadmins-cannot-downgrade-own-usertype")
          );
          return;
        case "sysadmins cannot downgrade their own userstatus":
          showModalUnsuccessful(
            getPhrase("changes-not-saved"),
            getPhrase("sysadmins-cannot-downgrade-own-userstatus")
          );
          return;
        case "sysadmins cannot downgrade their own canAuthorize setting":
          showModalUnsuccessful(
            getPhrase("changes-not-saved"),
            getPhrase("sysadmins-cannot-downgrade-own-canAuthorize")
          );
          return;
        case "sysadmins cannot downgrade their own canAuthToAuth setting":
          showModalUnsuccessful(
            getPhrase("changes-not-saved"),
            getPhrase("sysadmins-cannot-downgrade-own-canAuthToAuth")
          );
          return;
        case "insufficient permissions to modify a user from another congregation":
          showModalUnsuccessful(
            getPhrase("changes-not-saved"),
            getPhrase("cannot-modify-user-from-different-congregation")
          );
          return;
        case "user unchanged":
          showModalUnsuccessful(
            getPhrase("user-unchanged"),
            getPhrase("user-unchanged-explanation")
          );
          return;
        case "user updated":
          document.querySelector("#pageSpinner").classList.add("d-none");
          $("#updateSuccessfulModal").modal();
        default:
          showModalUnsuccessful(
            getPhrase("changes-not-saved"),
            getPhrase("unexpected-error")
          );
          return;
      }
    })
    .catch((error) => {
      console.error(error);
      globalHidePageSpinner();
    });
}

function attachListeners() {
  document
    .querySelector("#churchid")
    .addEventListener("change", onChurchChanged);
  document.querySelector("#userform").addEventListener("submit", onSubmit);
  document
    .querySelector("#helpAboutPreauthorization")
    .addEventListener("click", onHelpClickedForPreauthorization);
  document
    .querySelector("#helpAboutDelegatingPreauthorization")
    .addEventListener("click", onHelpClickedForDelegatingPreauthorization);

  $("#updateSuccessfulModal").on("hide.bs.modal", (e) => {
    window.location.reload();
  });

  $("#updateUnsuccessfulModal").on("hide.bs.modal", (e) => {
    globalHidePageSpinner();
  });
}

async function init() {
  await populateContent();
  populateChurches();
  populateCountries();
  populateLanguages();
  await populateUser();
  attachListeners();
  globalHidePageSpinner();
}

init();
