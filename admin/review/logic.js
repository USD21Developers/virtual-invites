function attachListeners() {}

async function init() {
  await populateContent();
  attachListeners();
  globalHidePageSpinner();
}

init();
