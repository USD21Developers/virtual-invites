function customizeOath() {
  const firstName = document.querySelector("#firstName").value.trim();
  const lastName = document.querySelector("#lastName").value.trim();
  const oathEl = document.querySelector("label[for='oath']");
  const churchEl = document.querySelector("#churchid");
  const churchName = churchEl.selectedOptions[0].getAttribute("data-name");
  let oathCustomizedNames = getPhrase("oathCustomizedNames");
  let oathCustomizedChurch = getPhrase("oathCustomizedChurch");
  let namesPopulated = firstName.length && lastName.length ? true : false;

  if (!!churchName && churchName.length) {
    oathCustomizedChurch = oathCustomizedChurch.replaceAll(
      "{CHURCH-NAME}",
      churchName
    );
    oathEl.innerHTML = oathCustomizedChurch;
  }

  if (namesPopulated) {
    oathCustomizedNames = oathCustomizedNames.replaceAll(
      "{FIRST-NAME}",
      `<strong>${firstName}</strong>`
    );

    oathCustomizedNames = oathCustomizedNames.replaceAll(
      "{LAST-NAME}",
      `<strong>${lastName}</strong>`
    );

    oathCustomizedNames = oathCustomizedNames.replaceAll(
      "{CHURCH-NAME}",
      churchName
    );

    oathEl.innerHTML = oathCustomizedNames;
  } else {
    oathEl.innerHTML = oathCustomizedChurch;
  }
}

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
  customizeOath();
}

function populateChurchName() {
  const churchName = document
    .querySelector("#churchid")
    .selectedOptions[0].getAttribute("data-name");
  document.querySelector("#churchName").innerHTML = churchName;
}

function unhideContentForHighestUsers() {
  let canAuthToAuth = false;
  let canAccessThisPage = false;
  const refreshToken = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  );

  if (refreshToken.isAuthorized) {
    isAuthorized = true;
  }

  if (refreshToken.canAuthorize) {
    canAuthorize = true;
    canAccessThisPage = true;
  }

  if (refreshToken.canAuthToAuth) {
    canAuthToAuth = true;
  }

  if (!canAccessThisPage) {
    sessionStorage.setItem("redirectOnLogin", window.location.href);
    window.location.href = "../logout/";
  }

  if (canAuthToAuth) {
    document
      .querySelector("#containerHighestLeadershipRole")
      .classList.remove("d-none");
  }
}

async function onSubmit(e) {
  const refreshToken = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  );
  const firstName = document.querySelector("#firstName").value.trim();
  const lastName = document.querySelector("#lastName").value.trim();
  const churchid = document.querySelector("#churchid").value;
  const highestLeadershipRole = document.querySelector(
    "[name='highestLeadershipRole']:checked"
  )?.value;
  const methodOfSending = document.querySelector(
    "[name='sendingMethod']:checked"
  ).value;
  const phoneNumber = iti.getNumber();
  const email = document.querySelector("#contactEmail").value.trim();
  const acceptedOath = document.querySelector("#oath").checked;

  e.preventDefault();

  // Validate

  document.querySelectorAll(".is-invalid").forEach((item) => {
    item.classList.remove("is-invalid");
  });

  document.querySelectorAll(".invalid-feedback").forEach((item) => {
    item.innerHTML = "";
    item.classList.remove("d-block");
  });

  if (!firstName.length) {
    formError("#firstName", getPhrase("errorFirstName"));
    document.querySelector("#firstName").focus();
    return;
  }

  if (!lastName.length) {
    formError("#lastName", getPhrase("errorLastName"));
    document.querySelector("#lastName").focus();
    return;
  }

  if (!refreshToken.canAuthToAuth) {
    const userChurchId = await getUserChurchId(getUserId());
    const userChurchName = document
      .querySelector(`#churchid option[value='${userChurchId}']`)
      .getAttribute("data-name");
    const newUserChurchId = Number(churchid);
    if (newUserChurchId !== userChurchId) {
      const errorEl = document.querySelector("#churchInvalidFeedback");
      const errorMsg = getPhrase("errorChurchMustMatch").replaceAll(
        "{CHURCH-NAME}",
        userChurchName
      );
      errorEl.innerHTML = errorMsg;
      errorEl.classList.add("d-block");
      customScrollTo("#churchContainer");
      return;
    }
  }

  if (refreshToken.canAuthToAuth) {
    if (!highestLeadershipRole) {
      const errorEl = document.querySelector(
        "#highestLeadershipRole_invalidFeedback"
      );
      errorEl.innerHTML = getPhrase("errorLeadershipRoleRequired");
      errorEl.classList.add("d-block");
      customScrollTo("#highestLeadershipRole_invalidFeedback", 225);
      return;
    }
  }

  if (methodOfSending === "SMS") {
    const errorEl = document.querySelector("#contactPhoneInvalidFeedback");
    const phoneNumber = iti.getNumber();
    const isValidNumber = iti.isValidNumber();

    if (!phoneNumber.length) {
      errorEl.innerHTML = getPhrase("errorMobilePhoneRequired");
      errorEl.classList.add("d-block");
      customScrollTo("#contactPhoneContainer");
      return;
    }

    if (!isValidNumber) {
      errorEl.innerHTML = getPhrase("errorMobilePhoneInvalid");
      errorEl.classList.add("d-block");
      customScrollTo("#contactPhoneContainer");
      return;
    }
  }

  if (methodOfSending === "email") {
    const errorEl = document.querySelector("#contactEmailInvalidFeedback");
    const isValidEmail = validateEmail(email);

    if (!email.length) {
      errorEl.innerHTML = getPhrase("errorEmailRequired");
      errorEl.classList.add("d-block");
      customScrollTo("#emailContainer");
      return;
    }

    if (!isValidEmail) {
      errorEl.innerHTML = getPhrase("errorEmailInvalid");
      errorEl.classList.add("d-block");
      customScrollTo("#emailContainer");
      return;
    }
  }

  if (!acceptedOath) {
    const errorEl = document.querySelector("#oathInvalidFeedback");

    errorEl.innerHTML = getPhrase("errorOathIsRequired");
    errorEl.classList.add("d-block");
    customScrollTo("#oathContainer");
    return;
  }

  if (!navigator.onLine) {
    return showToast(getGlobalPhrase("youAreOffline"), 5000, "danger");
  }
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
  document.querySelector("#firstName").addEventListener("input", customizeOath);
  document.querySelector("#lastName").addEventListener("input", customizeOath);
  document
    .querySelector("#churchid")
    .addEventListener("change", populateChurchName);
  document.querySelector("#churchid").addEventListener("change", customizeOath);

  document
    .querySelectorAll("[name='highestLeadershipRole']")
    .forEach((item) => {
      item.addEventListener("change", (item) => {
        document
          .querySelector("#highestLeadershipRole_invalidFeedback")
          .classList.remove("d-block");
      });
    });

  document.querySelectorAll("[name='sendingMethod']").forEach((item) => {
    item.addEventListener("click", (e) =>
      onToggleMethodOfSending(e.target.value)
    );
  });

  document.querySelector("#authorizeForm").addEventListener("submit", onSubmit);
}

async function init() {
  await populateContent();
  populateChurches();
  unhideContentForHighestUsers();
  initIntlTelInput();
  attachListeners();
  globalHidePageSpinner();
}

init();
