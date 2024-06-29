function toggleFromDateTime(e) {
  const fromDateTimeContainerEl = document.querySelector(
    "#fromDateTimeContainer"
  );
  const isSpecificDateTimeChecked =
    e.target.value === "specificDateTime" ? true : false;

  if (isSpecificDateTimeChecked) {
    fromDateTimeContainerEl.classList.remove("d-none");
  } else {
    fromDateTimeContainerEl.classList.add("d-none");
  }
}

function toggleToDateTime(e) {
  const toDateTimeContainerEl = document.querySelector("#toDateTimeContainer");
  const isSpecificDateTimeChecked =
    e.target.value === "previous" ? true : false;

  if (isSpecificDateTimeChecked) {
    toDateTimeContainerEl.classList.remove("d-none");
  } else {
    toDateTimeContainerEl.classList.add("d-none");
  }
}

function addEventListeners() {
  document
    .querySelector("#fromPresets")
    .addEventListener("change", toggleFromDateTime);
  document
    .querySelector("#toDateTimeNow")
    .addEventListener("click", toggleToDateTime);
  document
    .querySelector("#toDateTimePrevious")
    .addEventListener("click", toggleToDateTime);
}

async function init() {
  await populateContent();
  addEventListeners();
  globalHidePageSpinner();
}

init();
