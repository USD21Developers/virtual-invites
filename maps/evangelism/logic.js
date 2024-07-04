let map;

function getMapKey() {
  let keys;

  try {
    keys = JSON.parse(
      atob(localStorage.getItem("refreshToken").split(".")[1])
    ).mapsApiKeys;
  } catch (err) {
    keys = null;
  }

  if (!keys) {
    sessionStorage.setItem("redirectOnLogin", window.location.href);
    window.location.href = "../../logout/";
  }

  switch (window.location.hostname) {
    case "localhost":
      return keys.dev;
    case "staging.invites.mobi":
      return keys.staging;
    case "invites.mobi":
      return keys.prod;
  }
}

function getDefaultMapInfo() {
  return new Promise(async (resolve, reject) => {
    const accessToken = await getAccessToken();
    const endpoint = `${getApiHost()}/map-defaults-for-church`;

    fetch(endpoint, {
      mode: "cors",
      method: "post",
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        switch (data.msg) {
          case "map defaults for user's church retrieved":
            resolve(data.mapDefaults);
            break;
          default:
            console.error(data.msg);
            reject(data.msg);
            break;
        }
      });
  });
}

async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const defaultMapInfo = await getDefaultMapInfo();

  if (!defaultMapInfo) return;

  const { latitude, longitude, zoom } = defaultMapInfo;

  map = new Map(document.getElementById("map"), {
    center: { lat: latitude, lng: longitude },
    zoom: zoom,
  });
}

async function loadGoogleMapsLibs() {
  const churches = await getChurches();
  const userChurchId = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  ).churchid;
  const userChurch = churches.find((item) => item.id === userChurchId);
  const mapCountry = userChurch.country;
  const mapLanguage = getLang();
  const mapKey = getMapKey();

  return ((g) => {
    var h,
      a,
      k,
      p = "The Google Maps JavaScript API",
      c = "google",
      l = "importLibrary",
      q = "__ib__",
      m = document,
      b = window;
    b = b[c] || (b[c] = {});
    var d = b.maps || (b.maps = {}),
      r = new Set(),
      e = new URLSearchParams(),
      u = () =>
        h ||
        (h = new Promise(async (f, n) => {
          await (a = m.createElement("script"));
          e.set("libraries", [...r] + "");
          for (k in g)
            e.set(
              k.replace(/[A-Z]/g, (t) => "_" + t[0].toLowerCase()),
              g[k]
            );
          e.set("callback", c + ".maps." + q);
          a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
          d[q] = f;
          a.onerror = () => (h = n(Error(p + " could not load.")));
          a.nonce = m.querySelector("script[nonce]")?.nonce || "";
          m.head.append(a);
        }));
    d[l]
      ? console.warn(p + " only loads once. Ignoring:", g)
      : (d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)));
  })({
    key: mapKey,
    v: "weekly",
    loading: "async",
    libraries: "maps",
    region: mapCountry,
    language: mapLanguage,
    // Use the 'v' parameter to indicate the version to use (weekly, beta, alpha, etc.).
    // Add other bootstrap parameters as needed, using camel case.
  });
}

function namedColorToHex(color) {
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.fillStyle = color;
  return ctx.fillStyle;
}

function populateDefaultValues() {
  const fromSelectionStored = localStorage.getItem("mapEvangelismFromPreset");
  const toSelectionStored = localStorage.getItem("mapEvangelismToPreset");
  const fromPresetsEl = document.querySelector("#fromPresets");
  const toPresetsEl = document.querySelector("#toPresets");
  const fromSpecificDateTimeEl = document.querySelector(
    "#fromDateTimeContainer"
  );
  const toSpecificDateTimeEl = document.querySelector("#toDateTimeContainer");
  const fromDateEl = document.querySelector("#fromDate");
  const fromTimeEl = document.querySelector("#fromTime");
  const toDateEl = document.querySelector("#toDate");
  const toTimeEl = document.querySelector("#toTime");
  const colorMyInvites = document.querySelector("#colorMyInvites");
  const colorOthersInvites = document.querySelector("#colorOthersInvites");
  const fromDateStored = localStorage.getItem("mapEvangelismFromDate");
  const fromTimeStored = localStorage.getItem("mapEvangelismFromTime");
  const toDateStored = localStorage.getItem("mapEvangelismToDate");
  const toTimeStored = localStorage.getItem("mapEvangelismToTime");

  colorMyInvites.value = namedColorToHex("tomato");
  colorOthersInvites.value = namedColorToHex("cornflowerblue");

  if (fromSelectionStored && fromSelectionStored.length) {
    fromPresetsEl.value = fromSelectionStored;
  } else {
    localStorage.setItem("mapEvangelismFromPreset", fromPresetsEl.value);
  }

  if (toSelectionStored && toSelectionStored.length) {
    toPresetsEl.value = toSelectionStored;
  } else {
    localStorage.setItem("mapEvangelismToPreset", toPresetsEl.value);
  }

  if (fromPresetsEl.value === "specificDateTime") {
    fromSpecificDateTimeEl.classList.remove("d-none");
  } else {
    fromSpecificDateTimeEl.classList.add("d-none");
  }

  if (toPresetsEl.value === "specificDateTime") {
    toSpecificDateTimeEl.classList.remove("d-none");
  } else {
    toSpecificDateTimeEl.classList.add("d-none");
  }

  if (fromDateStored && fromDateStored.length) {
    fromDateEl.value = fromDateStored;
  } else {
    if (fromDateEl.value && fromDateEl.value.length) {
      localStorage.setItem("mapEvangelismFromDate", fromDateEl.value);
    }
  }

  if (fromTimeStored && fromTimeStored.length) {
    fromTimeEl.value = fromTimeStored;
  } else {
    if (fromTimeEl.value && fromTimeEl.value.length) {
      localStorage.setItem("mapEvangelismFromTime", fromTimeEl.value);
    }
  }

  if (toDateStored && toDateStored.length) {
    toDateEl.value = toDateStored;
  } else {
    if (toDateEl.value && toDateEl.value.length) {
      localStorage.setItem("mapEvangelismToDate", toDateEl.value);
    }
  }

  if (toTimeStored && toTimeStored.length) {
    toTimeEl.value = toTimeStored;
  } else {
    if (toTimeEl.value && toTimeEl.value.length) {
      localStorage.setItem("mapEvangelismToTime", toTimeEl.value);
    }
  }
}

