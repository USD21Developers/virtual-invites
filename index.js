function hideChurchCityLatestInvites() {
  document
    .querySelector("#latestInvites")
    .querySelectorAll(".churchCity")
    .forEach((item) => item.classList.add("d-none"));
}

function showChurchCityLatestInvites() {
  document
    .querySelector("#latestInvites")
    .querySelectorAll(".churchCity")
    .forEach((item) => item.classList.remove("d-none"));
}

function hideChurchCityLatestRegistrants() {
  document
    .querySelector("#latestRegistrants")
    .querySelectorAll(".churchCity")
    .forEach((item) => item.classList.add("d-none"));
}

function showChurchCityLatestRegistrants() {
  document
    .querySelector("#latestRegistrants")
    .querySelectorAll(".churchCity")
    .forEach((item) => item.classList.remove("d-none"));
}

function latestInvites() {
  return new Promise(async (resolve, reject) => {
    const latestInvitesEl = document.querySelector("#latestInvites");
    const churchid = Number(
      document.querySelector("#latestInvitesChurchID").selectedOptions[0].value
    );
    let invites = await localforage.getItem("latestInvites");

    latestInvitesEl.innerHTML = "";

    if (!invites) {
      invites = await syncLatestInvites([churchid]);
    }

    if (churchid !== 0) {
      invites = invites.filter((item) => item.churchid === churchid);
    }

    if (!invites.length) {
      latestInvitesEl.innerHTML = getPhrase("latestInvitesNoneFound");
      return resolve();
    }

    invites.forEach((item) => {
      const {
        invitationid,
        userid,
        eventtype,
        firstName,
        lastName,
        churchid,
        gender,
        createdAt,
        profilePhoto,
      } = item;
      const profilePhoto140 = profilePhoto.replaceAll("__400.jpg", "__140.jpg");
      const el = document.createElement("a");
      const church = getStoredChurch(churchid);
      const createdDate = new Date(createdAt);
      const now = new Date();
      const msPerDay = 1000 * 60 * 60 * 24;
      const diffInMs = now - createdDate;
      const diffInDays = Math.floor(diffInMs / msPerDay);
      const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
      const daysAgo = rtf.format(-diffInDays, "day");

      let eventType = getPhrase("latestInvitesAction");
      if (eventtype === "bible talk") {
        eventType = eventType.replaceAll(
          "{EVENT-TYPE}",
          getGlobalPhrase("bibletalk")
        );
      } else if (eventtype === "church") {
        eventType = eventType.replaceAll(
          "{EVENT-TYPE}",
          getGlobalPhrase("churchservice").toLowerCase()
        );
      } else {
        eventType = eventType.replaceAll(
          "{EVENT-TYPE}",
          getGlobalPhrase("otherevent").toLowerCase()
        );
      }

      el.classList.add("media");
      el.classList.add("invite");
      el.classList.add(gender);
      el.setAttribute("href", `/u/#${userid}`);
      el.innerHTML = `
        <img
          class="mr-3"
          src="${profilePhoto140}"
          alt="${firstName} ${lastName}"
        />
        <div class="media-body">
          <h4 class="my-0">${firstName} ${lastName}</h4>
          <div class="my-1 small text-muted churchCity">${church.place}</div>
          <div class="my-1 small text-black eventType">${eventType}</div>
          <div class="mt-1 small text-black daysAgo">${daysAgo}</div>
        </div>
      `;

      latestInvitesEl.appendChild(el);
    });

    // Hide or show church city
    const selectedChurch = document.querySelector("#latestInvitesChurchID")
      .selectedOptions[0].value;
    if (selectedChurch == 0) {
      showChurchCityLatestInvites();
    } else {
      hideChurchCityLatestInvites();
    }

    return resolve();
  });
}

function latestRegistrants() {
  return new Promise(async (resolve, reject) => {
    const latestRegistrantsEl = document.querySelector("#latestRegistrants");
    const churchid = Number(
      document.querySelector("#latestRegistrantsChurchID").selectedOptions[0]
        .value
    );
    let registrants = await localforage.getItem("latestRegistrants");

    latestRegistrantsEl.innerHTML = "";

    if (!registrants) {
      registrants = await syncLatestRegistrants([churchid]);
    }

    if (churchid !== 0) {
      registrants = registrants.filter((item) => item.churchid === churchid);
    }

    if (!registrants.length) {
      latestRegistrantsEl.innerHTML = getPhrase("latestRegistrantsNoneFound");
      return resolve();
    }

    registrants.forEach((item) => {
      const {
        userid,
        churchid,
        firstName,
        lastName,
        gender,
        createdAt,
        profilePhoto,
      } = item;
      const profilePhoto140 = profilePhoto.replaceAll("__400.jpg", "__140.jpg");
      const el = document.createElement("a");
      const church = getStoredChurch(churchid);
      const createdDate = new Date(createdAt);
      const now = new Date();
      const msPerDay = 1000 * 60 * 60 * 24;
      const diffInMs = now - createdDate;
      const diffInDays = Math.floor(diffInMs / msPerDay);
      const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
      const daysAgo = rtf.format(-diffInDays, "day");

      let registeredWhen = getPhrase("latestRegistrantsAction");
      registeredWhen = registeredWhen.replaceAll("{DAYS-AGO}", daysAgo);

      el.classList.add("media");
      el.classList.add("registrant");
      el.classList.add(gender);
      el.setAttribute("href", `/u/#${userid}`);
      el.innerHTML = `
        <img
          class="mr-3"
          src="${profilePhoto140}"
          alt="${firstName} ${lastName}"
        />
        <div class="media-body">
          <h4 class="my-0">${firstName} ${lastName}</h4>
          <div class="my-1 text-muted churchCity">${church.place}</div>
          <div class="mt-1 small text-black daysAgo">${registeredWhen}</div>
        </div>
      `;

      latestRegistrantsEl.appendChild(el);
    });

    // Hide or show church city
    const selectedChurch = document.querySelector("#latestRegistrantsChurchID")
      .selectedOptions[0].value;
    if (selectedChurch == 0) {
      showChurchCityLatestRegistrants();
    } else {
      hideChurchCityLatestRegistrants();
    }

    return resolve();
  });
}

