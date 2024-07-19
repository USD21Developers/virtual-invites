async function initIntlTelInput() {
  let initialCountry = "us";
  const input = document.querySelector("#contactPhone");
  const churchid = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  ).churchid;
  const churches = await getChurches();
  const church = churches.find((church) => church.id === churchid);
  if (church) initialCountry = church.country;

  iti = window.intlTelInput(input, {
    autoPlaceholder: "",
    initialCountry: initialCountry,
    preferredCountries: [initialCountry],
    showOnly: [initialCountry],
    utilsScript: "/js/intl-tel-input-17.0.0/js/utils.js",
  });

  iti.promise.then(() => {
    document
      .querySelector(".iti__selected-flag")
      .setAttribute("tabindex", "-1");

    if (input.value.trim().length > 0) {
      document
        .querySelector("label[for='contactPhone']")
        .parentElement.classList.add("has-value");
    }
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

  const defaultChurchId = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  ).churchid;

  churchDropdown.value = defaultChurchId;
  populateChurchName();
}

function populateChurchName() {
  const churchName = document
    .querySelector("#churchid")
    .selectedOptions[0].getAttribute("data-name");
  document.querySelector("#churchName").innerHTML = churchName;
}

function onToggleMethodOfSending(sendingMethod) {
  const contactPhoneContainerEl = document.querySelector(
    "#contactPhoneContainer"
  );
  const emailContainerEl = document.querySelector("#emailContainer");
  const submitButtonEl = document.querySelector("#submitButton");
  let submitButtonText;

  if (sendingMethod === "SMS") {
    contactPhoneContainerEl.classList.remove("d-none");
    emailContainerEl.classList.add("d-none");
    submitButtonText = getPhrase("btnSend");
  } else if (sendingMethod === "email") {
    contactPhoneContainerEl.classList.add("d-none");
    emailContainerEl.classList.remove("d-none");
    submitButtonText = getPhrase("btnSend");
  } else {
    contactPhoneContainerEl.classList.add("d-none");
    emailContainerEl.classList.add("d-none");
    submitButtonText = getPhrase("btnShowQRCode");
  }

  submitButtonEl.innerHTML = submitButtonText;
}

function attachListeners() {
  document
    .querySelector("#churchid")
    .addEventListener("change", populateChurchName);

  document.querySelectorAll("[name='sendingMethod']").forEach((item) => {
    item.addEventListener("click", (e) =>
      onToggleMethodOfSending(e.target.value)
    );
  });
}

async function init() {
  await populateContent();
  populateChurches();
  initIntlTelInput();
  attachListeners();
  globalHidePageSpinner();
}

init();
