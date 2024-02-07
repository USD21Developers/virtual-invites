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
        return resolve(data.langs);
      });
  });
}

async function populateLanguages() {
  const selectEl = document.querySelector("#lang");
  const langsOfEvents = await getLanguagesOfEvents();
  const langs = await fetch("../../data/json/languages.json").then((res) =>
    res.json()
  );
  const detectedLang = navigator.languages[0].substring(0, 2);
  let selectedLang = langsOfEvents[detectedLang] ? detectedLang : "en";

  if (!Array.isArray(langsOfEvents)) return;
  if (!Object.keys(langs).length) return;

  for (let i = 0; i < langsOfEvents.length; i++) {
    const lang = langsOfEvents[i];
    const option = document.createElement("option");
    option.setAttribute("value", lang);
    option.innerText =
      lang === "en" ? langs[lang].name : langs[lang].nativeName;
    if (selectedLang === lang) option.setAttribute("selected", "");
    selectEl.appendChild(option);
  }
}

function showMap() {
  return new Promise((resolve, reject) => {
    const mapContainerEl = document.querySelector("#mapContainer");
    const endpoint = `${getApiHost()}/map-static`;
    const place = document.querySelector("#originLocation").value;
    const label = getPhrase("mapLabelOrigin");

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        place: place,
        label: label,
        width: 400,
        height: 400,
        zoom: 12,
        maptype: "roadmap" /* ["roadmap", "satellite", "hybrid", "terrain"] */,
        markerColor:
          "red" /* ["red", "blue", "green", "yellow", "purple", "orange", "pink", "white", "black", "brown"]; */,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        const img = mapContainerEl.querySelector("img");
        img.setAttribute("src", data.imageURL);
        img.setAttribute("width", data.width);
        img.setAttribute("height", data.height);
        img.setAttribute("alt", getPhrase("mapLabelOrigin"));
        mapContainerEl.classList.remove("d-none");
      })
      .catch((err) => {
        console.error(err);
        mapContainerEl.classList.add("d-none");
      });
  });
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

    showMap();

    if (promptAdvisory) promptAdvisory.classList.add("d-none");

    showToast(getPhrase("geocoordinatesSuccessMessage"), 3000, "success");
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
  showMap();
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
  globalHidePageSpinner();
}

init();
