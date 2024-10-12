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

async function populatePhotosPendingReview() {
  const quantityPhotoReviewEl = document.querySelector("#quantityPhotoReview");
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
      const { photos } = data;

      if (!photos) return;
      if (!Array.isArray(photos)) return;

      if (photos.length === 0) {
        quantityPhotoReviewEl.classList.remove("badge-danger");
        quantityPhotoReviewEl.classList.add("badge-light");
        quantityPhotoReviewEl.innerHTML = "0";
        return;
      }

      quantityPhotoReviewEl.classList.remove("badge-light");
      quantityPhotoReviewEl.classList.add("badge-danger");
      quantityPhotoReviewEl.innerHTML = photos.length;
    })
    .catch((error) => {
      console.error(error);
    });
}

function redirectIfUnauthorized() {
  const refreshTokenStored = localStorage.getItem("refreshToken");

  const kickOut = () => {
    return (window.location.href = "/logout/");
  };

  if (!refreshTokenStored) {
    kickOut();
  }

  const refreshToken = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  );
  const { canAuthorize, canAuthToAuth } = refreshToken;

  if (canAuthorize === 0 && canAuthToAuth === 0) {
    kickOut();
  }
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

function onUserSearch(e) {
  e.preventDefault();

  const churchid = document.querySelector("#churchid").value;
  const firstname = document.querySelector("#firstname").value;
  const lastname = document.querySelector("#lastname").value;
  const endpoint = `${getApiHost()}/get-user`;

  document
    .querySelectorAll(".is-invalid")
    .forEach((item) => item.classList.remove("is-invalid"));

  if (isNaN(churchid)) {
    formError("#churchid", getPhrase("errorChurchIsRequired"));
  }

  if (firstname.trim() === "" && lastname.trim() === "") {
    document.querySelector("#firstname").classList.add("is-invalid");
    formError("#firstname", getPhrase("errorNameIsRequired"));
  }
}

function attachListeners() {
  document
    .querySelector("#finduserform")
    .addEventListener("submit", onUserSearch);

  document
    .querySelector("#churchid")
    .addEventListener("change", onChurchChanged);
}

async function init() {
  await populateContent();
  redirectIfUnauthorized();
  populateChurches();
  populatePhotosPendingReview();
  attachListeners();
  globalHidePageSpinner();
}

init();
