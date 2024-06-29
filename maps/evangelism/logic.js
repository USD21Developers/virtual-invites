function populateDefaultDates() {
  const toNowEl = document.querySelector("#toNow");
  const toDateEl = document.querySelector("#toDate");
  const toTimeEl = document.querySelector("#toTime");
  const dateNow = moment().format("YYYY-MM-DD");
  const timeNow = moment().format("HH:mm:ss");

  if (toNowEl.checked) {
    toDateEl.value = dateNow;
    toTimeEl.value = timeNow;
  }
}

function toggleToDateTime(e) {
  if (e.target.checked) {
    populateDefaultDates();
  } else {
    const toDateEl = document.querySelector("#toDate");
    const toTimeEl = document.querySelector("#toTime");
    toDateEl.value = "";
    toTimeEl.value = "";
  }
}

function addEventListeners() {
  document.querySelector("#toNow").addEventListener("click", toggleToDateTime);
}

async function init() {
  await populateContent();
  populateDefaultDates();
  addEventListeners();
  globalHidePageSpinner();
}

init();