function search() {
  return new Promise((resolve, reject) => {
    const checkboxMyInvitesLabel = document.querySelector(
      "label[for='checkboxMyInvites']"
    );
    const checkboxOthersInvitesLabel = document.querySelector(
      "label[for='checkboxOthersInvites']"
    );
    const myInvitesLabelText = getPhrase("checkboxMine").replaceAll(
      "{QUANTITY}",
      `<span class="quantity">${5}</span>`
    );
    const othersInvitesLabelText = getPhrase("checkboxOhers").replaceAll(
      "{QUANTITY}",
      `<span class="quantity">${245}</span>`
    );
    checkboxMyInvitesLabel.innerHTML = myInvitesLabelText;
    checkboxOthersInvitesLabel.innerHTML = othersInvitesLabelText;
    // globalHidePageSpinner();
    resolve();
  });
}

function toggleFromPreset(e) {
  const fromDateTimeContainerEl = document.querySelector(
    "#fromDateTimeContainer"
  );
  const isSpecificDateTimeSelected =
    e.target.value === "specificDateTime" ? true : false;
  const currentSelection = e.target.value;

  localStorage.setItem("mapEvangelismFromPreset", currentSelection);

  if (isSpecificDateTimeSelected) {
    fromDateTimeContainerEl.classList.remove("d-none");
  } else {
    fromDateTimeContainerEl.classList.add("d-none");
  }
}

function toggleToPreset(e) {
  const toDateTimeContainerEl = document.querySelector("#toDateTimeContainer");
  const isSpecificDateTimeChecked =
    e.target.value === "specificDateTime" ? true : false;
  const currentSelection = e.target.value;

  localStorage.setItem("mapEvangelismToPreset", currentSelection);

  if (isSpecificDateTimeChecked) {
    toDateTimeContainerEl.classList.remove("d-none");
  } else {
    toDateTimeContainerEl.classList.add("d-none");
  }
}

function onChangeFromDate(e) {
  const newValue = e.target.value;
  if (newValue && newValue.length) {
    localStorage.setItem("mapEvangelismFromDate", newValue);
  }
}

function onChangeFromTime(e) {
  const newValue = e.target.value;
  if (newValue && newValue.length) {
    localStorage.setItem("mapEvangelismFromTime", newValue);
  }
}

function onChangeToDate(e) {
  const newValue = e.target.value;
  if (newValue && newValue.length) {
    localStorage.setItem("mapEvangelismToDate", newValue);
  }
}

function onChangeToTime(e) {
  const newValue = e.target.value;
  if (newValue && newValue.length) {
    localStorage.setItem("mapEvangelismToTime", newValue);
  }
}

async function onSubmit(e) {
  e.preventDefault();
  await search();
  $("#modal").modal();
}

function addEventListeners() {
  document
    .querySelector("#fromPresets")
    .addEventListener("change", toggleFromPreset);
  document
    .querySelector("#toPresets")
    .addEventListener("change", toggleToPreset);
  document
    .querySelector("#fromDate")
    .addEventListener("change", onChangeFromDate);
  document
    .querySelector("#fromTime")
    .addEventListener("change", onChangeFromTime);
  document.querySelector("#toDate").addEventListener("change", onChangeToDate);
  document.querySelector("#toTime").addEventListener("change", onChangeToTime);
  document.querySelector("#mapForm").addEventListener("submit", onSubmit);
}

async function init() {
  await populateContent();
  addEventListeners();
  populateDefaultValues();
  await loadGoogleMapsLibs();
  await initMap();
  globalHidePageSpinner();
}

init();
