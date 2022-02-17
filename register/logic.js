let churches = [];

function onChurchChange(e) {
  const churchid = e.target.value;
  const unlistedchurch = document.querySelector("#unlistedchurch");
  const unlistedchurchcontainer = document.querySelector(
    "#unlistedchurchcontainer"
  );

  unlistedchurch.value = "";

  if (churchid == 0) {
    unlistedchurchcontainer.classList.remove("d-none");
  } else {
    unlistedchurchcontainer.classList.add("d-none");
  }
}

function onCountryChange(e) {
  console.log("onCountryChange");
  const countryCode = e.target.value;
  const churchid = document.querySelector("#churchid");
  const churchContainer = document.querySelector("#churchcontainer");
  const unlistedchurch = document.querySelector("#unlistedchurch");
  const unlistedchurchcontainer = document.querySelector(
    "#unlistedchurchcontainer"
  );
  let countryHasChurches = false;

  churchid.value = "";
  unlistedchurch.value = "";
  unlistedchurchcontainer.classList.add("d-none");

  if (countryCode === "") {
    churchContainer.classList.add("d-none");
    unlistedchurchcontainer.classList.add("d-none");
    return;
  }

  churchContainer.querySelectorAll("optgroup").forEach((item) => {
    item.classList.add("d-none");
  });

  churchContainer.querySelectorAll("optgroup").forEach((item) => {
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
    churchContainer
      .querySelectorAll("optgroup")
      .forEach((item) => item.classList.remove("d-none"));
    churchContainer.classList.remove("d-none");
  }
}

async function onSubmit(e) {
  e.preventDefault();

  formErrorsReset();
  const isvalid = validate();
  if (!isvalid) return;

  const spinner = document.querySelector("#progressbar");
  const submitButton = document.querySelector("#formsubmit");
  const username =
    document.querySelector("#username").value.trim().toLowerCase() || "";
  const password = document.querySelector("#password").value.trim() || "";
  const email =
    document.querySelector("#email").value.trim().toLowerCase() || "";
  const firstname = document.querySelector("#firstname").value.trim() || "";
  const lastname = document.querySelector("#lastname").value.trim() || "";
  const gender = document.querySelector("input[name='gender']:checked").value;
  const country = document.querySelector("#country").value.trim() || "";
  const churchid = document.querySelector("#churchid").value.trim() || "";
  const unlistedchurch =
    document.querySelector("#unlistedchurch").value.trim() || "";
  const emailSenderText = getPhrase("emailSenderText");
  const emailSubject = getPhrase("emailSubject");
  let emailParagraph1 = getPhrase("emailParagraph1");
  const emailLinkText = getPhrase("emailLinkText");
  const emailSignature = getPhrase("emailSignature");
  const lang = getLang();
  const endpoint = `${getApiHost()}/register`;
  const dataKey = await invitesCrypto.generateKey();
  const exportedDataKey = await invitesCrypto.exportCryptoKey(dataKey);
  const serializedDataKey = invitesCrypto.serialize(exportedDataKey);
  const controller = new AbortController();
  const signal = controller.signal;

  emailParagraph1 = emailParagraph1.replaceAll(
    "${fullname}",
    `${firstname} ${lastname}`
  );

  hide(submitButton);
  show(spinner);

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      username: username,
      password: password,
      email: email,
      firstname: firstname,
      lastname: lastname,
      gender: gender,
      country: country,
      churchid: churchid,
      unlistedchurch: unlistedchurch,
      lang: lang,
      emailSenderText: emailSenderText,
      emailSubject: emailSubject,
      emailParagraph1: emailParagraph1,
      emailLinkText: emailLinkText,
      emailSignature: emailSignature,
      dataKey: serializedDataKey,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    signal: signal,
  })
    .then((res) => res.json())
    .then((data) => {
      show(submitButton);
      hide(spinner);

      switch (data.msg) {
        case "username missing":
          formError("#username", getPhrase("usernamerequired"));
          break;
        case "password missing":
          formError("#password", getPhrase("passwordrequired"));
          break;
        case "e-mail missing":
          formError("#email", getPhrase("emailrequired"));
          break;
        case "invalid e-mail":
          formError("#email", getPhrase("invalidemail"));
          break;
        case "first name missing":
          formError("#firstname", getPhrase("firstnamerequired"));
          break;
        case "last name missing":
          formError("#lastname", getPhrase("lastnamerequired"));
          break;
        case "gender missing":
          const invalidFeedbackGender = document.querySelector(
            ".invalid-feedback-gender"
          );
          invalidFeedbackGender.innerText = getPhrase("genderrequired");
          invalidFeedbackGender.style.display = "block";
          customScrollTo("#gendercontainer");
          break;
        case "country missing":
          formError("#country", getPhrase("countryrequired"));
          break;
        case "churchid missing":
          formError("#churchid", getPhrase("churchrequired"));
          break;
        case "unlisted church missing":
          formError("#unlistedchurch", getPhrase("unlistedchurchrequired"));
          break;
        case "username already exists":
          formError("#username", getPhrase("duplicateusername"));
          break;
        case "e-mail already exists":
          formError("#email", getPhrase("duplicateemail"));
          break;
        case "password not complex enough":
          formError("#password", getPhrase("passwordNotComplexEnough"));
          const modalMessage = `
            <p>${getPhrase("passwordNotComplexEnoughLine1")}</p>
            <p>${getPhrase("passwordNotComplexEnoughLine2")}</p>
          `;
          showModal(modalMessage, getPhrase("invalidpassword"));
          break;
        case "confirmation e-mail sent":
          const defaultContent = document.querySelector("#contentdefault");
          const doneContent = document.querySelector("#contentdone");

          hide(defaultContent);
          show(doneContent);
          break;
        default:
          showModal(getPhrase("glitch"), getPhrase("glitchHeadline"));
          break;
      }
    });

  setTimeout(() => {
    controller.abort();
    hide(spinner);
    show(submitButton);
  }, 5000);
}

