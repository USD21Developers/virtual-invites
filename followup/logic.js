function attachListeners() {
  //
}

async function init() {
  await populateContent();
  globalHidePageSpinner();
  attachListeners();
}

init();
