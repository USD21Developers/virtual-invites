let map;

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
  const colorMyInvites = document.querySelector("#colorMyInvites");
  const colorOthersInvites = document.querySelector("#colorOthersInvites");
  const fromDateStored = localStorage.getItem("mapEvangelismFromDate");
  const fromTimeStored = localStorage.getItem("mapEvangelismFromTime");
  const toDateStored = localStorage.getItem("mapEvangelismToDate");
  const toTimeStored = localStorage.getItem("mapEvangelismToTime");

  colorMyInvites.value = namedColorToHex("blue");
  colorOthersInvites.value = namedColorToHex("green");

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
    const country = userChurch.country;
    const language = getLang();
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

    // TODO:  populate map markers with searchResults
    // TODO:  make markers for user's invites show invite and event details
    // TODO:  make markers for others' invites show only date and time

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
  const fromSpecificDate = document.querySelector("#fromDate").value;
  const fromSpecificTime = document.querySelector("#fromTime").value;
  const toSpecificDate = document.querySelector("#toDate").value;
  const toSpecificTime = document.querySelector("#toTime").value;
  const fromThisMorning = moment().utc().format();
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
      fromDateTIme = fromBeginningOfThisYear;
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

      await syncEvents();
      await initMap(); // Financial cost is incurred here ($0.007 per load)
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
}

async function init() {
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
