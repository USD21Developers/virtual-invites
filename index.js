function hideChurchCity() {
  const latestRegistrants = document.querySelector("#latestRegistrants");
  latestRegistrants.querySelectorAll(".churchCity").forEach((item) => {
    item.classList.add("d-none");
  });
}

function showChurchCity() {
  const latestRegistrants = document.querySelector("#latestRegistrants");
  latestRegistrants.querySelectorAll(".churchCity").forEach((item) => {
    item.classList.remove("d-none");
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
      syncLatestRegistrants([churchid]);
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
          <div class="mt-1 small text-black daysAgo">${daysAgo}</div>
        </div>
      `;

      latestRegistrantsEl.appendChild(el);

      syncLatestRegistrants().then(() => {
        latestRegistrants();
      });

      return resolve();
    });
  });
}

async function populateChurches() {
  const churchDropdown = document.querySelector("#latestRegistrantsChurchID");
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

  churchDropdown.innerHTML = churchesHtml;

  selectUserChurch();

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

async function selectUserChurch() {
  const myUserId = getUserId();
  const myChurchId = await getUserChurchId(myUserId);
  const church = getStoredChurch(myChurchId);
  const userChurchId = church.id;
  const churchEl = document.querySelector("#latestRegistrantsChurchID");
  const churchNameEl = document.querySelector("#selectedChurchName");
  const storedChurch = localStorage.getItem("latestRegistrantsChurch");

  if (storedChurch) {
    churchEl.value = storedChurch;

    if (Number(storedChurch) === 0) {
      churchNameEl.classList.add("d-none");
      hideChurchCity();
      return;
    }
  }

  if (typeof userChurchId !== "number") {
    churchEl.value = 0;
    churchNameEl.classList.add("d-none");
    hideChurchCity();
    return;
  }

  churchEl.value = userChurchId;

  const churchName = church.name;

  churchNameEl.innerText = churchName;

  churchNameEl.classList.remove("d-none");

  showChurchCity();
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

function onChurchChanged(e) {
  const churchEl = document.querySelector("#latestRegistrantsChurchID");
  const churchName = churchEl.selectedOptions[0].getAttribute("data-name");
  const churchNameEl = document.querySelector("#selectedChurchName");
  const churchid = Number(e.target.value);
  const latestRegistrantsEl = document.querySelector("#latestRegistrants");

  if (churchid === 0) {
    churchNameEl.classList.add("d-none");
    churchNameEl.innerText = "";
    showChurchCity();
  } else {
    churchNameEl.innerText = churchName;
    churchNameEl.classList.remove("d-none");
    hideChurchCity();
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
    .addEventListener("change", onChurchChanged);
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
      await latestRegistrants();
      attachListeners();
      globalHidePageSpinner();
    });
  }

  showContentForLeaders();
}

init();
