let churches = [];

let photoData = {
  url: "",
  points: "",
  zoom: "",
  orientation: "",
};

let vanilla;

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
      const url = "https://cdnjs.cloudflare.com/ajax/libs/heic2any/0.0.3/heic2any.min.js";
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

  function onRotate(evt) {
    const degrees = evt.target.getAttribute("data-deg");
    vanilla.rotate(parseInt(degrees));
  }

  async function onPhotoSelected(event) {
    const croppieContainer = document.getElementById("photoPreview");
    const photoPreviewContainer = document.querySelector("#photoPreviewContainer");

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
    reader.onload = async() => {
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
      event.target.files[0].name.slice(-5) === ".heic" ? true : false;
    if (isHeic) {
      const readerHeic = new FileReader();

      await loadHeic2Any();

      readerHeic.onload = async function (e) {
        const blob = new Blob([new Uint8Array(e.target.result)], {
          type: "image/heic",
        });
        const conversionResult = await heic2any({
          blob,
          toType: "image/jpeg"
        });
        reader.readAsDataURL(conversionResult);
      };
      const file = document.querySelector("#photoUpload").files[0];
      readerHeic.readAsArrayBuffer(file);
    } else {
      reader.readAsDataURL(event.target.files[0]);
    }
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
    console.clear();
    attachListeners();
    showTakeASelfie();
  }

  init();
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

          if (typeof name !== "string") return;
          if (countryName.trim() === "") return;

          if (countryCode === "us") countryName = "United States";
          const optgroup = document.createElement("optgroup");
          optgroup.label = `${countryName}:`;
          churchDropdown.appendChild(optgroup);
          churches.forEach((church) => {
            const { id, place } = church;
            const option = document.createElement("option");

            if (typeof place !== "string" || place.trim() === "") return;

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

function showProfilePhotoError() {
  const photoIsRequired = document.querySelector("#photoIsRequired");

  photoIsRequired.classList.remove("d-none");

  customScrollTo("#profilePhotoHeadline");
}

async function validate() {
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
  const profileImage = await getProfileImage();

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

  if (profileImage === "") {
    return showProfilePhotoError();
  }

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
    globalHidePageSpinner();
  });

  initCroppie();
}

init();
