function onCountryChange(e) {
  const countryCode = e.target.value;
  const church = document.querySelector("#church");
  const churchContainer = document.querySelector("#churchcontainer");
  let countryHasChurches = false;

  church.value = "";

  if (countryCode === "") {
    churchContainer.classList.add("d-none");
    return;
  }

  churchContainer.querySelectorAll("optgroup").forEach(item => item.classList.add("d-none"));

  churchContainer.querySelectorAll("optgroup").forEach(item => {
    const churchCountryCode = item.getAttribute("data-country");
    if (countryCode === churchCountryCode) {
      countryHasChurches = true;
      item.classList.remove("d-none");
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
  notListedOption.innerText = "My ICC church is not listed below";
  const noneOfTheseOptgroup = document.createElement("optgroup");
  noneOfTheseOptgroup.label = "None of these:";
  churchDropdown.appendChild(noneOfTheseOptgroup);
  noneOfTheseOptgroup.appendChild(nonMemberOption);
  noneOfTheseOptgroup.appendChild(notListedOption);
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
        });
      });
    });
}

function addListeners() {
  document.querySelector("#country").addEventListener("change", onCountryChange);
}

function init() {
  populateCountries();
  populateChurches();
  addListeners();
}

init();