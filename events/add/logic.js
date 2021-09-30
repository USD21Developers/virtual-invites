function initIntlTelInput() {
  const input = document.querySelector("#contactPhone");
  const initialCountry = localStorage.getItem("countryIso") || "us";
  iti = window.intlTelInput(input, {
    autoPlaceholder: "",
    initialCountry: initialCountry,
    preferredCountries: [initialCountry],
    showOnly: [initialCountry],
    utilsScript: "../../js/intl-tel-input-17.0.0/js/utils.js",
  });

  if (input.value.trim().length > 0) {
    document
      .querySelector("label[for='contactPhone']")
      .parentElement.classList.add("has-value");
  }
}

function onClickDetectLocation(e) {
  e.preventDefault();

  const onGeoLocationError = (err) => {
    switch (err) {
      case 1:
        showToast(getPhrase("geocoordinatesPermissionDenied"));
        break;
      case 2:
        showToast(getPhrase("geocoordinatesPermissionUnavailable"));
        break;
      case 3:
        showToast(getPhrase("geocoordinatesPermissionTimedOut"));
        break;
      default:
        showToast(`${getPhrase("geocoordinatesErrorCode")} ${err}`);
    }
  };

  const onGeoLocationSuccess = (pos) => {
    const { latitude, longitude, timestamp } = pos.coords;
    const latitudeEl = document.querySelector("#latitude");
    const longitudeEl = document.querySelector("#longitude");

    latitudeEl.value = latitude;
    longitudeEl.value = longitude;

    latitudeEl.setAttribute("data-timestamp", timestamp);
    longitudeEl.setAttribute("data-timestamp", timestamp);

    latitudeEl.parentElement.classList.add("has-value");
    longitudeEl.parentElement.classList.add("has-value");

    showToast(
      `<a href="https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}">
        ${getPhrase("geocoordinatesSuccessMessage")}
      </a>`,
      5000,
      "success"
    );
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      onGeoLocationSuccess,
      onGeoLocationError,
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }
}

function onDurationChange(e) {
  const duration = e.target.value.trim();
  const nextOccurrenceEl = document.querySelector("#nextOccurrence");
  const oneTimeEventBeginInfoEl = document.querySelector(
    "#oneTimeEventBeginInfo"
  );
  const oneTimeEventEndInfoEl = document.querySelector("#oneTimeEventEndInfo");

  hide(nextOccurrenceEl);
  hide(oneTimeEventBeginInfoEl);
  hide(oneTimeEventEndInfoEl);

  switch (duration) {
    case "":
      break;
    case "same day":
      show(nextOccurrenceEl);
      break;
    case "multiple days":
      show(oneTimeEventBeginInfoEl);
      show(oneTimeEventEndInfoEl);
      break;
    default:
      break;
  }
}

function onFrequencyChange(e) {
  const frequency = e.target.value.trim();
  const duration = document.querySelector("#duration");
  const durationContainer = document.querySelector("#durationContainer");
  const nextOccurrenceEl = document.querySelector("#nextOccurrence");
  const oneTimeEventBeginInfoEl = document.querySelector(
    "#oneTimeEventBeginInfo"
  );
  const oneTimeEventEndInfoEl = document.querySelector("#oneTimeEventEndInfo");

  hide(durationContainer);
  hide(nextOccurrenceEl);
  hide(oneTimeEventBeginInfoEl);
  hide(oneTimeEventEndInfoEl);
  duration.options[0].selected = true;

  switch (frequency) {
    case "":
      break;
    case "Once":
      show(durationContainer);
      break;
    default:
      show(nextOccurrenceEl);
      break;
  }
}

function showDetectLocationButton() {
  const isMobile = isMobileDevice();
  if (!isMobile) return;
  const detectCoordinates = document.querySelector("#detectCoordinates");
  detectCoordinates.classList.remove("d-none");
}

function attachListeners() {
  document
    .querySelector("#frequency")
    .addEventListener("change", onFrequencyChange);

  document
    .querySelector("#duration")
    .addEventListener("change", onDurationChange);

  document
    .querySelector("#detectCoordinatesButton")
    .addEventListener("click", onClickDetectLocation);
}

async function init() {
  await populateContent();
  attachListeners();
  showDetectLocationButton();
  initIntlTelInput();
}

init();
