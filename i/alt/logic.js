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
        if (!data) return reject();
        if (!data.msg || !data.msgType) return reject();
        if (data.msgType === "error") return reject(data.msg);
        if (!data.invite) return reject();
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

function populateCountries() {
  return new Promise(async (resolve, reject) => {
    const selectEl = document.querySelector("#country");
    const detectedLang = navigator.languages[0].substring(0, 2);
    const countries = await fetch(
      `../../data/json/countries/${detectedLang}/world.json`
    ).then((res) => res.json());

    if (!Array.isArray(countries)) return reject();

    const optionSelectCountry = document.createElement("option");
    optionSelectCountry.setAttribute("value", "");
    optionSelectCountry.innerText = getPhrase("selectCountry");
    selectEl.appendChild(optionSelectCountry);

    for (let i = 0; i < countries.length; i++) {
      const alpha2 = countries[i].alpha2;
      const countryName = countries[i].name;
      const country = document.createElement("option");
      country.setAttribute("value", alpha2);
      country.innerText = countryName;
      selectEl.appendChild(country);
    }

    return resolve(countries);
  });
}

function populateLanguages() {
  return new Promise(async (resolve, rejecgt) => {
    const selectEl = document.querySelector("#lang");
    const langsOfEvents = await getLanguagesOfEvents();
    const langs = await fetch("../../data/json/languages.json").then((res) =>
      res.json()
    );
    const detectedLang = navigator.languages[0].substring(0, 2);
    let selectedLang = langsOfEvents[detectedLang] ? detectedLang : "en";

    if (!Array.isArray(langsOfEvents)) return reject();
    if (!Object.keys(langs).length) return reject();

    for (let i = 0; i < langsOfEvents.length; i++) {
      const lang = langsOfEvents[i];
      const option = document.createElement("option");
      option.setAttribute("value", lang);
      option.innerText =
        lang === "en" ? langs[lang].name : langs[lang].nativeName;
      if (selectedLang === lang) option.setAttribute("selected", "");
      selectEl.appendChild(option);
    }

    return resolve(langs);
  });
}

