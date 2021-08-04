function onChurchChange(e) {
  const churchid = e.target.value;
  const unlistedchurch = document.querySelector("#unlistedchurch");
  const unlistedchurchcontainer = document.querySelector("#unlistedchurchcontainer");

  unlistedchurch.value = "";

  if (churchid == 0) {
    unlistedchurchcontainer.classList.remove("d-none");
  } else {
    unlistedchurchcontainer.classList.add("d-none");
  }
}

function onCountryChange(e) {
  const countryCode = e.target.value;
  const church = document.querySelector("#church");
  const churchContainer = document.querySelector("#churchcontainer");
  const unlistedchurch = document.querySelector("#unlistedchurch");
  const unlistedchurchcontainer = document.querySelector("#unlistedchurchcontainer");
  let countryHasChurches = false;

  church.value = "";
  unlistedchurch.value = "";
  unlistedchurchcontainer.classList.add("d-none");

  if (countryCode === "") {
    churchContainer.classList.add("d-none");
    return;
  }

  churchContainer.querySelectorAll("optgroup").forEach(item => {
    item.classList.add("d-none");
  });


  churchContainer.querySelectorAll("optgroup").forEach(item => {
    const churchCountryCode = item.getAttribute("data-country");
    const optgroupLabel = item.getAttribute("label");
    if (optgroupLabel === "None of the above:") {
      item.classList.remove("d-none");
    }
    if (countryCode === churchCountryCode) {
      countryHasChurches = true;
      item.classList.remove("d-none");
      churchContainer.classList.remove("d-none");
    }
  });

  if (!countryHasChurches) {
    churchContainer.querySelectorAll("optgroup").forEach(item => item.classList.remove("d-none"));
    churchContainer.classList.remove("d-none");
  }
}

async function populateCountries() {
  const countryDropdown = document.querySelector("#country");
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.innerHTML = "(Select)";
  countryDropdown.appendChild(emptyOption);
  fetch("../data/json/countries.json")
    .then(res => res.json())
    .then(data => {
      data.forEach(item => {
        const { alpha2, name } = item;
        const countryOption = document.createElement("option");
        countryOption.value = alpha2;
        countryOption.innerHTML = name;
        countryDropdown.appendChild(countryOption);
      });
    });
}

async function populateChurches() {
  const churchDropdown = document.querySelector("#church");
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.innerHTML = "(Select)";
  churchDropdown.appendChild(emptyOption);
  const nonMemberOption = document.createElement("option");
  nonMemberOption.value = "-1";
  nonMemberOption.innerText = "I am not a member of the ICC";
  const notListedOption = document.createElement("option");
  notListedOption.value = "0";
  notListedOption.innerText = "My ICC church is not listed here";
  const noneOfTheAboveOptgroup = document.createElement("optgroup");
  noneOfTheAboveOptgroup.label = "None of the above:";
  fetch("../data/json/churches.json")
    .then(res => res.json())
    .then(countries => {
      countries.forEach(item => {
        const { name: countryName, alpha2: countryCode } = item.country;
        const optgroup = document.createElement("optgroup");
        optgroup.label = `${countryName}:`;
        churchDropdown.appendChild(optgroup);
        item.churches.forEach(church => {
          let text = "";
          if (church.hasOwnProperty("city")) text = church.city;
          if (church.hasOwnProperty("state")) text += `, ${church.state}`;
          if (church.hasOwnProperty("territory")) {
            if (church.hasOwnProperty("city")) {
              text += `, ${church.territory}`;
            } else {
              text = church.territory;
            }
          }
          const option = document.createElement("option");
          option.value = church.id;
          option.innerText = text;
          optgroup.appendChild(option);
          optgroup.setAttribute("data-country", countryCode);

          churchDropdown.appendChild(noneOfTheAboveOptgroup);
          noneOfTheAboveOptgroup.appendChild(nonMemberOption);
          noneOfTheAboveOptgroup.appendChild(notListedOption);
        });
      });
    });
}

function addListeners() {
  document.querySelector("#country").addEventListener("change", onCountryChange);
  document.querySelector("#church").addEventListener("change", onChurchChange);
}

function init() {
  populateCountries();
  populateChurches();
  addListeners();
  enableTooltips();
}

init();