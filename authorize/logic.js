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

  customizeIsExpecting();
}

function customizeIsExpecting() {
  const isExpectingContainerEl = document.querySelector(
    "#isExpectingContainer"
  );
  const isExpectingLabel = document.querySelector("label[for='isExpecting']");
  const firstName = document.querySelector("#firstName").value.trim();
  const lastName = document.querySelector("#lastName").value.trim();
  const sendingMethod = document.querySelector(
    "[name='sendingMethod']:checked"
  ).value;
  const isWhatsApp = document.querySelector("#isWhatsApp").checked;
  const contentWhatsApp = getPhrase("isExpectingWhatsApp").replaceAll(
    "{FIRST-NAME}",
    firstName
  );
  const contentTextMessage = getPhrase("isExpectingTextMessage").replaceAll(
    "{FIRST-NAME}",
    firstName
  );
  const contentEmail = getPhrase("isExpectingEmail").replaceAll(
    "{FIRST-NAME}",
    firstName
  );

  if (!firstName.length || !lastName.length) {
    isExpectingContainerEl.classList.add("d-none");
    return;
  }

  if (sendingMethod === "textmessage") {
    if (isWhatsApp) {
      isExpectingLabel.innerHTML = contentWhatsApp;
    } else {
      isExpectingLabel.innerHTML = contentTextMessage;
    }
    isExpectingContainerEl.classList.remove("d-none");
  } else if (sendingMethod === "email") {
    isExpectingLabel.innerHTML = contentEmail;
    isExpectingContainerEl.classList.remove("d-none");
  } else if (sendingMethod === "qrcode") {
    isExpectingLabel.innerHTML = "";
    isExpectingContainerEl.classList.add("d-none");
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

function populateStoredSendingMethod() {
  const storedSendingMethod = localStorage.getItem(
    "authorizationSendingMethod"
  );
  if (!storedSendingMethod) return;
  if (!["textmessage", "email", "qrcode"].includes(storedSendingMethod)) return;

  document.querySelectorAll("input[name='sendingMethod']").forEach((item) => {
    if (item.value === storedSendingMethod) {
      item.checked = true;
    }

    const contactPhoneContainerEl = document.querySelector(
      "#contactPhoneContainer"
    );
    const emailContainerEl = document.querySelector("#emailContainer");
    const submitButtonEl = document.querySelector("#submitButton");

    if (storedSendingMethod === "textmessage") {
      emailContainerEl.classList.add("d-none");
      contactPhoneContainerEl.classList.remove("d-none");
      submitButtonEl.innerHTML = getPhrase("btnSend");
    } else if (storedSendingMethod === "email") {
      contactPhoneContainerEl.classList.add("d-none");
      emailContainerEl.classList.remove("d-none");
      submitButtonEl.innerHTML = getPhrase("btnSend");
    } else if (storedSendingMethod === "qrcode") {
      contactPhoneContainerEl.classList.add("d-none");
      emailContainerEl.classList.add("d-none");
      submitButtonEl.innerHTML = getPhrase("btnShowQRCode");
    }
  });
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
  const churches = JSON.parse(localStorage.getItem("churches"));
  const churchid = document.querySelector("#churchid").value;
  const highestLeadershipRole = document.querySelector(
    "[name='highestLeadershipRole']:checked"
  )?.value;
  const methodOfSending = document.querySelector(
    "[name='sendingMethod']:checked"
  ).value;
  const phoneNumber = iti.getNumber();
  const isWhatsApp = document.querySelector("#isWhatsApp").checked;
  let phoneData = null;
  const email = document.querySelector("#contactEmail").value.trim();
  const acceptedOath = document.querySelector("#oath").checked;
  const isExpectingEl = document.querySelector("#isExpecting");
  const isExpecting = isExpectingEl.checked;

  e.preventDefault();

  // Validate
  document.querySelector("#alertMessage").classList.add("d-none");

  document.querySelectorAll(".is-invalid").forEach((item) => {
    item.classList.remove("is-invalid");
  });

  document.querySelectorAll(".invalid-feedback").forEach((item) => {
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

  if (methodOfSending === "textmessage") {
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

    phoneData = iti.getSelectedCountryData();
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

  if (methodOfSending !== "qrcode") {
    if (!isExpecting) {
      const errorEl = document.querySelector("#isExpectingInvalidFeedback");

      errorEl.innerHTML = getPhrase("errorIsExpectingIsRequired");
      errorEl.classList.add("d-block");
      customScrollTo("#isExpectingContainer");
      return;
    }
  }

  if (!navigator.onLine) {
    return showToast(getGlobalPhrase("youAreOffline"), 5000, "danger");
  }

  const endpoint = `${getApiHost()}/authorize`;
  const accessToken = await getAccessToken();
  const templateSms = await fetch("notification-text-message.txt").then((res) =>
    res.text()
  );
  const templateEmail = await fetch("notification-email.html").then((res) =>
    res.text()
  );
  const notificationPhrases = {
    emailSubject: getPhrase("notificationEmailSubject"),
    sentence1: getPhrase("notificationSentence1"),
    sentence2: getPhrase("notificationSentence2"),
    sentence2HTML: getPhrase("notificationSentence2HTML"),
    sentence3: getPhrase("notificationSentence3"),
    sentence4: getPhrase("notificationSentence4"),
    sentence5: getPhrase("notificationSentence5"),
    sentence6: getPhrase("notificationMoreInfo"),
    sincerely: getPhrase("notificationSincerely"),
    internetMinistry: getPhrase("notificationInternetMinistry"),
  };

  const templates = {
    sms: btoa(templateSms),
    email: btoa(templateEmail),
  };

  const lang = getLang();
  const church = churches.find((item) => item.id === Number(churchid));
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = `${lang.toLowerCase()}-${church.country.toUpperCase()}`;
  const utcExpiryDate = moment().add(1, "months").utc().format();
  const localizedExpiryDate = Intl.DateTimeFormat(locale, {
    dateStyle: "short",
  }).format(new Date(utcExpiryDate));

  globalShowPageSpinner();

  fetch(endpoint, {
    mode: "cors",
    method: "post",
    body: JSON.stringify({
      firstName: firstName,
      lastName: lastName,
      churchid: Number(churchid),
      highestLeadershipRole: highestLeadershipRole,
      methodOfSending: methodOfSending,
      phoneNumber: phoneNumber,
      phoneData: phoneData,
      isWhatsApp: isWhatsApp,
      email: email,
      acceptedOath: acceptedOath,
      notificationPhrases: notificationPhrases,
      templates: templates,
      timeZone: timeZone,
      utcExpiryDate: utcExpiryDate,
      localizedExpiryDate: localizedExpiryDate,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      globalHidePageSpinner();

      switch (data.msg) {
        case "firstName is required":
          formError("#firstName", getPhrase("errorFirstName"));
          document.querySelector("#firstName").focus();
          break;
        case "lastName is required":
          formError("#lastName", getPhrase("errorLastName"));
          document.querySelector("#lastName").focus();
          break;
        case "highestLeadershipRole is required":
          const errorElHighestLeadershipRole = document.querySelector(
            "#highestLeadershipRole_invalidFeedback"
          );
          errorElHighestLeadershipRole.innerHTML = getPhrase(
            "errorLeadershipRoleRequired"
          );
          errorElHighestLeadershipRole.classList.add("d-block");
          customScrollTo("#highestLeadershipRole_invalidFeedback", 225);
          break;
        case "phoneNumber is required":
          const phoneNumberErrorEl = document.querySelector(
            "#contactPhoneInvalidFeedback"
          );
          phoneNumberErrorEl.innerHTML = getPhrase("errorMobilePhoneRequired");
          phoneNumberErrorEl.classList.add("d-block");
          customScrollTo("#contactPhoneContainer");
          break;
        case "phoneNumber is invalid":
          phoneNumberErrorEl.innerHTML = getPhrase("errorMobilePhoneInvalid");
          phoneNumberErrorEl.classList.add("d-block");
          customScrollTo("#contactPhoneContainer");
          break;
        case "email is required":
          const emailErrorEl = document.querySelector(
            "#contactEmailInvalidFeedback"
          );
          emailErrorEl.innerHTML = getPhrase("errorEmailRequired");
          emailErrorEl.classList.add("d-block");
          customScrollTo("#emailContainer");
          break;
        case "email is invalid":
          emailErrorEl.innerHTML = getPhrase("errorEmailInvalid");
          emailErrorEl.classList.add("d-block");
          customScrollTo("#emailContainer");
          break;
        case "invalid value for acceptedOath":
          const acceptedOathErrorEl = document.querySelector(
            "#oathInvalidFeedback"
          );
          acceptedOathErrorEl.innerHTML = getPhrase("errorOathIsRequired");
          acceptedOathErrorEl.classList.add("d-block");
          customScrollTo("#oathContainer");
          break;
        case "unable to query for authorizing user's permissions":
          showToast(getPhrase("unexpectedError"), 5000, "danger");
          break;
        case "authorizing user was not found":
          window.location.href = "/logout/";
          break;
        case "invalid userStatus for authorizing user":
          window.location.href = "/logout/";
          break;
        case "authorizing user does not have permission to authorize":
          window.location.href = "/";
          break;
        case "authorizing user does not have permission to authorize for this leadership role":
          window.location.href = "/";
          break;
        case "unable to store authorization":
          showToast(getPhrase("unexpectedError"), 5000, "danger");
          break;
        case "not enough money to send text message":
          showToast(
            getPhrase("notEnoughMoneyToSendTextMessage"),
            5000,
            "danger",
            ".snackbar",
            true
          );
          break;
        case "new user authorized":
          const firstName = document.querySelector("#firstName").value.trim();

          if (firstName.length) {
            const alertHeadline = getPhrase("authorizationSentHeadline");
            const alertContent1 = getPhrase("authorizationSent1");
            const alertContent2 = getPhrase("authorizationSent2").replaceAll(
              "{FIRST-NAME}",
              firstName
            );
            const alertContent = `
              <p>${alertContent1}</p>
              <p class="mb-0">${alertContent2}</p>
            `;
            const successAlertEl = document.querySelector("#alertMessage");
            successAlertEl
              .querySelector(".alert")
              .classList.remove("alert-info", "alert-danger", "alert-warning");
            successAlertEl
              .querySelector(".alert")
              .classList.add("alert-success");
            showAlert(successAlertEl, alertContent, alertHeadline, true);
            const formEl = document.querySelector("#authorizeForm");
            formEl.reset();
            populateChurches();
            customScrollTo("body");
          }

          break;
        default:
          showToast(getPhrase("unexpectedError"), 5000, "danger");
          break;
      }
    })
    .catch((error) => {
      console.error(error);
      globalHidePageSpinner();
    });
}

function onToggleMethodOfSending(sendingMethod) {
  const contactPhoneContainerEl = document.querySelector(
    "#contactPhoneContainer"
  );
  const emailContainerEl = document.querySelector("#emailContainer");
  const submitButtonEl = document.querySelector("#submitButton");
  const isExpectingLabel = document.querySelector("label[for='isExpecting']");
  const isExpectingContainerEl = document.querySelector(
    "#isExpectingContainer"
  );
  const isWhatsAppEl = document.querySelector("#isWhatsApp");
  const firstName = document.querySelector("#firstName").value.trim();
  let submitButtonText;

  if (sendingMethod === "textmessage") {
    if (firstName.length) {
      if (isWhatsAppEl.checked) {
        const content = getPhrase("isExpectingWhatsApp").replaceAll(
          "{FIRST-NAME}",
          firstName
        );
        isExpectingLabel.innerHTML = content;
      } else {
        const content = getPhrase("isExpectingTextMessage").replaceAll(
          "{FIRST-NAME}",
          firstName
        );
        isExpectingLabel.innerHTML = content;
      }
      isExpectingLabel.innerHTML = getPhrase(
        "isExpectingTextMessage"
      ).replaceAll("{FIRST-NAME}", firstName);
      isExpectingContainerEl.classList.remove("d-none");
    }
    contactPhoneContainerEl.classList.remove("d-none");
    emailContainerEl.classList.add("d-none");
    submitButtonText = getPhrase("btnSend");
  } else if (sendingMethod === "email") {
    if (firstName.length) {
      const content = getPhrase("isExpectingEmail").replaceAll(
        "{FIRST-NAME}",
        firstName
      );
      isExpectingLabel.innerHTML = content;
      isExpectingContainerEl.classList.remove("d-none");
    }
    contactPhoneContainerEl.classList.add("d-none");
    emailContainerEl.classList.remove("d-none");
    submitButtonText = getPhrase("btnSend");
  } else {
    isExpectingLabel.innerHTML = "";
    contactPhoneContainerEl.classList.add("d-none");
    emailContainerEl.classList.add("d-none");
    isExpectingContainerEl.classList.add("d-none");
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
    item.addEventListener("click", (e) => {
      customizeIsExpecting();
      localStorage.setItem("authorizationSendingMethod", e.target.value);
      onToggleMethodOfSending(e.target.value);
    });
  });

  document.querySelector("#authorizeForm").addEventListener("submit", onSubmit);

  document
    .querySelector("#isWhatsApp")
    .addEventListener("click", customizeIsExpecting);
}

async function init() {
  await populateContent();
  populateChurches();
  unhideContentForHighestUsers();
  initIntlTelInput();
  populateStoredSendingMethod();
  attachListeners();
  globalHidePageSpinner();
}

init();