function populateInPersonResults(events) {
  const el = document.querySelector("#inPersonList");
  const headlineInPersonEl = document.querySelector("#headlineInPerson");
  const { recurring, onetime, multiday } = events;
  const eventsQuantity = recurring.length + onetime.length + multiday.length;
  const headlineInPersonEventsTxt = getPhrase(
    "headlineInPersonEvents"
  ).replaceAll("{QUANTITY}", `<span class="numeral">${eventsQuantity}</span>`);
  const prefs = Intl.DateTimeFormat().resolvedOptions();
  const inPersonNoneFoundEl = document.querySelector("#inPersonNoneFound");
  const inPersonListEl = document.querySelector("#inPersonList");

  headlineInPersonEl.innerHTML = headlineInPersonEventsTxt;
  inPersonNoneFoundEl.classList.add("d-none");
  el.innerHTML = "";

  if (!eventsQuantity) {
    inPersonNoneFoundEl.classList.remove("d-none");
    inPersonListEl.classList.add("d-none");
    inPersonListEl.innerHTML = "";
    return;
  }

  const allEvents = [...recurring, ...onetime, ...multiday];
  allEvents.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

  allEvents.forEach((item) => {
    const li = document.createElement("li");

    const dateTime = Intl.DateTimeFormat(prefs.locale, {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(item.eventDate));

    const distanceUnit = document.querySelector("#distanceUnit").value;
    const distance =
      distanceUnit === "miles"
        ? `${getMiles(item.distanceInMeters)} ${getPhrase("milesAbbreviation")}`
        : `${getKilometers(item.distanceInMeters)} ${getPhrase(
            "kilometersAbbreviation"
          )}`;

    li.innerHTML = `
      <strong><a href="../#/${item.eventid}">${item.title}</a></strong>
      <div class="datetime">${dateTime}</div>
      <div class="distance">
        ${getPhrase("resultsDistance")} 
        <span class="distanceNumber">${distance}</span>
      </div>
    `;

    el.appendChild(li);
  });
}

function populateVirtualResults(events) {
  const el = document.querySelector("#virtualList");
  const headlineVirtualEl = document.querySelector("#headlineVirtual");
  const { recurring, onetime, multiday } = events;
  const eventsQuantity = recurring.length + onetime.length + multiday.length;
  const headlineVirtualEventsTxt = getPhrase(
    "headlineVirtualEvents"
  ).replaceAll("{QUANTITY}", `<span class="numeral">${eventsQuantity}</span>`);
  const prefs = Intl.DateTimeFormat().resolvedOptions();
  const virtualNoneFoundEl = document.querySelector("#virtualNoneFound");
  const virtualListEl = document.querySelector("#virtualList");

  headlineVirtualEl.innerHTML = headlineVirtualEventsTxt;
  virtualNoneFoundEl.classList.add("d-none");
  el.innerHTML = "";

  if (!eventsQuantity) {
    virtualNoneFoundEl.classList.remove("d-none");
    virtualListEl.classList.add("d-none");
    virtualListEl.innerHTML = "";
    return;
  }

  const allEvents = [...recurring, ...onetime, ...multiday];
  allEvents.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

  allEvents.forEach((item) => {
    const li = document.createElement("li");

    const dateTime = Intl.DateTimeFormat(prefs.locale, {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(item.eventDate));

    const distanceUnit = document.querySelector("#distanceUnit").value;
    const distance =
      distanceUnit === "miles"
        ? `${getMiles(item.distanceInMeters)} ${getPhrase("milesAbbreviation")}`
        : `${getKilometers(item.distanceInMeters)} ${getPhrase(
            "kilometersAbbreviation"
          )}`;

    li.innerHTML = `
      <strong><a href="../#/${item.eventid}">${item.title}</a></strong>
      <div class="datetime">${dateTime}</div>
      <div class="distance d-none">
        ${getPhrase("resultsDistance")} 
        <span class="distanceNumber">${distance}</span>
      </div>
    `;

    el.appendChild(li);
  });
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
    const countryEl = document.querySelector("#country");

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
      originLocationEl.setAttribute("data-countryFromIP", "us");
      countryEl.value = "us";
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

        originLocationEl.setAttribute(
          "data-countryFromIP",
          country_code.toLowerCase()
        );

        const countryEl = document.querySelector("#country");
        countryEl.value = country_code.toLowerCase();

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
        img.setAttribute("style", "max-width: 100%");
        mapContainerEl.appendChild(img);
      })
      .catch((err) => {
        console.error(err);
        mapContainerEl.classList.add("d-none");
      });
  });
}

