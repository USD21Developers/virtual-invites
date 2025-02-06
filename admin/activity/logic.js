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

function populateDefaultValues() {
  const fromSelectionStored = localStorage.getItem("activityFromPreset");
  const toSelectionStored = localStorage.getItem("activityToPreset");
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
  const fromDateStored = localStorage.getItem("activityFromDate");
  const fromTimeStored = localStorage.getItem("activityFromTime");
  const toDateStored = localStorage.getItem("activityToDate");
  const toTimeStored = localStorage.getItem("activityToTime");

  if (fromSelectionStored && fromSelectionStored.length) {
    fromPresetsEl.value = fromSelectionStored;
  } else {
    localStorage.setItem("activityFromPreset", fromPresetsEl.value);
  }

  if (toSelectionStored && toSelectionStored.length) {
    toPresetsEl.value = toSelectionStored;
  } else {
    localStorage.setItem("activityToPreset", toPresetsEl.value);
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
      localStorage.setItem("activityFromDate", fromDateEl.value);
    }
  }

  if (fromTimeStored && fromTimeStored.length) {
    fromTimeEl.value = fromTimeStored;
  } else {
    if (fromTimeEl.value && fromTimeEl.value.length) {
      localStorage.setItem("activityFromTime", fromTimeEl.value);
    }
  }

  if (toDateStored && toDateStored.length) {
    toDateEl.value = toDateStored;
  } else {
    if (toDateEl.value && toDateEl.value.length) {
      localStorage.setItem("activityToDate", toDateEl.value);
    }
  }

  if (toTimeStored && toTimeStored.length) {
    toTimeEl.value = toTimeStored;
  } else {
    if (toTimeEl.value && toTimeEl.value.length) {
      localStorage.setItem("activityToTime", toTimeEl.value);
    }
  }
}

function redirectIfUnauthorized() {
  if (getUserType() !== "sysadmin") {
    window.location.href = "/logout/";
  }
}

function renderActivity(activity) {
  if (!activity) return;
  if (!Array.isArray(activity)) return;
  if (!activity.length) return;

  // TODO
}

function toggleFromPreset(e) {
  const fromDateTimeContainerEl = document.querySelector(
    "#fromDateTimeContainer"
  );
  const isSpecificDateTimeSelected =
    e.target.value === "specificDateTime" ? true : false;
  const currentSelection = e.target.value;

  localStorage.setItem("activityFromPreset", currentSelection);

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

  localStorage.setItem("activityToPreset", currentSelection);

  if (isSpecificDateTimeChecked) {
    toDateTimeContainerEl.classList.remove("d-none");
  } else {
    toDateTimeContainerEl.classList.add("d-none");
  }
}

function onChangeFromDate(e) {
  const newValue = e.target.value;
  if (newValue && newValue.length) {
    localStorage.setItem("activityFromDate", newValue);
  }
}

function onChangeFromTime(e) {
  const newValue = e.target.value;
  if (newValue && newValue.length) {
    localStorage.setItem("activityFromTime", newValue);
  }
}

function onChangeToDate(e) {
  const newValue = e.target.value;
  if (newValue && newValue.length) {
    localStorage.setItem("activityToDate", newValue);
  }
}

function onChangeToTime(e) {
  const newValue = e.target.value;
  if (newValue && newValue.length) {
    localStorage.setItem("activityToTime", newValue);
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

  globalShowPageSpinner();

  const accessToken = await getAccessToken();
  const endpoint = `${getApiHost()}/admin-activity`;

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
    .then((data) => {
      switch (data.msg) {
        case "invalid from datetime":
          // TODO:  Handle error
          break;
        case "invalid to datetime":
          // TODO:  Handle error
          break;
        case "fromDateTime must come before toDateTime":
          // TODO:  Handle error
          break;
        case "unable to query as admin for activity":
          // TODO:  Handle error
          break;
        case "activity retrieved":
          const activity = data.activity;
          renderActivity(activity);
          break;
        default:
          throw new Error("unrecognized API response");
      }
    })
    .catch((error) => {
      console.error(error);
      // TODO:  Handle error
    })
    .finally(() => {
      globalHidePageSpinner();
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
  document.querySelector("#activityForm").addEventListener("submit", onSubmit);
}

async function init() {
  await populateContent();
  redirectIfUnauthorized();
  addEventListeners();
  populateDefaultValues();
  globalHidePageSpinner();
}

init();
