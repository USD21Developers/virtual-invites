function followUser(userid, e) {
  return new Promise(async (resolve, reject) => {
    const endpoint = `${getApiHost()}/follow-user`;
    const accessToken = await getAccessToken();

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        userid: userid,
      }),
      keepalive: true,
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        switch (data.msg) {
          case "follow successful":
            e.target.setAttribute("data-status", "followed");
            const quantityNowFollowing = data.quantityNowFollowing;
            const userFollowed = data.followedid;
            const whenFollowed = moment
              .tz(moment.now(), moment.tz.guess())
              .format();
            updateFollowActivity(userFollowed, whenFollowed, "followed");
            showQuantityFollowing(quantityNowFollowing);
            resolve(data.msg);
            break;
          default:
            e.target.setAttribute("data-status", "follow");
            e.target.innerText = getPhrase("btnFollow");
            resolve(data.msg);
        }
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

async function getFollowStatus() {
  const followActivityJSON =
    sessionStorage.getItem("followActivity") || JSON.stringify([]);
  const followActivity = JSON.parse(followActivityJSON);
  const users = followActivity.map((item) => item.userid);
  const endpoint = `${getApiHost()}/follow-status`;
  const accessToken = await getAccessToken();

  return new Promise((resolve, reject) => {
    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        userids: users,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.msgType === "error") {
          reject(data.msg);
        } else {
          resolve(data.followStatus);
        }
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

function hideSpinner() {
  const searchSpinner = document.querySelector("#searchSpinner");

  searchSpinner.classList.add("d-none");
}

function noMatchesFound() {
  const searchResults = document.querySelector("#searchResults");

  searchResults.innerHTML = `
    <p class="text-center mb-5">
      <strong>${getPhrase("noUsersFound")}</strong>
    </p>
  `;
  searchResults.classList.remove("d-none");

  customScrollTo("#searchResults");
}

function populateNowFollowing() {
  return new Promise(async (resolve, reject) => {
    const userid = parseInt(
      JSON.parse(atob(localStorage.getItem("refreshToken").split(".")[1]))
        .userid
    );
    const accessToken = await getAccessToken();
    const endpoint = `${getApiHost()}/following-quantity/${userid}`;

    fetch(endpoint, {
      mode: "cors",
      method: "GET",
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        switch (data.msg) {
          case "retrieved quantity of users following":
            const quantity = data.quantity;
            showQuantityFollowing(quantity);
            resolve();
            break;
          default:
            console.error(data.msg);
            reject(data.msg);
        }
      })
      .catch((err) => {
        console.error(err);
        document.querySelector("#usersNowFollowing").classList.add("d-none");
        reject(err);
      });
  });
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
    let skipThisIteration = false;

    if (!churchesInCountry.length) continue;

    churchesInCountry.sort((a, b) => (a.place > b.place ? 1 : -1));
    churchesInCountry.forEach((church) => {
      const { country, id, name, place } = church;
      if (!place) {
        skipThisIteration = true;
        return;
      }
      const option = `<option value="${id}" data-name="${name}">${place}</option>`;
      churchesInCountryHtml += option;
    });

    if (skipThisIteration) continue;

    churchesInCountryHtml = `<optgroup label="${countryName}" data-country="${countryIso}">${churchesInCountryHtml}</optgroup>`;
    if (churchesInCountryHtml.length) {
      churchesHtml += churchesInCountryHtml;
    }
  }

  churchDropdown.innerHTML = churchesHtml;

  selectUserChurch();
}

async function refreshButtons(dataFromApi) {
  let buttonsToRefresh;
  const followActivityJSON =
    sessionStorage.getItem("followActivity") || JSON.stringify([]);
  const followActivity = JSON.parse(followActivityJSON);

  if (dataFromApi) {
    buttonsToRefresh = dataFromApi;
  } else {
    if (!followActivity.length) return;
    buttonsToRefresh = followActivity.map((item) => {
      return {
        userid: item.userid,
        isFollowing: item.action === "followed" ? true : false,
      };
    });
  }

  buttonsToRefresh.forEach((item) => {
    const { userid, isFollowing } = item;
    const el = document.querySelector(`[data-follow-userid="${userid}"]`);

    if (!el) return;
    if (isFollowing) {
      el.setAttribute("data-status", "followed");
      el.classList.remove("btn-primary");
      el.classList.add("btn-success");
      el.innerText = getPhrase("btnFollowing");
    } else {
      el.setAttribute("data-status", "follow");
      el.classList.remove("btn-success");
      el.classList.add("btn-primary");
      el.innerText = getPhrase("btnFollow");
    }
  });

  if (!dataFromApi && followActivity.length) {
    const dataFromApi = await getFollowStatus();
    sessionStorage.removeItem("followActivity");
    refreshButtons(dataFromApi);
  }
}

function selectUserChurch() {
  const userChurchId = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  ).churchid;
  const churchEl = document.querySelector("#churchid");

  if (typeof userChurchId !== "number") return;

  churchEl.value = userChurchId;

  const churchName = churchEl.selectedOptions[0].getAttribute("data-name");
  const churchNameEl = document.querySelector("#selectedChurchName");

  churchNameEl.innerText = churchName;
}

function showMatchesFound(matches) {
  const searchResults = document.querySelector("#searchResults");
  const numMatches = matches.length;
  let msgResultsFound;

  if (numMatches === 1) {
    msgResultsFound = getPhrase("oneUserFound");
  } else if (numMatches > 1) {
    msgResultsFound = getPhrase("numUsersFound").replace(
      "{quantity}",
      numMatches
    );
  } else {
    msgResultsFound = getPhrase("noUsersFound");
  }

  let html = "";

  for (let i = 0; i < numMatches; i++) {
    const userid = matches[i].userid;
    const firstname = matches[i].firstname;
    const lastname = matches[i].lastname;
    const gender = matches[i].gender;
    const followid = matches[i].followid;
    const profilephoto = matches[i].profilephoto.replace("400.jpg", "140.jpg");
    const btnFollow =
      followid === null ? getPhrase("btnFollow") : getPhrase("btnFollowing");
    const btnProfile = getPhrase("btnProfile");
    const defaultImg =
      gender === "male" ? "avatar_male.svg" : "avatar_female.svg";

    if (followid === null) {
      html += `
        <div class="text-center result">
          <div class="d-inline-block profilephoto ${gender}">
            <img src="${profilephoto}" alt="${firstname} ${lastname}" width="140" height="140" onerror="this.onerror=null;this.src='/_assets/img/${defaultImg}';">
          </div>
          <h3 class="mt-2 mb-3">${firstname} ${lastname}</h4>
          <button type="button" class="btn btn-primary btn-sm btn-follow my-0 mr-2" data-status="follow" data-follow-userid="${userid}">
            ${btnFollow}
          </button>
          <a href="/u/#${userid}" class="btn btn-light btn-sm btn-profile my-0 ml-2">
            ${btnProfile}
          </a>
        </div>
      `;
    } else {
      html += `
        <div class="text-center result">
          <div class="d-inline-block profilephoto ${gender}">
            <img src="${profilephoto}" alt="${firstname} ${lastname}" width="140" height="140" onerror="this.onerror=null;this.src='/_assets/img/${defaultImg}';">
          </div>
          <h3 class="mt-0 mb-3">${firstname} ${lastname}</h4>
          <button type="button" class="btn btn-success btn-sm btn-follow my-0 mr-2" data-status="followed" data-follow-userid="${userid}">
            ${btnFollow}
          </button>
          <a href="/u/#${userid}" class="btn btn-light btn-sm btn-profile my-0 ml-2">
            ${btnProfile}
          </a>
        </div>
      `;
    }
  }

  html = `
    <p class="text-center mb-5">
      <strong>${msgResultsFound}</strong>
    </p>
    
    <div class="text-center">
      ${html}
    </div>
  `;

  searchResults.innerHTML = html;

  document
    .querySelectorAll(".btn-follow")
    .forEach((item) => item.addEventListener("click", onFollowClicked));

  hideSpinner();

  searchResults.classList.remove("d-none");

  customScrollTo("#searchResults");
}

function showQuantityFollowing(quantity) {
  const usersNowFollowingEl = document.querySelector("#usersNowFollowing");
  const modalTopParagraphEl = document.querySelector("#modalTopParagraph");

  if (quantity === 0) {
    const phraseFollowingNone = getPhrase("followingNone");
    usersNowFollowingEl.innerHTML = phraseFollowingNone;
    usersNowFollowingEl.classList.remove("d-none");

    if (modalTopParagraphEl) modalTopParagraphEl.classList.add("d-none");
  } else if (quantity === 1) {
    const phraseFollowing1 = getPhrase("following1").replace(
      "{1}",
      `<strong><a href="../following/" class="text-primary followingQuantity">${quantity}</a></strong>`
    );
    usersNowFollowingEl.innerHTML = phraseFollowing1;
    usersNowFollowingEl.classList.remove("d-none");
    if (modalTopParagraphEl) {
      modalTopParagraphEl.innerText = getPhrase("modalFollowing1").replace(
        "{quantity}",
        quantity
      );
      modalTopParagraphEl.classList.remove("d-none");
    }
  } else {
    const phraseFollowingX = getPhrase("followingX").replace(
      "{quantity}",
      `<strong><a href="#" class="text-primary followingQuantity">${quantity}</a></strong>`
    );
    usersNowFollowingEl.innerHTML = phraseFollowingX;
    usersNowFollowingEl.classList.remove("d-none");
    if (modalTopParagraphEl) {
      modalTopParagraphEl.innerText = getPhrase("modalFollowingX").replace(
        "{quantity}",
        quantity
      );
      modalTopParagraphEl.classList.remove("d-none");
    }
  }
}

function showSpinner() {
  const searchSpinner = document.querySelector("#searchSpinner");

  searchSpinner.classList.remove("d-none");

  customScrollTo("#searchSpinner");
}

function showTimeoutMessage() {
  // TODO
}

function unfollowUser(userid, e) {
  return new Promise(async (resolve, reject) => {
    const endpoint = `${getApiHost()}/unfollow-user`;
    const accessToken = await getAccessToken();

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        userid: userid,
      }),
      keepalive: true,
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        switch (data.msg) {
          case "unfollow successful":
            e.target.setAttribute("data-status", "follow");
            e.target.classList.remove("btn-success");
            e.target.classList.add("btn-primary");
            e.target.innerText = getPhrase("btnFollow");
            const quantityNowFollowing = data.quantityNowFollowing;
            const userUnfollowed = data.unfollowedid;
            const whenUnfollowed = moment
              .tz(moment.now(), moment.tz.guess())
              .format();
            updateFollowActivity(userUnfollowed, whenUnfollowed, "unfollowed");
            showQuantityFollowing(quantityNowFollowing);
            resolve(data.msg);
            break;
          default:
            e.target.setAttribute("data-status", "followed");
            e.target.classList.remove("btn-primary");
            e.target.classList.add("btn-success");
            e.target.innerText = getPhrase("btnFollowing");
            resolve(data.msg);
        }
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

function validate(e) {
  let isValid = true;
  const firstName = e.target.searchedFirstName.value.trim();
  const lastName = e.target.searchedLastName.value.trim();
  const churchid = e.target.churchid.value.trim() || "";

  if (firstName === "" && lastName === "") {
    isValid = false;
  }

  if (churchid === "") {
    isValid = false;
  }

  return isValid;
}

function onChurchChanged() {
  const churchEl = document.querySelector("#churchid");
  const churchName = churchEl.selectedOptions[0].getAttribute("data-name");
  const churchNameEl = document.querySelector("#selectedChurchName");

  churchNameEl.innerText = churchName;
}

async function onNameSearched(e) {
  e.preventDefault();

  e.target.querySelectorAll(".is-invalid").forEach((item) => {
    item.classList.remove("is-invalid");
  });

  const searchedFirstName = e.target.searchedFirstName.value || "";
  const searchedLastName = e.target.searchedLastName.value || "";
  const searchResults = document.querySelector("#searchResults");
  const churchid = e.target.churchid.value || "";
  let endpoint = `${getApiHost()}/follow-search`;
  const controller = new AbortController();
  const timeout = 8000;

  // Validate name
  if (searchedFirstName === "" && searchedLastName === "") {
    formError("#searchedFirstName", getPhrase("errorNameIsRequired"));
    customScrollTo("#searchedFirstName");
    return;
  }

  // Validate church
  if (churchid === "" || typeof churchid === "undefined") {
    formError("#churchid", getPhrase("errorChurchIsRequired"));
    customScrollTo("#churchid");
    return;
  }

  searchResults.classList.add("d-none");
  showSpinner();

  const accessToken = await getAccessToken();

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      searchedFirstName: searchedFirstName,
      searchedLastName: searchedLastName,
      churchid: churchid,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data && data.hasOwnProperty("matches") && data.matches.length) {
        const matches = data.matches.filter((item) => item.followid === null);
        showMatchesFound(matches);
        hideSpinner();
      } else {
        noMatchesFound();
        hideSpinner();
      }
    })
    .catch((err) => {
      console.error(err);
      hideSpinner();
    });

  setTimeout(() => {
    controller.abort();
    hideSpinner();
    showTimeoutMessage();
  }, timeout);
}

