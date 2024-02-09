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

function setDefaultDates() {
  const fromDateEl = document.querySelector("#dateFrom");
  const toDateEl = document.querySelector("#dateTo");
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  const currentDateFormatted = `${year}-${month}-${day}`;

  fromDateEl.value = currentDateFormatted;

  function getFutureDateWithTwoSundays() {
    const currentDate = new Date();
    let futureDate = new Date(currentDate);

    // Increment the future date until we find at least two Sundays
    let sundayCount = 0;
    while (sundayCount < 2) {
      futureDate.setDate(futureDate.getDate() + 1); // Move to the next day
      if (futureDate.getDay() === 0) {
        // 0 represents Sunday
        sundayCount++;
      }
    }

    return futureDate;
  }

  // Get the future date with at least two Sundays
  const futureDate = getFutureDateWithTwoSundays();

  // Format the future date as YYYY-MM-DD
  const formattedFutureDate = futureDate.toISOString().slice(0, 10);

  toDateEl.value = formattedFutureDate;
}

function setDefaultDistanceUnit() {
  return new Promise((resolve, reject) => {
    const endpoint = `${getApiServicesHost()}/geotagip`;
    const radiusEl = document.querySelector("#radius");
    const distanceUnitEl = document.querySelector("#distanceUnit");

    // https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
    const placesThatUseMiles = [
      { iso_3166_1_a2: "AI", name: "Anguilla" },
      { iso_3166_1_a2: "AG", name: "Antigua and Barbuda" },
      { iso_3166_1_a2: "BB", name: "Barbados" },
      { iso_3166_1_a2: "KY", name: "Cayman Islands" },
      {
        iso_3166_1_a2: "GB",
        name: "United Kingdom, England, Scotland, Wales, Northern Ireland",
      },
      { iso_3166_1_a2: "GU", name: "Guam" },
      { iso_3166_1_a2: "IM", name: "Isle Of Man" },
      { iso_3166_1_a2: "JE", name: "Jersey" },
      { iso_3166_1_a2: "PR", name: "Puerto Rico" },
      { iso_3166_1_a2: "US", name: "USA" },
    ];

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.msgType) {
          if (data.msgType !== "success") {
            throw new Error(data.msg);
          }
        }
        if (!data.hasOwnProperty("geotaginfo")) return;
        const { country_code } = data.geotaginfo;
        let distanceUnit = "kilometers";
        const radiusForKilos = 100;
        const radiusForMiles = 65;

        placesThatUseMiles.forEach((item) => {
          if (item.iso_3166_1_a2 === country_code) {
            distanceUnit = "miles";
          }
        });

        distanceUnitEl.value = distanceUnit;
        radiusEl.value =
          distanceUnit === "miles" ? radiusForMiles : radiusForKilos;

        return resolve(distanceUnit);
      })
      .catch((err) => {
        console.error(err);
        return reject(err);
      });
  });
}

function showMap() {
  return new Promise((resolve, reject) => {
    const mapContainerEl = document.querySelector("#mapContainer");
    const endpoint = `${getApiHost()}/map-static`;
    const place = document.querySelector("#originLocation").value;
    const label = getPhrase("mapLabelOrigin");

    mapContainerEl.classList.remove("d-none");

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        place: place,
        label: label,
        width: 300,
        height: 300,
        zoom: 11,
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
        mapContainerEl.innerHTML = "";

        const img = document.createElement("img");
        img.setAttribute("src", data.imageURL);
        img.setAttribute("alt", getPhrase("mapLabelOrigin"));
        img.setAttribute("width", data.width);
        img.setAttribute("height", data.height);
        mapContainerEl.appendChild(img);

        showToast(getPhrase("geocoordinatesSuccessMessage"), 2000, "success");
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

function onDetectLocationClick() {
  const mapContainerEl = document.querySelector("#mapContainer");
  mapContainerEl.innerHTML = "";

  const img = document.createElement("img");
  img.setAttribute("src", "/_assets/img/spinner.svg");
  img.setAttribute("alt", getPhrase("loadingMap"));
  img.setAttribute("width", 200);
  img.setAttribute("height", 200);

  mapContainerEl.appendChild(img);

  mapContainerEl.classList.remove("d-none");

  customScrollTo("#mapContainer");

  const onGeoLocationError = (err) => {
    mapContainerEl.innerHTML = "";
    mapContainerEl.classList.add("d-none");
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
  setDefaultDates();
  setDefaultDistanceUnit();
  // toggleDetectLocationVisibility();
  globalHidePageSpinner();
}

init();
