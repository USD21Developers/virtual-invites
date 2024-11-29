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
        if (data.editable) {
          document
            .querySelectorAll(".showOnlyIfEditable")
            .forEach((item) => item.classList.remove("d-none"));
        }

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

  // TODO:  implement client-side validation
  // TODO:  create and connect API
  // TODO:  implement server-enforced validation
  // NOTE:  unless user is a sysadmin, don't permit, or process, any changes to users in other churches
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

function onSubmit(e) {
  console.log("Submitted");
  e.preventDefault();
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
