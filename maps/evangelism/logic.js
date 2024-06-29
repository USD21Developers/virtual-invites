function populateDefaultValues() {
  const fromSelectionStored = localStorage.getItem("mapEvangelismFrom");
  const toSelectionStored = localStorage.getItem("mapEvangelismTo");
  const fromPresetsEl = document.querySelector("#fromPresets");
  const toPresetsEl = document.querySelector("#toPresets");
  const fromSpecificDateTimeEl = document.querySelector(
    "#fromDateTimeContainer"
  );
  const toSpecificDateTimeEl = document.querySelector("#toDateTimeContainer");

  if (fromSelectionStored && fromSelectionStored.length) {
    fromPresets.value = fromSelectionStored;
  } else {
    localStorage.setItem("mapEvangelismFrom", fromPresetsEl.value);
  }

  if (toSelectionStored && toSelectionStored.length) {
    toPresets.value = toSelectionStored;
  } else {
    localStorage.setItem("mapEvangelismTo", toPresetsEl.value);
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
}

function toggleFromDateTime(e) {
  const fromDateTimeContainerEl = document.querySelector(
    "#fromDateTimeContainer"
  );
  const isSpecificDateTimeSelected =
    e.target.value === "specificDateTime" ? true : false;
  const currentSelection = e.target.value;

  localStorage.setItem("mapEvangelismFrom", currentSelection);

  if (isSpecificDateTimeSelected) {
    fromDateTimeContainerEl.classList.remove("d-none");
  } else {
    fromDateTimeContainerEl.classList.add("d-none");
  }
}

function toggleToDateTime(e) {
  const toDateTimeContainerEl = document.querySelector("#toDateTimeContainer");
  const isSpecificDateTimeChecked =
    e.target.value === "specificDateTime" ? true : false;
  const currentSelection = e.target.value;

  localStorage.setItem("mapEvangelismTo", currentSelection);

  if (isSpecificDateTimeChecked) {
    toDateTimeContainerEl.classList.remove("d-none");
  } else {
    toDateTimeContainerEl.classList.add("d-none");
  }
}

function onSubmit(e) {
  e.preventDefault();
  showModal("This feature is coming soon!", "Under construction");
}

function addEventListeners() {
  document
    .querySelector("#fromPresets")
    .addEventListener("change", toggleFromDateTime);
  document
    .querySelector("#toPresets")
    .addEventListener("change", toggleToDateTime);
  document.querySelector("#mapForm").addEventListener("submit", onSubmit);
}

async function init() {
  await populateContent();
  addEventListeners();
  populateDefaultValues();
  globalHidePageSpinner();
}

init();
