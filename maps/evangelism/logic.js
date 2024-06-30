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

function onSubmit(e) {
  e.preventDefault();
  showModal("This feature is coming soon!", "Under construction");
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
  globalHidePageSpinner();
}

init();