function updateCountryToMatchCoordinates(latitude, longitude) {
  return new Promise((resolve, reject) => {
    const endpoint = `${getApiServicesHost()}/country-of-coordinates`;

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        latitude: latitude,
        longitude: longitude,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.msgType || data.msgType !== "success") return reject();
        if (!data.countryCode || !data.countryCode.length) return reject();
        const countryEl = document.querySelector("#country");
        countryEl.value = data.countryCode;
        return resolve(data.countryCode);
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

    updateCountryToMatchCoordinates(latitude, longitude);

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
  const country = document.querySelector("#country").selectedOptions[0].value;
  const originLocation = originLocationEl.value.trim();
  const txtPleaseProvideLocation = getPhrase("pleaseProvideLocation");
  const txtPleaseProvideCountry = getPhrase("pleaseProvideCountry");
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
    customScrollTo("label[for='originLocation']", 10);
    return;
  }

  // Country
  if (!country.length) {
    showToast(txtPleaseProvideCountry, 5000, "danger", ".snackbar", true);
    customScrollTo("#country", 10);
  }

  // Language
  if (lang === "") {
    showToast(txtPleaseSelectLanguage, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='lang']", 10);
    return;
  }

  // Radius
  if (radius.trim() === "") {
    showToast(txtPleaseInputRadius, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='radius']", 10);
    return;
  }
  if (isNaN(radius.trim())) {
    showToast(txtRadiusMustBeNumeric, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='radius']", 10);
    return;
  }
  if (radius < Math.abs(radius)) {
    showToast(txtRadiusMustBePositive, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='radius']", 10);
    return;
  }
  if (Number(radius) === 0) {
    showToast(txtRadiusMustNotBeZero, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='radius']", 10);
    return;
  }

  const momentNow = moment();

  // "From" date
  const momentFromStart = moment(dateFrom);
  const momentFromEnd = momentFromStart.add(1, "days").subtract(1, "second");
  if (dateFrom.trim() === "") {
    showToast(txtPleaseInputFromDate, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='dateFrom']", 10);
    return;
  }
  if (!moment(dateFrom).isValid()) {
    showToast(txtInvalidFromDate, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='dateFrom']", 10);
    return;
  }
  if (momentFromEnd.isBefore(momentNow)) {
    showToast(txtFromDateMustNotBeInPast, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='dateFrom']", 10);
    return;
  }

  // "To" date
  const momentToStart = moment(dateTo);
  const momentToEnd = momentToStart.add(1, "days").subtract(1, "second");
  if (dateTo.trim() === "") {
    showToast(txtPleaseInputToDate, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='dateTo']", 10);
    return;
  }
  if (!moment(dateTo).isValid()) {
    showToast(txtInvalidToDate);
    customScrollTo("label[for='dateTo']", 10);
    return;
  }
  if (momentToEnd.isBefore(momentNow)) {
    showToast(txtToDateMustNotBeInPast, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='dateTo']", 10);
    return;
  }

  // "From" date must precede "To" date
  if (momentToEnd.isBefore(momentFromStart)) {
    showToast(txtFromDateMustPrecedeToDate, 5000, "danger", ".snackbar", true);
    customScrollTo("label[for='dateFrom']", 10);
    return;
  }

  const dateFromUTC = moment(dateFrom).utc().format();
  const dateToUTC = moment(`${dateTo}T23:59:59`).utc().format();
  const endpoint = `${getApiHost()}/alt-events-search`;

  hide("#searchResults");
  show("#searchResultsSpinner");
  customScrollTo("#searchResultsSpinner", 10);

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      eventid: inviteObj.event.eventid,
      userid: inviteObj.user.userid,
      recipientid: inviteObj.recipient.recipientid,
      country: country,
      countryFromIP: countryFromIP,
      lang: lang,
      originLocation: originLocation,
      radius: radius,
      distanceUnit: distanceUnit,
      dateFromUTC: dateFromUTC,
      dateToUTC: dateToUTC,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data.msgType) return;
      if (data.msgType !== "success") return;
      if (!data.events) return;
      if (!Array.isArray(data.events.inPerson.multiday)) return;
      if (!Array.isArray(data.events.inPerson.onetime)) return;
      if (!Array.isArray(data.events.inPerson.recurring)) return;
      if (!Array.isArray(data.events.virtual.multiday)) return;
      if (!Array.isArray(data.events.virtual.onetime)) return;
      if (!Array.isArray(data.events.virtual.recurring)) return;

      const noEventsFound =
        data.events.inPerson.multiday.length === 0 &&
        data.events.inPerson.onetime.length === 0 &&
        data.events.inPerson.recurring.length === 0 &&
        data.events.virtual.multiday.length === 0 &&
        data.events.virtual.onetime.length === 0 &&
        data.events.virtual.recurring.length === 0
          ? true
          : false;

      if (noEventsFound) {
        hide("#resultsFound");
        show("#noResultsFound");
      } else {
        populateInPersonResults(data.events.inPerson);
        populateVirtualResults(data.events.virtual);
        hide("#noResultsFound");
        show("#resultsFound");
      }

      hide("#searchResultsSpinner");
      show("#searchResults");
      customScrollTo("#searchResults", 10);
    })
    .catch((err) => {
      console.error(err);
      hide("#searchResultsSpinner");
      hide("#searchResults");
      customScrollTo("#altEventsSubmitButton", 10);
      globalHidePageSpinner();
    });
}

function onMapLoaded() {
  customScrollTo("#myLocationContainer", 5);

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
  await populateContent();
  await getInviteInfo();
  await populateCountries();
  await populateLanguages();
  setDefaultDates();
  setDefaultDistanceUnit();
  globalHidePageSpinner();
}

init();
