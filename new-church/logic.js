let churches = [];
let countries = [];

async function getChurches() {
  const churchesObj = await syncChurches();
  churches = churchesObj.churches;
  return churches;
}

function getCountries() {
  return new Promise((resolve, reject) => {
    const lang = getLang();
    const servicesHost = getApiServicesHost();
    const endpoint = `${servicesHost}/country-names/${lang}`;
    let storedCountries = localStorage.getItem("countries");

    if (!!storedCountries) {
      if (
        storedCountries.lang === lang &&
        Array.isArray(storedCountries.names)
      ) {
        countries = storedCountries.names;
        return resolve(storedCountries.names);
      }
    }

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        const storedCountries = {
          lang: lang,
          names: data.countryNames.names,
        };
        localStorage.setItem("countries", JSON.stringify(storedCountries));
        countries = data.countryNames.names;
        return resolve(data.countryNames.names);
      })
      .catch((err) => {
        return reject(err);
      });
  });
}

function populateChurches() {
  const churchDropdown = document.querySelector("#churchid");
  const emptyOption = document.createElement("option");
  emptyOption.label = " ";
  churchDropdown.appendChild(emptyOption);
}

function populateCountries() {
  const countryDropdown = document.querySelector("#country");
  const countriesArray = [];

  // Loop through all the countries and keep the ones that have a church
  countries.forEach((country) => {
    const countryHasAChurch = churches.some(
      (church) => church.country === country.iso
    );

    if (countryHasAChurch) {
      countriesArray.push(country);
    }
  });

  // Populate the country dropdown
  let optionsHTML = `<option value="">${getPhrase("selectcountry")}</option>`;
  countriesArray.forEach((country) => {
    const option = `<option value="${country.iso}">${country.name}</option>`;
    optionsHTML += option;
  });
  countryDropdown.innerHTML = optionsHTML;
  countryDropdown.options[0].selected = true;
  countryDropdown.parentElement.classList.add("has-value");
}

function onChurchChange(e) {
  const churchid = e.target.value;
  const unlistedchurch = document.querySelector("#unlistedchurch");
  const unlistedchurchcontainer = document.querySelector(
    "#unlistedchurchcontainer"
  );

  unlistedchurch.value = "";
  unlistedchurchcontainer.classList.add("d-none");

  if (churchid == 0) {
    unlistedchurchcontainer.classList.remove("d-none");
  }
}

function onCountryChange(e) {
  const countryCode = e.target.value;
  const churchContainer = document.querySelector("#churchcontainer");
  const churchSelect = document.querySelector("#churchid");
  const churchesInCountry = churches.filter(
    (item) => item.country == countryCode
  );
  const unlistedchurchcontainer = document.querySelector(
    "#unlistedchurchcontainer"
  );
  const country = document.querySelector("#country");
  const unlistedchurch = document.querySelector("#unlistedchurch");
  const defaultOption = document.createElement("option");

  // Sort churches alphabetically
  churchesInCountry.sort((a, b) => (a.name > b.name ? 1 : -1));

  // Clear existing church dropdown options
  churchSelect.innerHTML = "";

  // Add default church dropdown option
  defaultOption.value = "";
  defaultOption.innerText = getPhrase("selectchurch");
  churchSelect.appendChild(defaultOption);

  // Populate church dropdown options
  churchesInCountry.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.innerText = item.name;
    churchSelect.appendChild(option);
  });

  // Add option for ICC churches that aren't in our database yet
  const unlistedOption = document.createElement("option");
  unlistedOption.value = "0";
  unlistedOption.innerText = getPhrase("notListedOption");
  churchSelect.appendChild(unlistedOption);

  churchSelect.parentElement.classList.add("has-value");

  // Hide text input for unlisted church
  unlistedchurchcontainer.classList.add("d-none");
  unlistedchurch.value = "";

  // Hide errors if a valid country was selected
  if (country.selectedIndex !== 0) {
    country.classList.remove("is-invalid");
    country.parentElement.querySelector(".invalid-feedback").innerHTML = "";
    churchContainer.classList.remove("d-none");
    return;
  }

  churchContainer.classList.add("d-none");
  unlistedchurch.value = "";
}

async function onSubmit(e) {
  e.preventDefault();

  const countryid = document.querySelector("#country").value;
  const churchid = document.querySelector("#churchid").value;

  if (countryid === "") {
    console.log("Country is required");
    // TODO
    return;
  }

  if (churchid === "") {
    console.log("Church is required");
    // TODO
    return;
  }
}

function attachListeners() {
  document
    .querySelector("#country")
    .addEventListener("change", onCountryChange);
  document
    .querySelector("#churchid")
    .addEventListener("change", onChurchChange);
  document.querySelector("#newChurch").addEventListener("submit", onSubmit);
}

async function init() {
  await syncChurches();
  await populateContent();

  Promise.all([getChurches(), getCountries()]).then(() => {
    populateCountries();
    attachListeners();
    globalHidePageSpinner();
  });
}

init();
