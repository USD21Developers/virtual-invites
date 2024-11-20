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

  document.title = fullname;
  document.querySelector(
    "#profilePhoto"
  ).innerHTML = `<img src="${profilephoto}" alt="${fullname}" />`;
  document.querySelector("#userFullName").innerHTML = fullname;
  document.querySelector(".breadcrumb-item.active").innerHTML = fullname;
  document.querySelector("#country").value = country;
  document.querySelector("#lang").value = lang;
  document.querySelector("#firstname").value = firstname;
  document.querySelector("#lastname").value = lastname;
  document.querySelector("#email").value = email;
  document.querySelector("[name='usertype']").value = userstatus;

  const viewingUserId = getUserId();
  const viewingUserType = getUserType();

  if (viewingUserType === "sysadmin" && viewingUserId !== userid) {
    document.querySelector("#userTypeContainer").classList.remove("d-none");
  }

  // TODO:  user type (sysadmin / user) -- only show this to sysadmins
  // TODO:  account status (active / frozen)
  // TODO:  church role (HCL+, BTL, or ordinary member)
  // TODO:  show unchangable metadata (createdAt, gender, churchEmailUnverified)
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

function attachListeners() {
  document
    .querySelector("#churchid")
    .addEventListener("change", onChurchChanged);
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