async function populateChurches() {
  const churchDropdownLatestInvites = document.querySelector(
    "#latestInvitesChurchID"
  );
  const churchDropdownLatestRegistrants = document.querySelector(
    "#latestRegistrantsChurchID"
  );
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

  churchesHtml =
    `<option value="0" data-name="${getPhrase("allchurches")}">
${getPhrase("allchurches")}
</option>
` + churchesHtml;

  churchDropdownLatestRegistrants.innerHTML = churchesHtml;
  churchDropdownLatestInvites.innerHTML = churchesHtml;

  selectUserChurchLatestInvites();
  selectUserChurchLatestRegistrants();

  syncChurches();
}

function redirectIfNecessary() {
  return new Promise(async (resolve, reject) => {
    const launchedFromHomescreen =
      window.location.search === "?utm_source=homescreen" ? true : false;
    const settings = await localforage.getItem("settings");
    let redirectUrl = "";
    let redirect = false;

    if (!launchedFromHomescreen) return resolve(false);
    if (!settings) return resolve(false);
    if (!settings.openingPage) return resolve(false);

    switch (settings.openingPage) {
      case "home":
        redirect = false;
        break;
      case "send an invite":
        redirectUrl = "/send/";
        if (launchedFromHomescreen) redirect = true;
        break;
      case "my invites":
        redirectUrl = "/invites/";
        if (launchedFromHomescreen) redirect = true;
        break;
      case "follow up list":
        redirectUrl = "/followup/";
        if (launchedFromHomescreen) redirect = true;
        break;
      default:
        break;
    }

    if (redirect && redirectUrl.length) {
      window.location.href = redirectUrl;
      return resolve(true);
    }

    return resolve(redirect);
  });
}

async function selectUserChurchLatestInvites() {
  const myUserId = getUserId();
  const myChurchId = await getUserChurchId(myUserId);
  const church = getStoredChurch(myChurchId);
  const userChurchId = church.id;
  const churchElLatestInvites = document.querySelector(
    "#latestInvitesChurchID"
  );
  const churchNameElLatestInvites = document.querySelector(
    "#selectedChurchNameLatestInvites"
  );
  const storedChurchLatestInvites = localStorage.getItem("latestInvitesChurch");

  if (storedChurchLatestInvites) {
    churchElLatestInvites.value = storedChurchLatestInvites;

    if (storedChurchLatestInvites == 0) {
      churchNameElLatestInvites.classList.add("d-none");
      hideChurchCityLatestInvites();
      return;
    }
  }

  if (typeof userChurchId !== "number") {
    churchElLatestInvites.value = 0;
    churchNameElLatestInvites.classList.add("d-none");
    hideChurchCityLatestInvites();
    return;
  }

  churchElLatestInvites.value = userChurchId;

  const churchName = church.name;

  churchNameElLatestInvites.innerText = churchName;

  churchNameElLatestInvites.classList.remove("d-none");

  hideChurchCityLatestInvites();
}

async function selectUserChurchLatestRegistrants() {
  const myUserId = getUserId();
  const myChurchId = await getUserChurchId(myUserId);
  const church = getStoredChurch(myChurchId);
  const userChurchId = church.id;
  const churchElLatestRegistrants = document.querySelector(
    "#latestRegistrantsChurchID"
  );
  const churchNameElLatestRegistrants = document.querySelector(
    "#selectedChurchNameLatestRegistrants"
  );
  const storedChurchLatestRegistrants = localStorage.getItem(
    "latestRegistrantsChurch"
  );

  if (storedChurchLatestRegistrants) {
    churchElLatestRegistrants.value = storedChurchLatestRegistrants;

    if (storedChurchLatestRegistrants == 0) {
      churchNameElLatestRegistrants.classList.add("d-none");
      showChurchCityLatestRegistrants();
      return;
    }
  }

  if (typeof userChurchId !== "number") {
    churchElLatestRegistrants.value = 0;
    churchNameElLatestRegistrants.classList.add("d-none");
    hideChurchCityLatestRegistrants();
    return;
  }

  churchElLatestRegistrants.value = userChurchId;

  const churchName = church.name;

  churchNameElLatestRegistrants.innerText = churchName;

  churchNameElLatestRegistrants.classList.remove("d-none");

  hideChurchCityLatestRegistrants();
}

