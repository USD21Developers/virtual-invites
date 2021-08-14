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
  const churchid = document.querySelector("#churchid");
  const churchContainer = document.querySelector("#churchcontainer");
  const unlistedchurch = document.querySelector("#unlistedchurch");
  const unlistedchurchcontainer = document.querySelector("#unlistedchurchcontainer");
  let countryHasChurches = false;

  churchid.value = "";
  unlistedchurch.value = "";
  unlistedchurchcontainer.classList.add("d-none");

  if (countryCode === "") {
    churchContainer.classList.add("d-none");
    unlistedchurchcontainer.classList.add("d-none");
    return;
  }

  churchContainer.querySelectorAll("optgroup").forEach(item => {
    item.classList.add("d-none");
  });


  churchContainer.querySelectorAll("optgroup").forEach(item => {
    const churchCountryCode = item.getAttribute("data-country");
    const optgroupLabel = item.getAttribute("label");
    const optgroupText = getPhrase("noneOfTheAboveOptgroup");
    if (optgroupLabel === optgroupText) {
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

function onSubmit(e) {
  e.preventDefault();
  const username = document.querySelector("#username").value.trim().toLowerCase() || "";
  const password = document.querySelector("#password").value.trim() || "";
  const email = document.querySelector("#email").value.trim().toLowerCase() || "";
  const firstname = document.querySelector("#firstname").value.trim() || "";
  const lastname = document.querySelector("#lastname").value.trim() || "";
  const country = document.querySelector("#country").value.trim() || "";
  const churchid = document.querySelector("#churchid").value.trim() || "";
  const unlistedchurch = document.querySelector("#unlistedchurch").value.trim() || "";
  const emailSenderText = getPhrase("emailSenderText");
  const emailSubject = getPhrase("emailSubject");
  let emailParagraph1 = getPhrase("emailParagraph1");
  const emailLinkText = getPhrase("emailLinkText");
  const emailSignature = getPhrase("emailSignature");
  const lang = getLang();
  const endpoint = `${getApiHost()}/register`;

  emailParagraph1 = emailParagraph1.replaceAll("${fullname}", `${firstname} ${lastname}`);

  formErrorsReset();
  const isvalid = validate();
  if (!isvalid) return;

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      username: username,
      password: password,
      email: email,
      firstname: firstname,
      lastname: lastname,
      country: country,
      churchid: churchid,
      unlistedchurch: unlistedchurch,
      lang: lang,
      emailSenderText: emailSenderText,
      emailSubject: emailSubject,
      emailParagraph1: emailParagraph1,
      emailLinkText: emailLinkText,
      emailSignature: emailSignature,
    }),
    headers: new Headers({
      "Content-Type": "application/json"
    })
  }).then(res => res.json()).then(data => console.log(data));
}

function populateChurches() {
  return new Promise((resolve, reject) => {
    const churchDropdown = document.querySelector("#churchid");
    const emptyOption = document.createElement("option");
    emptyOption.label = " ";
    churchDropdown.appendChild(emptyOption);
    const nonMemberOption = document.createElement("option");
    nonMemberOption.value = "-1";
    nonMemberOption.innerText = getPhrase("nonMemberOption");
    const notListedOption = document.createElement("option");
    notListedOption.value = "0";
    notListedOption.innerText = getPhrase("notListedOption");
    const noneOfTheAboveOptgroup = document.createElement("optgroup");
    noneOfTheAboveOptgroup.label = getPhrase("noneOfTheAboveOptgroup");
    const lang = getLang();
    fetch(`../data/json/lang/${lang}/churches.json`)
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
        $('.floating-label .custom-select, .floating-label .form-control').floatinglabel();
        resolve();
      })
      .catch(err => {
        reject(err);
      });
  });
}

function populateCountries() {
  return new Promise((resolve, reject) => {
    const countryDropdown = document.querySelector("#country");
    const emptyOption = document.createElement("option");
    const lang = getLang();
    emptyOption.label = " ";
    countryDropdown.appendChild(emptyOption);
    fetch(`../data/json/lang/${lang}/countries.json`)
      .then(res => res.json())
      .then(data => {
        data.forEach(item => {
          const { alpha2, name } = item;
          const countryOption = document.createElement("option");
          countryOption.value = alpha2;
          countryOption.innerHTML = name;
          countryDropdown.appendChild(countryOption);
        });
        $('.floating-label .custom-select, .floating-label .form-control').floatinglabel();
        resolve();
      })
      .catch(err => {
        reject(err);
      });
  })
}

function validate() {
  let isValid = true;

  const username = document.querySelector("#username").value.trim().toLowerCase() || "";
  const password = document.querySelector("#password").value.trim() || "";
  const email = document.querySelector("#email").value.trim().toLowerCase() || "";
  const firstname = document.querySelector("#firstname").value.trim() || "";
  const lastname = document.querySelector("#lastname").value.trim() || "";
  const country = document.querySelector("#country").value.trim() || "";
  const churchid = document.querySelector("#churchid").value.trim() || "";
  const unlistedchurch = document.querySelector("#unlistedchurch").value.trim() || "";

  if (!username.length) return formError("#username", getPhrase("usernamerequired"));
  if (!password.length) return formError("#password", getPhrase("passwordrequired"));
  if (!email.length) return formError("#email", getPhrase("emailrequired"));
  if (!firstname.length) return formError("#firstname", getPhrase("firstnamerequired"));
  if (!lastname.length) return formError("#lastname", getPhrase("lastnamerequired"));
  if (!country.length) return formError("#country", getPhrase("countryrequired"));
  if (!churchid.length) return formError("#churchid", getPhrase("churchrequired"));
  if (churchid == 0 && !unlistedchurch.length) return formError("#unlistedchurch", getPhrase("unlistedchurchrequired"));

  return isValid;
}

function attachListeners() {
  document.querySelector("#country").addEventListener("change", onCountryChange);
  document.querySelector("#churchid").addEventListener("change", onChurchChange);
  document.querySelector("#formlogin").addEventListener("submit", onSubmit);
}

async function init() {
  await populateContent();
  const churches = populateChurches();
  const countries = populateCountries();
  Promise.all([churches, countries]).then(() => {
    attachListeners();
  });
}

init();