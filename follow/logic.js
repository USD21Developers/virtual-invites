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

async function populateChurches() {
  const churchDropdown = document.querySelector("#churchid");
  const endpoint = `${getApiServicesHost()}/churches`;
  const churchesStored = localStorage.getItem("churches") || "";

  const retrieveChurches = () => {
    return new Promise((resolve, reject) => {
      fetch(endpoint)
        .then((res) => res.json())
        .then((data) => {
          const churchesJSON = JSON.stringify(data);
          localStorage.setItem("churches", churchesJSON);
          resolve(churchesJSON);
        })
        .catch((err) => {
          console.error(err);
          reject(err);
        });
    });
  };

  const renderChurches = (churches) => {
    churches.forEach((item) => {
      const { iso: countryCode, name, churches } = item.country;
      let countryName = name;

      if (typeof name !== "string") return;
      if (countryName.trim() === "") return;

      if (countryCode === "us") countryName = "United States";
      const optgroup = document.createElement("optgroup");
      optgroup.label = `${countryName}:`;
      churchDropdown.appendChild(optgroup);
      churches.forEach((church) => {
        const { id, name, place } = church;
        const option = document.createElement("option");

        if (typeof place !== "string" || place.trim() === "") return;

        option.value = id;
        option.innerText = place;
        option.setAttribute("data-name", name);
        option.setAttribute("data-place", place);
        optgroup.setAttribute("data-country", countryCode);
        optgroup.appendChild(option);
      });
    });
    $(
      ".floating-label .custom-select, .floating-label .form-control"
    ).floatinglabel();

    selectUserChurch();
  };

  if (churchesStored.length) {
    const churches = JSON.parse(churchesStored);
    renderChurches(churches);

    const churchesJSON = await retrieveChurches();
    localStorage.setItem("churches", churchesJSON);
  } else {
    const churchesJSON = await retrieveChurches();
    const churches = churchesJSON.length ? JSON.parse(churchesJSON) : [];

    localStorage.setItem("churches", churchesJSON);
    renderChurches(churches);
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
          <img class="mx-3" src="${profilephoto}" alt="${firstname} ${lastname}" width="140" height="140" onerror="this.onerror=null;this.src='/_assets/img/${defaultImg}';">
          <h3 class="mt-0 mb-3">${firstname} ${lastname}</h4>
          <button type="button" class="btn btn-primary btn-sm btn-follow my-0 mr-2" data-status="follow" data-follow-userid="${userid}">
            ${btnFollow}
          </button>
          <button type="button" class="btn btn-light btn-sm btn-profile my-0 ml-2" data-status="follow" data-profile-userid="${userid}">
            ${btnProfile}
          </button>
        </div>
      `;
    } else {
      html += `
        <div class="text-center result">
          <img class="mx-3" src="${profilephoto}" alt="${firstname} ${lastname}" width="140" height="140" onerror="this.onerror=null;this.src='/_assets/img/${defaultImg}';">
          <h3 class="mt-0 mb-3">${firstname} ${lastname}</h4>
          <button type="button" class="btn btn-success btn-sm btn-follow my-0 mr-2" data-status="followed" data-follow-userid="${userid}">
            ${btnFollow}
          </button>
          <button type="button" class="btn btn-light btn-sm btn-profile my-0 ml-2" data-status="followed" data-profile-userid="${userid}">
            ${btnProfile}
          </button>
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
  document
    .querySelectorAll(".btn-profile")
    .forEach((item) => item.addEventListener("click", onProfileClicked));

  hideSpinner();

  searchResults.classList.remove("d-none");

  customScrollTo("#searchResults");
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

  if (firstName === "" && lastName === "") {
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
  const isValid = validate(e);

  if (!isValid) {
    formError("#searchedFirstName", getPhrase("errorNameIsRequired"));
    customScrollTo("#searchedFirstName");
    return;
  }

  const accessToken = await getAccessToken();

  searchResults.classList.add("d-none");
  showSpinner();

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

  // TODO:  Check indexedDB for list of all registered users in the church congregation of the current user. If populated, insert names into the datalist. Then sync silently.
}

async function onFollowClicked(e) {
  const userid = parseInt(e.target.getAttribute("data-follow-userid"));
  const status = e.target.getAttribute("data-status");

  if (status === "follow") {
    // Change button text from "Follow" to "Following"
    e.target.setAttribute("data-status", "followed");
    e.target.classList.remove("btn-primary");
    e.target.classList.add("btn-success");
    e.target.innerText = getPhrase("btnFollowing");
    followUser(userid, e);
  } else if (status === "followed") {
    // Change button text from "Following" to "Follow"
    e.target.setAttribute("data-status", "follow");
    e.target.classList.remove("btn-success");
    e.target.classList.add("btn-primary");
    e.target.innerText = getPhrase("btnFollow");
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

function onProfileClicked(e) {
  const userid = parseInt(e.target.getAttribute("data-profile-userid"));
  const url = `/u/#${userid}`;

  window.location.href = url;
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
}

async function init() {
  populateChurches();
  await populateContent();
  globalHidePageSpinner();
  attachListeners();
}

init();
