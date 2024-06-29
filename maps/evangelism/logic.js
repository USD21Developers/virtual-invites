function toggleFromDateTime(e) {
  const fromDateTimeContainerEl = document.querySelector(
    "#fromDateTimeContainer"
  );
  const isSpecificDateTimeSelected =
    e.target.value === "specificDateTime" ? true : false;

  if (isSpecificDateTimeSelected) {
    fromDateTimeContainerEl.classList.remove("d-none");
  } else {
    fromDateTimeContainerEl.classList.add("d-none");
  }
}

function toggleToDateTime(e) {
  const toDateTimeContainerEl = document.querySelector("#toDateTimeContainer");
  const isSpecificDateTimeSelected =
    e.target.value === "specificDateTime" ? true : false;

  if (isSpecificDateTimeSelected) {
    toDateTimeContainerEl.classList.remove("d-none");
  } else {
    toDateTimeContainerEl.classList.add("d-none");
  }
}

function toggleToDateTime(e) {
  const toDateTimeContainerEl = document.querySelector("#toDateTimeContainer");
  const isSpecificDateTimeChecked =
    e.target.value === "specificDateTime" ? true : false;

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
  globalHidePageSpinner();
}

init();