function onFirstNameSearchInputted(e) {
  const searchTerm = e.target.value || "";
  const searchForm = document.querySelector("#searchedFirstName");

  if (searchTerm.trim().value !== "") {
    searchForm.querySelectorAll(".is-invalid").forEach((item) => {
      item.classList.remove("is-invalid");
    });
  }
}

async function onFollowClicked(e) {
  const userid = parseInt(e.target.getAttribute("data-follow-userid"));
  const status = e.target.getAttribute("data-status");

  if (status === "follow") {
    // Change button text from "Follow" to "Following"
    document
      .querySelectorAll(`[data-follow-userid='${userid}']`)
      .forEach((item) => {
        item.setAttribute("data-status", "followed");
        item.classList.remove("btn-primary");
        item.classList.add("btn-success");
        item.innerText = getPhrase("btnFollowing");
      });
    followUser(userid, e);
  } else if (status === "followed") {
    // Change button text from "Following" to "Follow"
    e.target.setAttribute("data-status", "follow");
    e.target.classList.remove("btn-success");
    e.target.classList.add("btn-primary");
    e.target.innerText = getPhrase("btnFollow");
    document
      .querySelectorAll(`[data-follow-userid='${userid}']`)
      .forEach((item) => {
        item.setAttribute("data-status", "follow");
        item.classList.remove("btn-success");
        item.classList.add("btn-primary");
        item.innerText = getPhrase("btnFollow");
      });
    unfollowUser(userid, e);
  }
}

function onLastNameSearchInputted(e) {
  const searchTerm = e.target.value || "";
  const searchForm = document.querySelector("#searchedLastName");

  if (searchTerm.trim().value !== "") {
    searchForm.querySelectorAll(".is-invalid").forEach((item) => {
      item.classList.remove("is-invalid");
    });
  }

  // TODO:  Check indexedDB for list of all registered users in the church congregation of the current user. If populated, insert names into the datalist. Then sync silently.
}

function onVisibilityChange(e) {
  if (document.visibilityState === "visible") {
    refreshButtons();
  }
}

function attachListeners() {
  document
    .querySelector("#formSearchByName")
    .addEventListener("submit", onNameSearched);
  document
    .querySelector("#searchedFirstName")
    .addEventListener("input", onFirstNameSearchInputted);
  document
    .querySelector("#searchedLastName")
    .addEventListener("input", onLastNameSearchInputted);
  document
    .querySelector("#churchid")
    .addEventListener("change", onChurchChanged);
  window.addEventListener("visibilitychange", onVisibilityChange);
}

async function init() {
  populateChurches();
  await populateContent();
  await populateNowFollowing();
  refreshButtons();
  globalHidePageSpinner();
  attachListeners();
}

init();
