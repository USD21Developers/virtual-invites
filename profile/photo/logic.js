let photoData = {
  url: "",
  points: "",
  zoom: "",
  orientation: "",
};

let vanilla;

function getProfileImage(height = 400, width = 400) {
  if (!vanilla) return "";
  if (typeof vanilla.__proto__.result !== "function") return "";

  return vanilla.result({
    type: "base64",
    size: { width: width, height: height },
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
        return resolve();
      });
      document.querySelector("head").appendChild(heicToAnyJS);
    });
  }

  function showTakeASelfie() {
    const form = document.querySelector("#formTakeASelfie");
    const testElement = document.createElement("input");
    const isCaptureSupported = testElement.capture != undefined;
    const operatingSystem = getMobileOperatingSystem();
    const isIOS = operatingSystem === "iOS" ? true : false;

    if (isCaptureSupported && isIOS) {
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
    const photoPreviewSpinner = document.querySelector("#photoPreviewSpinner");
    const submitButton = document.querySelector("#formsubmit");

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
          photoPreviewSpinner.classList.add("d-none");
          submitButton.removeAttribute("disabled");
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
          customScrollTo("#photoPreviewContainer", 70);
        });
    };

    const isHeic =
      event.target.files[0].name.slice(-5).toLowerCase() === ".heic"
        ? true
        : false;
    if (isHeic) {
      const readerHeic = new FileReader();

      submitButton.setAttribute("disabled", "disabled");
      photoPreviewSpinner.classList.remove("d-none");
      customScrollTo("#photoPreviewSpinner", 70);

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

  function attachListeners() {
    document
      .querySelector("#photoUpload")
      .addEventListener("change", onPhotoSelected);

    document
      .querySelector("#photoCapture")
      .addEventListener("change", onPhotoSelected);

    document.querySelector(".mirror")?.addEventListener("click", (evt) => {
      onMirror(photoData, vanilla);
    });
  }

  function init() {
    attachListeners();
    showProfilePhoto();
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

function showProfilePhoto() {
  const refreshToken = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  );
  const { firstname, lastname, profilephoto } = refreshToken;
  const profilePhoto400 = profilephoto;
  const profilePhoto140 = profilePhoto400.replaceAll("400.jpg", "140.jpg");
  const profilePhotoEl = document.querySelector("#profilePhoto");
  const altText = getPhrase("profilePhoto")
    .replaceAll("{FIRST-NAME}", firstname)
    .replaceAll("{LAST-NAME}", lastname);

  const img = document.createElement("img");
  img.setAttribute("src", profilePhoto400);
  img.setAttribute("width", 200);
  img.setAttribute("height", 200);
  img.setAttribute("alt", altText);
  img.setAttribute("title", altText);
  img.setAttribute("onerror", `this.onerror=null;this.src='';this.alt='';`);

  profilePhotoEl.appendChild(img);
}

function showProfilePhotoError() {
  const photoIsRequired = document.querySelector("#photoIsRequired");

  photoIsRequired.classList.remove("d-none");

  customScrollTo("#profilePhotoHeadline", 70);
}

async function onSubmit(e) {
  e.preventDefault();

  formErrorsReset();

  const profileImage400 = await getProfileImage(400, 400);
  const profileImage140 = await getProfileImage(140, 140);
  const spinner = document.querySelector("#progressbar");
  const submitButton = document.querySelector("#formsubmit");
  const controller = new AbortController();
  const signal = controller.signal;
  const endpoint = `${getApiHost()}/profile-photo`;
  const accessToken = await getAccessToken();

  hide(submitButton);
  show(spinner);

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      profileImage140: profileImage140,
      profileImage400: profileImage400,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
    }),
    signal: signal,
  })
    .then((res) => res.json())
    .then((data) => {
      show(submitButton);
      hide(spinner);

      switch (data.msg) {
        case "profile photo missing":
          showProfilePhotoError();
          break;
        case "photo updated":
          sessionStorage.setItem("accessToken", data.accessToken);
          localStorage.setItem("refreshToken", data.refreshToken);
          window.location.href = "../";
          break;
      }
    });

  setTimeout(() => {
    controller.abort("Timeout reached (25 seconds)");
    hide(spinner);
    show(submitButton);
  }, 25000);
}

function attachListeners() {
  document
    .querySelector("#formUpdatePhoto")
    .addEventListener("submit", onSubmit);
}

async function init() {
  await populateContent();
  attachListeners();
  globalHidePageSpinner();
  initCroppie();
}

init();
