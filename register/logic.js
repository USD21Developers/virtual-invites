let churches = [];

let countries = [];

let photoData = {
  url: "",
  points: "",
  zoom: "",
  orientation: "",
};

let vanilla;

function getChurches() {
  return new Promise((resolve, reject) => {
    const host = getApiServicesHost();
    const endpoint = `${host}/churches`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        churches = data.churches;
        localStorage.setItem("churches", JSON.stringify(churches));
        resolve(data.churches);
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
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
        resolve(data.countryNames.names);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function getProfileImage() {
  if (!vanilla) return "";
  if (typeof vanilla.__proto__.result !== "function") return "";

  return vanilla.result({
    type: "base64",
    size: { width: 400, height: 400 },
    format: "jpg",
    quality: 0.75,
    circle: false,
  });
}

function initCroppie() {
  function loadHeic2Any() {
    return new Promise((resolve, reject) => {
      const url =
        "https://cdnjs.cloudflare.com/ajax/libs/heic2any/0.0.3/heic2any.min.js";
      const heicToAnyJS = document.createElement("script");
      heicToAnyJS.setAttribute("src", url);
      heicToAnyJS.addEventListener("load", () => {
        resolve();
      });
      document.querySelector("head").appendChild(heicToAnyJS);
    });
  }

  function showRotateButtons() {
    const rotateButtons = document.querySelector("#rotateButtons");
    rotateButtons.removeAttribute("hidden");
  }

  function showTakeASelfie() {
    const form = document.querySelector("#formTakeASelfie");
    const testElement = document.createElement("input");
    const isCaptureSupported = testElement.capture != undefined;

    if (isCaptureSupported) {
      form.classList.remove("d-none");
    }
  }

  function onMirror(photoData, vanilla) {
    const { url, points, zoom, orientation } = photoData;

    vanilla.bind({
      url: url,
      points: points,
      zoom: zoom,
      orientation: 2,
    });
  }

  async function onPhotoSelected(event) {
    const croppieContainer = document.getElementById("photoPreview");
    const photoPreviewContainer = document.querySelector(
      "#photoPreviewContainer"
    );

    croppieContainer.innerHTML = "";
    croppieContainer.classList.remove("croppie-container");

    vanilla = new Croppie(croppieContainer, {
      viewport: { width: 250, height: 250, type: "circle" },
      boundary: { width: 250, height: 250 },
      type: "circle",
      showZoomer: true,
      enableOrientation: true,
      enableResize: false,
    });

    const reader = new FileReader();
    reader.onload = async () => {
      photoData.url = reader.result;
      photoPreviewContainer.classList.remove("d-none");
      vanilla
        .bind({
          url: reader.result,
          orientation: 1,
        })
        .then(() => {
          showRotateButtons();
          croppieContainer.addEventListener("update", function (evt) {
            const { points, zoom, orientation } = vanilla.get();

            photoData.points = points;
            photoData.zoom = zoom;
            photoData.orientation = orientation;
          });
        });

      vanilla
        .result({
          type: "base64",
          size: "viewport",
          format: "jpeg",
          quality: 1,
          circle: true,
        })
        .then((response) => {
          photoData.url = response;
        });
    };

    const isHeic =
      event.target.files[0].name.slice(-5).toLowerCase() === ".heic"
        ? true
        : false;
    if (isHeic) {
      const readerHeic = new FileReader();

      await loadHeic2Any();

      readerHeic.onload = async function (e) {
        const blob = new Blob([new Uint8Array(e.target.result)], {
          type: "image/heic",
        });
        const conversionResult = await heic2any({
          blob,
          toType: "image/jpeg",
        });
        reader.readAsDataURL(conversionResult);
      };
      const file = document.querySelector("#photoUpload").files[0];
      readerHeic.readAsArrayBuffer(file);
    } else {
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  function onRotate(evt) {
    const degrees = evt.target.getAttribute("data-deg");
    vanilla.rotate(parseInt(degrees));
  }

  function attachListeners() {
    document
      .querySelector("#photoUpload")
      .addEventListener("change", onPhotoSelected);

    document
      .querySelector("#photoCapture")
      .addEventListener("change", onPhotoSelected);

    document.querySelectorAll(".rotate").forEach((item) => {
      item.addEventListener("click", onRotate);
    });

    document.querySelector(".mirror")?.addEventListener("click", (evt) => {
      onMirror(photoData, vanilla);
    });
  }

  function init() {
    attachListeners();
    showTakeASelfie();
  }

  init();
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

function showProfilePhotoError() {
  const photoIsRequired = document.querySelector("#photoIsRequired");

  photoIsRequired.classList.remove("d-none");

  customScrollTo("#profilePhotoHeadline");
}

function validate() {
  document
    .querySelectorAll(".is-invalid")
    .forEach((item) => item.classList.remove("is-invalid"));
  document
    .querySelectorAll(".invalid-feedback")
    .forEach((item) => (item.innerHTML = ""));
  return new Promise(async (resolve, reject) => {
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
    const profileImage = await getProfileImage();

    if (!username.length) {
      formError("#username", getPhrase("usernamerequired"));
      return resolve(false);
    }

    if (!password.length) {
      formError("#password", getPhrase("passwordrequired"));
      return resolve(false);
    }

    if (!email.length) {
      formError("#email", getPhrase("emailrequired"));
      return resolve(false);
    }

    if (!firstname.length) {
      formError("#firstname", getPhrase("firstnamerequired"));
      return resolve(false);
    }

    if (!lastname.length) {
      formError("#lastname", getPhrase("lastnamerequired"));
      return resolve(false);
    }

    if (!gender.length) {
      const invalidFeedbackGender = document.querySelector(
        ".invalid-feedback-gender"
      );
      invalidFeedbackGender.innerText = getPhrase("genderrequired");
      invalidFeedbackGender.style.display = "block";
      customScrollTo("#gendercontainer");
      return resolve(false);
    }

    if (!country.length) {
      formError("#country", getPhrase("countryrequired"));
      document
        .querySelector("#country")
        .parentElement.querySelector(".invalid-feedback").innerText =
        getPhrase("countryrequired");
      document.querySelector("#churchid").selectedIndex = 0;
      document.querySelector("#churchcontainer").classList.add("d-none");
      document.querySelector("#unlistedchurch").value = "";
      document
        .querySelector("#unlistedchurchcontainer")
        .classList.add("d-none");
      return resolve(false);
    }

    if (!churchid.length) {
      formError("#churchid", getPhrase("churchrequired"));
      return resolve(false);
    }

    if (churchid == 0 && !unlistedchurch.length) {
      formError("#unlistedchurch", getPhrase("unlistedchurchrequired"));
      return resolve(false);
    }

    if (profileImage === "") {
      showProfilePhotoError();
      return resolve(false);
    }

    return resolve(true);
  });
}

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

  formErrorsReset();
  const isvalid = await validate();
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
  const profileImage = await getProfileImage();
  const emailSenderText = getPhrase("emailSenderText");
  const emailSubject = getPhrase("emailSubject");
  let emailParagraph1 = getPhrase("emailParagraph1");
  const emailLinkText = getPhrase("emailLinkText");
  const emailSignature = getPhrase("emailSignature");
  const lang = getLang() || "en";
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
      profileImage: profileImage,
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
        case "profile photo missing":
          showProfilePhotoError();
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
  }, 25000);
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
  Promise.all([getChurches(), getCountries()]).then(() => {
    populateCountries();
    attachListeners();
    globalHidePageSpinner();
  });

  initCroppie();
}

init();
