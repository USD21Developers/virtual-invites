let map, heatmap;
let churchDefaultLatitude;
let churchDefaultLongitude;
let churchDefaultZoom;
let country;
let language = getLang();
let locale;
const markersMyInvites = [];
const markersOthersInvites = [];
const defaultColorMyInvites = namedColorToHex("red");
const defaultColorOthersInvites = namedColorToHex("blue");
const darkStyle = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#181818" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1b1b1b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a8a8a" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#373737" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3c3c3c" }],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry",
    stylers: [{ color: "#4e4e4e" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d3d3d" }],
  },
];

function askToConnect() {
  const headlineEl = document.querySelector(
    "#pageContent [data-i18n='pageHeadline']"
  );
  const contentEl = document.querySelector(
    "#pageContent .row:nth-child(2) div.col"
  );

  headlineEl.innerHTML = getPhrase("pagetitle");
  contentEl.innerHTML = `
    <p class="text-center text-danger font-weight-bold">
      ${getGlobalPhrase("youAreOffline")}
    </p>

    <div class="mt-4 pt-2 text-center">
      <button class="btn btn-primary" onClick="javascript:window.location.reload()">
        <span class="mr-1"><img src="/_assets/svg/icons/reload-white.svg" width="24" height="24"></span>
        <span>${getGlobalPhrase("reload")}</span>
      </button>
    </div>
  `;
  globalHidePageSpinner();
}

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

async function initMap(searchResults) {
  const { othersInvites, userInvites, userEvents } = searchResults;
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary(
    "marker"
  );
  const defaultMapInfo = await getDefaultMapInfo();

  if (!defaultMapInfo) return;

  const { latitude, longitude, zoom } = defaultMapInfo;

  churchDefaultLatitude = latitude;
  churchDefaultLongitude = longitude;
  churchDefaultZoom = zoom;

  map = new Map(document.getElementById("map"), {
    zoom: zoom,
    center: { lat: latitude, lng: longitude },
    mapTypeId: "terrain",
    styles: darkStyle,
  });

  const bounds = new google.maps.LatLngBounds();

  userInvites.forEach((invite) => {
    const { lat, lng, recipientname, invitedAt, invitationid, eventid } =
      invite;
    const pin = new PinElement({
      background: defaultColorMyInvites,
      borderColor: "white",
      glyphColor: "white",
    });
    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat: lat, lng: lng },
      title: recipientname,
      content: pin.element,
    });

    const event = userEvents.find((item) => item.eventid === eventid);
    const headerEl = document.createElement("h4");
    headerEl.innerText = recipientname;

    const dateTimeInvited = Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(invitedAt));

    const infowindow = new google.maps.InfoWindow({
      headerContent: headerEl,
      content: `
        <p class="mt-0">
          <strong>${getPhrase("mapBubbleInvited")}</strong><br>
          ${dateTimeInvited}
        </p>

        <p>
          <strong>${getPhrase("mapBubbleEvent")}</strong><br>
          ${event.title}
        </p>

        <p class="mb-0">
          <strong><a href="/r/#/${invitationid}">${getPhrase(
        "mapBubbleDetails"
      )}</a></strong>
        </p>
      `,
    });

    marker.addListener("click", () => {
      infowindow.open({
        anchor: marker,
        map,
      });
    });

    markersMyInvites.push(marker);
    bounds.extend(marker.position);
  });

  othersInvites.forEach((invite) => {
    const { lat, lng } = invite;
    const pin = new PinElement({
      background: defaultColorOthersInvites,
      borderColor: "white",
      glyphColor: "white",
    });
    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat: lat, lng: lng },
      content: pin.element,
    });

    markersOthersInvites.push(marker);
    bounds.extend(marker.position);
  });

  // Calculate the center of the bounds
  const center = bounds.getCenter();

  // Set the map center to the calculated center
  map.setCenter(center);

  // Re-center the map on window resize to maintain the center
  window.addEventListener("resize", () => {
    map.setCenter(center);
  });

  // Enable heat map
  await google.maps.importLibrary("visualization");
  var heatmapData = [];
  userInvites.forEach((invite) => {
    const { lat, lng } = invite;
    const point = new google.maps.LatLng(lat, lng);
    heatmapData.push(point);
  });
  othersInvites.forEach((invite) => {
    const { lat, lng } = invite;
    const point = new google.maps.LatLng(lat, lng);
    heatmapData.push(point);
  });
  heatmap = new google.maps.visualization.HeatmapLayer({
    data: heatmapData,
  });
  // heatmap.setMap(map);
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
    libraries: "maps, visualization",
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

async function populateChurchName() {
  const modalChurchNameEl = document.querySelector("#modalChurchName");
  const churches = await getChurches();
  const churchid = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  ).churchid;
  const church = churches.find((item) => item.id === churchid);
  const churchName = church.name;
  modalChurchNameEl.innerHTML = churchName;
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
  const fromDateStored = localStorage.getItem("mapEvangelismFromDate");
  const fromTimeStored = localStorage.getItem("mapEvangelismFromTime");
  const toDateStored = localStorage.getItem("mapEvangelismToDate");
  const toTimeStored = localStorage.getItem("mapEvangelismToTime");

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

