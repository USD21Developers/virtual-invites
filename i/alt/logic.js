let inviteObj;

function getInviteInfo() {
  return new Promise((resolve, reject) => {
    let eventid;
    let userid;
    let recipientid;
    const endpoint = `${getApiHost()}/alt-events-invite`;

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
        if (!data) reject();
        if (!data.msg || !data.msgType) reject();
        if (data.msgType === "error") reject(data.msg);
        if (!data.invite) reject();
        inviteObj = data.invite;
        return resolve(data.invite);
      })
      .catch((err) => {
        console.error(err);
        return reject(err);
      });
  });
}

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
      })
      .catch((err) => {
        console.error(err);
        return reject(err);
      });
  });
}

function hideMap() {
  const mapContainerEl = document.querySelector("#mapContainer");
  mapContainerEl.classList.add("d-none");
  mapContainerEl.innerHTML = "";
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
    const originLocationEl = document.querySelector("#originLocation");

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

    const storedRadius = localStorage.getItem("radius");
    const storedDistanceUnit = localStorage.getItem("distanceUnit");
    if (storedRadius && storedDistanceUnit) {
      radiusEl.value = storedRadius;
      distanceUnitEl.value = storedDistanceUnit;
    }

    if (window.location.hostname === "localhost") {
      radiusEl.value = 65;
      distanceUnitEl.value = "miles";
      originLocationEl.value = "40.689247,-74.044502"; // Statue of Liberty
      originLocationEl.setAttribute("data-countryFromIP", "US");
      return resolve("miles");
    }

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.msgType) {
          if (data.msgType !== "success") {
            throw new Error(data.msg);
          }
        }
        if (!data.hasOwnProperty("geotaginfo")) return;
        const country_code = data.geotaginfo.country_code
          ? data.geotaginfo.country_code
          : "US";
        const radiusForKilos = 100;
        const radiusForMiles = 65;
        let radius = radiusForKilos;
        let distanceUnit = "kilometers";

        originLocationEl.setAttribute("data-countryFromIP", country_code);

        placesThatUseMiles.forEach((item) => {
          if (item.iso_3166_1_a2 === country_code) {
            radius = radiusForMiles;
            distanceUnit = "miles";
          }
        });

        localStorage.setItem("radius", radius);
        localStorage.setItem("distanceUnit", distanceUnit);

        radiusEl.value = radius;
        distanceUnitEl.value = distanceUnit;

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
        mapContainerEl.innerHTML = "";

        const img = document.createElement("img");

        img.onload = onMapLoaded();
        img.setAttribute("src", data.imageURL);
        img.setAttribute("alt", getPhrase("mapLabelOrigin"));
        img.setAttribute("width", data.width);
        img.setAttribute("height", data.height);
        mapContainerEl.appendChild(img);
      })
      .catch((err) => {
        console.error(err);
        mapContainerEl.classList.add("d-none");
      });
  });
}