function showContentForLeaders() {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) return;

  const { canAuthorize, canAuthToAuth } = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  );

  if (!canAuthorize && !canAuthToAuth) return;

  document
    .querySelectorAll(".leadersOnly")
    .forEach((item) => item.classList.remove("d-none"));
}

function syncOnLogin() {
  return new Promise((resolve, reject) => {
    const proceedWithSync = sessionStorage.getItem("syncOnLogin")
      ? true
      : false;

    if (proceedWithSync) {
      sessionStorage.removeItem("syncOnLogin");
      Promise.all([
        getCountries(getLang()),
        syncChurches(),
        syncEvents(),
        syncInvites(),
        syncUpdatedInvites(),
        syncAllNotes(),
        syncSettings(),
        syncLatestRegistrants(),
      ]).then((result) => {
        try {
          syncPushSubscription();
        } catch (error) {
          console.error(error);
        }

        return resolve();
      });
    } else {
      return resolve();
    }
  });
}

async function toggleUsersIFollow() {
  localforage.getItem("followedUsers").then((followedUsers) => {
    if (Array.isArray(followedUsers) && followedUsers.length) {
      const el = document.querySelector("[data-i18n='followinglink']");
      if (!el) return;
      const userid = getUserId();
      const link = `following/#${userid}`;
      el.setAttribute("href", link);
      el.classList.remove("d-none");
    }
  });
}

function onChurchChangedLatestInvites(e) {
  const churchEl = document.querySelector("#latestInvitesChurchID");
  const churchName = churchEl.selectedOptions[0].getAttribute("data-name");
  const churchNameEl = document.querySelector(
    "#selectedChurchNameLatestInvites"
  );
  const churchid = Number(e.target.value);
  const latestInvitesEl = document.querySelector("#latestInvites");

  if (churchid === 0) {
    churchNameEl.classList.add("d-none");
    churchNameEl.innerText = "";
    showChurchCityLatestInvites();
  } else {
    churchNameEl.innerText = churchName;
    churchNameEl.classList.remove("d-none");
    hideChurchCityLatestInvites();
  }

  localStorage.setItem("latestInvitesChurch", churchid);

  latestInvitesEl.innerHTML = `
    <div class="mt-3">
      <img
        src="/_assets/img/spinner.svg"
        width="200"
        height="200"
        style="max-width: 100%"
      />
    </div>
  `;

  syncLatestInvites([churchid])
    .then(() => {
      latestInvites();
    })
    .catch(() => {
      latestInvitesEl.innerHTML = `
        <div class="mt-3">
          ${getPhrase("timedOut")};
        </div>
      `;
    });
}

function onChurchChangedLatestRegistrants(e) {
  const churchEl = document.querySelector("#latestRegistrantsChurchID");
  const churchName = churchEl.selectedOptions[0].getAttribute("data-name");
  const churchNameEl = document.querySelector(
    "#selectedChurchNameLatestRegistrants"
  );
  const churchid = Number(e.target.value);
  const latestRegistrantsEl = document.querySelector("#latestRegistrants");

  if (churchid === 0) {
    churchNameEl.classList.add("d-none");
    churchNameEl.innerText = "";
    showChurchCityLatestRegistrants();
  } else {
    churchNameEl.innerText = churchName;
    churchNameEl.classList.remove("d-none");
    hideChurchCityLatestRegistrants();
  }

  localStorage.setItem("latestRegistrantsChurch", churchid);

  latestRegistrantsEl.innerHTML = `
    <div class="mt-3">
      <img
        src="/_assets/img/spinner.svg"
        width="200"
        height="200"
        style="max-width: 100%"
      />
    </div>
  `;

  syncLatestRegistrants([churchid])
    .then(() => {
      latestRegistrants();
    })
    .catch(() => {
      latestRegistrantsEl.innerHTML = `
        <div class="mt-3">
          ${getPhrase("timedOut")};
        </div>
      `;
    });
}

function attachListeners() {
  document
    .querySelector("#latestRegistrantsChurchID")
    .addEventListener("change", onChurchChangedLatestRegistrants);

  document
    .querySelector("#latestInvitesChurchID")
    .addEventListener("change", onChurchChangedLatestInvites);
}

async function init() {
  await syncOnLogin();

  const isRedirecting = await redirectIfNecessary();

  if (!isRedirecting) {
    window.history.replaceState(
      null,
      null,
      location.origin + location.pathname.split("/")[0]
    );
    populateContent().then(async () => {
      toggleUsersIFollow();
      await populateChurches();
      await latestInvites().then(() => syncLatestInvites());
      await latestRegistrants().then(() => syncLatestRegistrants());
      attachListeners();
      globalHidePageSpinner();
    });
  }

  showContentForLeaders();
}

init();
