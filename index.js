function hideChurchCityLatestInvites() {
  const latestInvitesEl = document.querySelector("#latestInvites");

  latestInvitesEl
    .querySelectorAll(".churchCity")
    .forEach((item) => item.classList.add("d-none"));
}

function showChurchCityLatestInvites() {
  const latestInvitesEl = document.querySelector("#latestInvites");

  latestInvitesEl
    .querySelectorAll(".churchCity")
    .forEach((item) => item.classList.remove("d-none"));
}

function hideChurchCityLatestRegistrants() {
  const latestRegistrantsEl = document.querySelector("#latestRegistrants");

  latestRegistrantsEl
    .querySelectorAll(".churchCity")
    .forEach((item) => item.classList.add("d-none"));
}

function showChurchCityLatestRegistrants() {
  const latestRegistrantsEl = document.querySelector("#latestRegistrants");

  latestRegistrantsEl
    .querySelectorAll(".churchCity")
    .forEach((item) => item.classList.remove("d-none"));
}

function showOnlyChurchesWithInvites(churchIds) {
  const dropdownEl = document.querySelector("#latestInvitesChurchID");

  dropdownEl.querySelectorAll("option").forEach((item) => {
    if (!churchIds.includes(item)) {
      if (item.value == 0) return;
      item.remove();
    }
  });

  dropdownEl.querySelectorAll("optgroup").forEach((optgroup) => {
    if (optgroup.querySelectorAll("option").length === 0) {
      optgroup.remove();
    }
  });
}

function showOnlyChurchesWithRegistrants(churchIds) {
  const dropdownEl = document.querySelector("#latestRegistrantsChurchID");

  dropdownEl.querySelectorAll("option").forEach((item) => {
    if (!churchIds.includes(item)) {
      if (item.value == 0) return;
      item.remove();
    }
  });

  dropdownEl.querySelectorAll("optgroup").forEach((optgroup) => {
    if (optgroup.querySelectorAll("option").length === 0) {
      optgroup.remove();
    }
  });
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

    let churchIds = [];

    invites.forEach((item) => {
      const {
        invitationid,
        userid,
        eventtype,
        firstname,
        lastname,
        churchid,
        gender,
        createdAt,
        profilephoto,
      } = item;

      churchIds.push(churchid);

      const profilePhoto140 = profilephoto.replaceAll("__400.jpg", "__140.jpg");
      const el = document.createElement("a");
      const church = getStoredChurch(churchid);
      const createdDate = new Date(createdAt);
      const now = new Date();
      const diffInMs = createdDate - now;
      const diffInSeconds = Math.round(diffInMs / 1000);
      const daysAgo = getRelativeTime(diffInSeconds);
      let eventAction = getPhrase("latestInvitesAction");

      eventAction = eventAction.replaceAll("{DAYS-AGO}", daysAgo);

      if (eventtype === "bible talk") {
        eventAction = eventAction.replaceAll(
          "{EVENT-TYPE}",
          getGlobalPhrase("bibletalk")
        );
      } else if (eventtype === "church") {
        eventAction = eventAction.replaceAll(
          "{EVENT-TYPE}",
          getGlobalPhrase("church")
        );
      } else {
        eventAction = getPhrase("latestInvitesActionOther");
      }

      el.classList.add("media");
      el.classList.add("invite");
      el.classList.add(gender);
      el.setAttribute("href", `/u/#${userid}`);
      el.innerHTML = `
        <img
          class="mr-3"
          src="${profilePhoto140}"
          alt="${firstname} ${lastname}"
        />
        <div class="media-body">
          <h4 class="my-0 senderName">${firstname} ${lastname}</h4>
          <div class="my-1 churchCity">${church.place}</div>
          <div class="mt-1 daysAgo">${daysAgo}</div>
          <div class="my-1 eventType">${eventAction}</div>
        </div>
      `;

      latestInvitesEl.appendChild(el);
    });

    const selectedChurchEl = document.querySelector("#latestInvitesChurchID");
    const selectedChurch = selectedChurchEl.selectedOptions[0].value;

    await populateChurches(churchIds);

    // Hide or show church city
    if (selectedChurch == 0) {
      showChurchCityLatestInvites();
    } else {
      hideChurchCityLatestInvites();
    }

    showOnlyChurchesWithInvites(churchIds);

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

    let churchIds = [];

    registrants.forEach((item) => {
      const {
        userid,
        churchid,
        firstname,
        lastname,
        gender,
        createdAt,
        profilephoto,
      } = item;

      churchIds.push(churchid);

      const profilePhoto140 = profilephoto.replaceAll("__400.jpg", "__140.jpg");
      const el = document.createElement("a");
      const church = getStoredChurch(churchid);
      const createdDate = new Date(createdAt);
      const now = new Date();
      const diffInMs = createdDate - now;
      const diffInSeconds = Math.round(diffInMs / 1000);
      const daysAgo = getRelativeTime(diffInSeconds);
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
          alt="${firstname} ${lastname}"
        />
        <div class="media-body">
          <h4 class="my-0 registrantName">${firstname} ${lastname}</h4>
          <div class="my-1 churchCity">${church.place}</div>
          <div class="mt-1 daysAgo">${registeredWhen}</div>
          <div class="my-1">&nbsp;</div>
        </div>
      `;

      latestRegistrantsEl.appendChild(el);
    });

    const selectedChurchEl = document.querySelector(
      "#latestRegistrantsChurchID"
    );
    const selectedChurch = selectedChurchEl.selectedOptions[0].value;

    await populateChurches(churchIds);

    // Hide or show church city
    if (selectedChurch == 0) {
      showChurchCityLatestRegistrants();
    } else {
      hideChurchCityLatestRegistrants();
    }

    showOnlyChurchesWithRegistrants(churchIds);

    return resolve();
  });
}

async function populateChurches(churchIds) {
  const churchDropdownLatestInvites = document.querySelector(
    "#latestInvitesChurchID"
  );
  const churchDropdownLatestRegistrants = document.querySelector(
    "#latestRegistrantsChurchID"
  );
  const countryData = await getCountries(getLang());
  const countries = countryData.names;
  let churches = await getChurches();

  if (churchIds && Array.isArray(churchIds)) {
    churches = churches.filter((item) => churchIds.includes(item.id));
  }

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
    .then((data) => {
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
    .then((data) => {
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
  /* document
    .querySelector("#latestRegistrantsChurchID")
    .addEventListener("change", onChurchChangedLatestRegistrants); */
  /* document
    .querySelector("#latestInvitesChurchID")
    .addEventListener("change", onChurchChangedLatestInvites); */
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
      // await latestInvites();
      // await latestRegistrants();
      attachListeners();
      globalHidePageSpinner();

      syncLatestInvites().then((data) => {
        // latestInvites();
      });

      syncLatestRegistrants().then((data) => {
        // latestRegistrants();
      });
    });
  }

  showContentForLeaders();
}

init();