function onDetectLocationClick() {
  const mapContainerEl = document.querySelector("#mapContainer");
  mapContainerEl.innerHTML = "";

  hideToast();
  document.querySelector(".snackbar-body").innerHTML = "";

  const img = document.createElement("img");
  img.setAttribute("src", "/_assets/img/spinner.svg");
  img.setAttribute("alt", getPhrase("loadingMap"));
  img.setAttribute("width", 200);
  img.setAttribute("height", 200);

  mapContainerEl.appendChild(img);

  mapContainerEl.classList.remove("d-none");

  customScrollTo("#myLocationContainer");

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

  const originLocationEl = document.querySelector("#originLocation");
  const countryFromIP = originLocationEl.getAttribute("data-countryFromIP");
  const originLocation = originLocationEl.value.trim();
  const txtPleaseProvideLocation = getPhrase("pleaseProvideLocation");
  const txtPleaseSelectLanguage = getPhrase("pleaseSelectLanguage");
  const txtPleaseInputRadius = getPhrase("pleaseInputRadius");
  const txtRadiusMustBeNumeric = getPhrase("radiusMustBeNumeric");
  const txtRadiusMustBePositive = getPhrase("radiusMustBePositive");
  const txtRadiusMustNotBeZero = getPhrase("radiusMustNotBeZero");
  const txtPleaseInputFromDate = getPhrase("pleaseInputFromDate");
  const txtFromDateMustNotBeInPast = getPhrase("fromDateMustNotBeInPast");
  const txtPleaseInputToDate = getPhrase("pleaseInputToDate");
  const txtInvalidFromDate = getPhrase("invalidFromDate");
  const txtInvalidToDate = getPhrase("invalidToDate");
  const txtToDateMustNotBeInPast = getPhrase("toDateMustNotBeInPast");
  const txtFromDateMustPrecedeToDate = getPhrase("fromDateMustPrecedeToDate");
  const lang = document.querySelector("#lang").value;
  const radius = document.querySelector("#radius").value;
  const distanceUnit = document.querySelector("#distanceUnit").value;
  const dateFrom = document.querySelector("#dateFrom").value;
  const dateTo = document.querySelector("#dateTo").value;

  // Validate

  hideToast();

  // Origin location
  if (!originLocation.length) {
    showToast(txtPleaseProvideLocation, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='originLocation']");
    return;
  }

  // Language
  if (lang === "") {
    showToast(txtPleaseSelectLanguage, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='lang']");
    return;
  }

  // Radius
  if (radius.trim() === "") {
    showToast(txtPleaseInputRadius, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='radius']");
    return;
  }
  if (isNaN(radius.trim())) {
    showToast(txtRadiusMustBeNumeric, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='radius']");
    return;
  }
  if (radius < Math.abs(radius)) {
    showToast(txtRadiusMustBePositive, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='radius']");
    return;
  }
  if (Number(radius) === 0) {
    showToast(txtRadiusMustNotBeZero, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='radius']");
    return;
  }

  const momentNow = moment();

  // "From" date
  const momentFromStart = moment(dateFrom);
  const momentFromEnd = momentFromStart.add(1, "days").subtract(1, "second");
  if (dateFrom.trim() === "") {
    showToast(txtPleaseInputFromDate, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='dateFrom']");
    return;
  }
  if (!moment(dateFrom).isValid()) {
    showToast(txtInvalidFromDate, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='dateFrom']");
    return;
  }
  if (momentFromEnd.isBefore(momentNow)) {
    showToast(txtFromDateMustNotBeInPast, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='dateFrom']");
    return;
  }

  // "To" date
  const momentToStart = moment(dateTo);
  const momentToEnd = momentToStart.add(1, "days").subtract(1, "second");
  if (dateTo.trim() === "") {
    showToast(txtPleaseInputToDate, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='dateTo']");
    return;
  }
  if (!moment(dateTo).isValid()) {
    showToast(txtInvalidToDate);
    customScrollTo("label[for='dateTo']");
    return;
  }
  if (momentToEnd.isBefore(momentNow)) {
    showToast(txtToDateMustNotBeInPast, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='dateTo']");
    return;
  }

  // "From" date must precede "To" date
  if (momentToEnd.isBefore(momentFromStart)) {
    showToast(txtFromDateMustPrecedeToDate, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='dateFrom']");
    return;
  }

  globalShowPageSpinner();

  const endpoint = `${getApiHost()}/alt-events-search`;
  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      countryFromIP: countryFromIP,
      lang: lang,
      originLocation: originLocation,
      radius: radius,
      distanceUnit: distanceUnit,
      eventid: inviteObj.event.eventid,
      userid: inviteObj.user.userid,
      recipientid: inviteObj.recipient.recipientid,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      // TODO:  DO STUFF (e.g. extract data, show search results, etc.)
      globalHidePageSpinner();
    })
    .catch((err) => {
      console.error(err);
      globalHidePageSpinner();
    });
}

function onMapLoaded() {
  showToast(getPhrase("geocoordinatesSuccessMessage"), 2000, "success");
}

function attachListeners() {
  document
    .querySelector("#detectMyLocation")
    .addEventListener("click", onDetectLocationClick);

  document
    .querySelector("#formEventSearch")
    .addEventListener("submit", onSearch);

  document.querySelector("#originLocation").addEventListener("input", hideMap);
}

async function init() {
  attachListeners();
  Promise.all([populateContent(), getInviteInfo(), populateLanguages()]).then(
    () => {
      setDefaultDates();
      setDefaultDistanceUnit();
      globalHidePageSpinner();
    }
  );
}

init();
