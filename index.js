async function init() {
  await populateContent();
  globalHidePageSpinner();
  syncEvents();
}

init();
