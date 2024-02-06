function getLanguagesOfEvents() {
  return new Promise((resolve, reject) => {
    let eventid;
    let userid;
    let recipientid;
    const endpoint = `${getApiHost()}/languages-of-events`;

    try {
      const urlParts = window.location.hash.split("#")[1].split("/");
      eventid = Number(urlParts[1]);
      userid = Number(urlParts[2]);
      recipientid = urlParts[3];
    } catch (e) {
      return reject(new Error("invalid URL parameters"));
    }

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        eventid: eventid,
        userid: userid,
        recipientid: recipientid,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        return resolve(data);
      });
  });
}

async function populateLanguages() {
  const selectEl = document.querySelector("#lang");
  const langs = await getLanguagesOfEvents();

  console.log(langs);
}

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

    showToast(getPhrase("geocoordinatesSuccessMessage"), 4000, "success");
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
  await populateLanguages();
  toggleDetectLocationVisibility();
}

init();