async function populateChurches() {
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

    const host = getApiServicesHost();
    const endpoint = `${host}/churches`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((churchesInCountries) => {
        churchesInCountries.forEach((item) => {
          const { iso: countryCode, name, churches } = item.country;
          let countryName = name;
          if (countryCode === "us") countryName = "United States";
          const optgroup = document.createElement("optgroup");
          optgroup.label = `${countryName}:`;
          churchDropdown.appendChild(optgroup);
          churches.forEach((church) => {
            const { id, place } = church;
            const option = document.createElement("option");
            option.value = id;
            option.innerText = place;
            optgroup.appendChild(option);
            optgroup.setAttribute("data-country", countryCode);

            churchDropdown.appendChild(noneOfTheAboveOptgroup);
            noneOfTheAboveOptgroup.appendChild(nonMemberOption);
            noneOfTheAboveOptgroup.appendChild(notListedOption);
          });
        });
        $(
          ".floating-label .custom-select, .floating-label .form-control"
        ).floatinglabel();
        resolve();
      })
      .catch((err) => {
        console.error(err);
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
      .then((res) => res.json())
      .then((data) => {
        data.forEach((item) => {
          const { alpha2, name } = item;
          const countryOption = document.createElement("option");
          countryOption.value = alpha2;
          countryOption.innerHTML = name;
          countryDropdown.appendChild(countryOption);
        });
        /* $(
          ".floating-label .custom-select, .floating-label .form-control"
        ).floatinglabel(); */
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function validate() {
  let isValid = true;

  const username =
    document.querySelector("#username").value.trim().toLowerCase() || "";
  const password = document.querySelector("#password").value.trim() || "";
  const email =
    document.querySelector("#email").value.trim().toLowerCase() || "";
  const firstname = document.querySelector("#firstname").value.trim() || "";
  const lastname = document.querySelector("#lastname").value.trim() || "";
  const gender = document.querySelector("input[name=gender]:checked")
    ? document.querySelector("input[name=gender]:checked").value
    : "";
  const country = document.querySelector("#country").value.trim() || "";
  const churchid = document.querySelector("#churchid").value.trim() || "";
  const unlistedchurch =
    document.querySelector("#unlistedchurch").value.trim() || "";

  if (!username.length)
    return formError("#username", getPhrase("usernamerequired"));
  if (!password.length)
    return formError("#password", getPhrase("passwordrequired"));
  if (!email.length) return formError("#email", getPhrase("emailrequired"));
  if (!firstname.length)
    return formError("#firstname", getPhrase("firstnamerequired"));
  if (!lastname.length)
    return formError("#lastname", getPhrase("lastnamerequired"));
  if (!gender.length) {
    const invalidFeedbackGender = document.querySelector(
      ".invalid-feedback-gender"
    );
    invalidFeedbackGender.innerText = getPhrase("genderrequired");
    invalidFeedbackGender.style.display = "block";
    return customScrollTo("#gendercontainer");
  }
  if (!country.length)
    return formError("#country", getPhrase("countryrequired"));
  if (!churchid.length)
    return formError("#churchid", getPhrase("churchrequired"));
  if (churchid == 0 && !unlistedchurch.length)
    return formError("#unlistedchurch", getPhrase("unlistedchurchrequired"));

  return isValid;
}

function attachListeners() {
  document
    .querySelector("#country")
    .addEventListener("change", onCountryChange);
  document
    .querySelector("#churchid")
    .addEventListener("change", onChurchChange);
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