function prepareMap(searchResults) {
  return new Promise(async (resolve, reject) => {
    const {
      othersInvites,
      userInvites,
      userEvents,
      dateTimeUTCFrom,
      dateTimeUTCTo,
    } = searchResults;
    const totalQuantity = userInvites.length + othersInvites.length;
    const totalInvitesQuantityEl = document.querySelector(
      "#totalInvitesQuantity"
    );
    const checkboxMyInvitesEl = document.querySelector("#checkboxMyInvites");
    const checkboxOthersInvitesEl = document.querySelector(
      "#checkboxOthersInvites"
    );
    const checkboxMyInvitesLabelEl = document.querySelector(
      "label[for='checkboxMyInvites']"
    );
    const checkboxOthersInvitesLabelEl = document.querySelector(
      "label[for='checkboxOthersInvites']"
    );
    const modalDateTimeFromEl = document.querySelector("#modalDateTimeFrom");
    const modalDateTimeToEl = document.querySelector("#modalDateTimeTo");
    const myInvitesLabelText = getPhrase("checkboxMine").replaceAll(
      "{QUANTITY}",
      `<span class="quantity">${userInvites.length}</span>`
    );
    const othersInvitesLabelText = getPhrase("checkboxOhers").replaceAll(
      "{QUANTITY}",
      `<span class="quantity">${othersInvites.length}</span>`
    );
    checkboxMyInvitesLabelEl.innerHTML = myInvitesLabelText;
    checkboxOthersInvitesLabelEl.innerHTML = othersInvitesLabelText;
    totalInvitesQuantityEl.innerHTML = `(${totalQuantity})`;

    const churches = await getChurches();
    const userChurchId = JSON.parse(
      atob(localStorage.getItem("refreshToken").split(".")[1])
    ).churchid;
    const userChurch = churches.find((item) => item.id === userChurchId);
    country = userChurch.country;
    language = getLang();
    const locale = `${language.toLowerCase()}-${country.toUpperCase()}`;
    const fromDateTimeLocal = Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(dateTimeUTCFrom));
    const toDateTimeLocal = Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(dateTimeUTCTo));

    modalDateTimeFromEl.innerHTML = fromDateTimeLocal;
    modalDateTimeToEl.innerHTML = toDateTimeLocal;

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

function toggleHeatmap() {
  if (heatmap.getMap()) {
    heatmap.setMap(null); // Turn off heat map
    // map.setOptions({ styles: null }); // Revert to default style
  } else {
    heatmap.setMap(map); // Turn on heat map
    // map.setOptions({ styles: darkStyle }); // Apply dark style
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

function toggleMyInvites(e) {
  const isChecked = e.target.checked ? true : false;
  markersMyInvites.forEach((marker) => (marker.map = isChecked ? map : null));
}

function toggleOthersInvites(e) {
  const isChecked = e.target.checked ? true : false;
  markersOthersInvites.forEach(
    (marker) => (marker.map = isChecked ? map : null)
  );
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
  const noResultsEl = document.querySelector("#noResultsFound");
  const fromSpecificDate = document.querySelector("#fromDate").value;
  const fromSpecificTime = document.querySelector("#fromTime").value;
  const toSpecificDate = document.querySelector("#toDate").value;
  const toSpecificTime = document.querySelector("#toTime").value;
  const fromThisMorning = moment().startOf("day").utc().format();
  const fromYesterday = moment()
    .subtract(1, "days")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .utc()
    .format();
  const fromBeginningOfThisWeek = moment()
    .startOf("week")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .utc()
    .format();
  const fromBeginningOfThisMonth = moment()
    .startOf("month")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .utc()
    .format();
  const fromBeginningOfLastMonth = moment()
    .startOf("month")
    .subtract(1, "months")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .utc()
    .format();
  const fromBeginningOfThisYear = moment()
    .startOf("year")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .utc()
    .format();
  const fromDaysAgo3 = moment()
    .subtract(3, "days")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .utc()
    .format();
  const fromDaysAgo7 = moment()
    .subtract(7, "days")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .utc()
    .format();
  const fromDaysAgo10 = moment()
    .subtract(10, "days")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .utc()
    .format();
  const fromDaysAgo14 = moment()
    .subtract(14, "days")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .utc()
    .format();
  const fromDaysAgo21 = moment()
    .subtract(21, "days")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .utc()
    .format();
  const fromDaysAgo30 = moment()
    .subtract(30, "days")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .utc()
    .format();
  const fromDaysAgo60 = moment()
    .subtract(60, "days")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .utc()
    .format();
  const fromMonthsAgo3 = moment()
    .subtract(3, "months")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .utc()
    .format();
  const fromMonthsAgo6 = moment()
    .subtract(6, "months")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .utc()
    .format();
  const fromMonthsAgo9 = moment()
    .subtract(9, "months")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .utc()
    .format();
  const fromYearsAgo1 = moment()
    .subtract(1, "years")
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    .utc()
    .format();
  let fromSpecificDateTime;
  let toSpecificDateTime;
  let fromDateTime;
  let toDateTime;

  if (fromSpecificDate.length && fromSpecificTime.length) {
    fromSpecificDateTime = moment(`${fromSpecificDate} ${fromSpecificTime}`)
      .utc()
      .format();
  }

  if (toSpecificDate.length && toSpecificTime.length) {
    toSpecificDateTime = moment(`${toSpecificDate} ${toSpecificTime}`)
      .utc()
      .format();
  }

  const fromPreset = document.querySelector("#fromPresets").value;
  const toPreset = document.querySelector("#toPresets").value;

  switch (fromPreset) {
    case "thisMorning":
      fromDateTime = fromThisMorning;
      break;
    case "yesterday":
      fromDateTime = fromYesterday;
      break;
    case "beginningOfThisWeek":
      fromDateTime = fromBeginningOfThisWeek;
      break;
    case "beginningOfThisMonth":
      fromDateTime = fromBeginningOfThisMonth;
      break;
    case "beginningOfLastMonth":
      fromDateTime = fromBeginningOfLastMonth;
      break;
    case "beginningOfThisYear":
      fromDateTime = fromBeginningOfThisYear;
      break;
    case "daysAgo3":
      fromDateTime = fromDaysAgo3;
      break;
    case "daysAgo7":
      fromDateTime = fromDaysAgo7;
      break;
    case "daysAgo10":
      fromDateTime = fromDaysAgo10;
      break;
    case "daysAgo14":
      fromDateTime = fromDaysAgo14;
      break;
    case "daysAgo21":
      fromDateTime = fromDaysAgo21;
      break;
    case "daysAgo30":
      fromDateTime = fromDaysAgo30;
      break;
    case "daysAgo60":
      fromDateTime = fromDaysAgo60;
      break;
    case "monthsAgo3":
      fromDateTime = fromMonthsAgo3;
      break;
    case "monthsAgo6":
      fromDateTime = fromMonthsAgo6;
      break;
    case "monthsAgo9":
      fromDateTime = fromMonthsAgo9;
      break;
    case "yearsAgo1":
      fromDateTime = fromYearsAgo1;
      break;
    case "specificDateTime":
      fromDateTime = fromSpecificDateTime;
      break;
  }

  switch (toPreset) {
    case "now":
      toDateTime = moment().utc().format();
      break;
    case "specificDateTime":
      toDateTime = toSpecificDateTime;
      break;
  }

  if (!moment(fromDateTime).isValid()) {
    showToast(
      getPhrase("incompleteFromDateTime"),
      5000,
      "danger",
      ".snackbar",
      true
    );
    return;
  }

  if (!moment(toDateTime).isValid()) {
    showToast(
      getPhrase("incompleteToDateTime"),
      5000,
      "danger",
      ".snackbar",
      true
    );
    return;
  }

  noResultsEl.classList.add("d-none");

  const accessToken = await getAccessToken();
  const endpoint = `${getApiHost()}/map-evangelism`;

  globalShowPageSpinner();

  fetch(endpoint, {
    mode: "cors",
    method: "post",
    body: JSON.stringify({
      fromDateTime: fromDateTime,
      toDateTime: toDateTime,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
    }),
  })
    .then((res) => res.json())
    .then(async (data) => {
      if (data.msgType === "error") {
        throw new Error(data.msg);
      }

      const { othersInvites, userInvites } = data.searchResults;
      const totalQuantity = userInvites.length + othersInvites.length;

      if (totalQuantity === 0) {
        noResultsEl.classList.remove("d-none");
        globalHidePageSpinner();
        customScrollTo("#noResultsFound");
        return;
      }

      await initMap(data.searchResults); // Financial cost is incurred here ($0.007 per load)
      await prepareMap(data.searchResults);
      globalHidePageSpinner();
      $("#modal").modal();
    })
    .catch((error) => {
      console.error(error);
      globalHidePageSpinner();

      switch (error) {
        case "invalid value for fromDateTime":
          showToast(
            getPhrase("incompleteFromDateTime"),
            5000,
            "danger",
            ".snackbar",
            true
          );
          break;
        case "invalid value for toDateTime":
          showToast(
            getPhrase("incompleteToDateTime"),
            5000,
            "danger",
            ".snackbar",
            true
          );
          break;
      }
    });
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
  document
    .querySelector("#checkboxMyInvites")
    .addEventListener("click", toggleMyInvites);
  document
    .querySelector("#checkboxOthersInvites")
    .addEventListener("click", toggleOthersInvites);
}

async function init() {
  syncEvents();

  await populateContent();

  if (!navigator.onLine) {
    askToConnect();
    return;
  }

  populateChurchName();
  addEventListeners();
  populateDefaultValues();
  await loadGoogleMapsLibs();
  globalHidePageSpinner();
}

init();
