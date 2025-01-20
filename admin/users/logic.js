async function populateChurches() {
  const churchDropdown = document.querySelector("#churchid");
  const churchDropdown2 = document.querySelector("#churchid2");
  const countryData = await getCountries(getLang());
  const countries = countryData.names;
  let churches = JSON.parse(localStorage.getItem("churches"));
  let churchesHtml = "";

  if (!churches.length) {
    churches = await getChurches();
  }

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
  churchDropdown2.innerHTML = churchesHtml;

  selectUserChurch();

  syncChurches();
}

async function selectUserChurch() {
  const myUserId = getUserId();
  const myChurchId = await getUserChurchId(myUserId);
  const church = getStoredChurch(myChurchId);
  const userChurchId = church.id;
  const churchEl = document.querySelector("#churchid");
  const churchEl2 = document.querySelector("#churchid2");

  if (typeof userChurchId !== "number") return;

  churchEl.value = userChurchId;
  churchEl2.value = userChurchId;

  const churchName = church.name;
  const churchNameEl = document.querySelector("#selectedChurchName");
  const churchNameEl2 = document.querySelector("#selectedChurchName2");

  churchNameEl.innerText = churchName;
  churchNameEl2.innerText = churchName;
}

function onChurchChanged() {
  const churchEl = document.querySelector("#churchid");
  const churchName = churchEl.selectedOptions[0].getAttribute("data-name");
  const churchNameEl = document.querySelector("#selectedChurchName");

  churchNameEl.innerText = churchName;
}

function onChurch2Changed() {
  const churchEl = document.querySelector("#churchid2");
  const churchName = churchEl.selectedOptions[0].getAttribute("data-name");
  const churchNameEl = document.querySelector("#selectedChurchName2");

  churchNameEl.innerText = churchName;
}

function onResetClicked() {
  const firstNameEl = document.querySelector("#firstname");
  const lastNameEl = document.querySelector("#lastname");

  firstNameEl.value = "";
  lastNameEl.value = "";
}

function onUserSearch(e) {
  const churchid = document.querySelector("#churchid").value;
  const firstname = document.querySelector("#firstname").value;
  const lastname = document.querySelector("#lastname").value;

  document
    .querySelectorAll(".is-invalid")
    .forEach((item) => item.classList.remove("is-invalid"));

  if (isNaN(churchid)) {
    formError("#churchid", getPhrase("errorChurchIsRequired"));
    e.preventDefault();
  }

  if (firstname.trim() === "" && lastname.trim() === "") {
    document.querySelector("#firstname").classList.add("is-invalid");
    formError("#firstname", getPhrase("errorNameIsRequired"));
    e.preventDefault();
  }
}

function attachListeners() {
  document
    .querySelector("#finduserform")
    .addEventListener("submit", onUserSearch);
  document
    .querySelector("#churchid")
    .addEventListener("change", onChurchChanged);
  document
    .querySelector("#churchid2")
    .addEventListener("change", onChurch2Changed);
  document
    .querySelector("#resetButton")
    .addEventListener("click", onResetClicked);
}

async function init() {
  await populateContent();
  syncChurches();
  populateChurches();
  attachListeners();
  globalHidePageSpinner();
}

init();
