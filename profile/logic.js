let churches = [];

let countries = [];

function openPhotoUploadModal(e) {
  e.preventDefault();
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
  return new Promise(async (resolve, reject) => {
    const endpoint = `${getApiHost()}/user`;
    const accessToken = await getAccessToken();

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data) return reject();
        if (data.msgType !== "success") return reject();

        const user = data.user;

        const altText = getPhrase("profilePhoto")
          .replaceAll("{FIRST-NAME}", user.firstname)
          .replaceAll("{LAST-NAME}", user.lastname);

        const photoLinkEl = document.querySelector("#profilePhoto");

        const img = document.createElement("img");
        img.setAttribute("src", user.profilephoto);
        img.setAttribute("alt", altText);
        img.setAttribute("title", altText);
        img.setAttribute("width", 140);
        img.setAttribute("height", 140);

        photoLinkEl.innerHTML = "";
        photoLinkEl.appendChild(img);

        document.querySelector("#username").innerHTML = user.username;
        document.querySelector("#email").value = user.email;
        document.querySelector("#firstname").value = user.firstname;
        document.querySelector("#lastname").value = user.lastname;
        document.querySelector("#churchid").value = user.churchid;

        return resolve(user);
      });
  });
}

function selectUserChurch() {
  const church = getStoredChurch(getUserChurchId());
  const userChurchId = church.id;
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
  const profilePhoto140 = profilePhoto400.replaceAll("400.jpg", "140.jpg");
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

function attachListeners() {
  document
    .querySelector("#profilePhoto")
    .addEventListener("click", openPhotoUploadModal);

  document
    .querySelector("#cameraIcon")
    .addEventListener("click", openPhotoUploadModal);
}

async function init() {
  selectUserChurch();
  populateChurches();
  await populateContent();
  showProfilePhoto();
  await populateForm();
  attachListeners();
  globalHidePageSpinner();
}

/*
  TO DO:
  1.  * DONE *  Populate churches field from localStorage (sorted by country)
  2.  * DONE *  Sync churches with API asynchronously, with a callback that repopulates churches field again
  3.  * DONE *  Populate form fields
  4.  If user changes church, repopulate the full name of the church just beneath the <select> element
  5.  Replace refresh token with a new one in the API response
  6.  Enable changing profile photo
  7.  Create API to save changes
*/

init();
