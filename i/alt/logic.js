function toggleDetectLocationVisibility() {
  const isMobile = isMobileDevice();
  const detectMyLocationContainerEl = document.querySelector(
    "#detectMyLocationContainer"
  );

  if (!isMobile) return;

  detectMyLocationContainerEl.classList.remove("d-none");
}

function onDetectLocationClick(e) {
  e.preventDefault();

  // if (!isMobileDevice()) return;

  const onGeoLocationError = (err) => {
    showToast(getPhrase("geocoordinatesErrorMessage"), 5000, "danger");
    console.error(err);
  };

  const onGeoLocationSuccess = (pos) => {
    const { latitude, longitude, timestamp } = pos.coords;
    const mapCoordinates = `${latitude},${longitude}`;
    const originLocationEl = document.querySelector("#originLocation");
    const promptAdvisory = document.querySelector("#promptAdvisoryContainer");

    originLocationEl.value = mapCoordinates;

    if (promptAdvisory) promptAdvisory.classList.add("d-none");

    showToast(getPhrase("geocoordinatesSuccessMessage"), 5000, "success");
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

function onSearch(e) {
  e.preventDefault();
}

function attachListeners() {
  document
    .querySelector("#detectMyLocation")
    .addEventListener("click", onDetectLocationClick);
  document
    .querySelector("#formEventSearch")
    .addEventListener("submit", onSearch);
}

async function init() {
  attachListeners();
  await populateContent();
  toggleDetectLocationVisibility();
}

init();
