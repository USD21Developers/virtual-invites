async function init() {
  await populateContent();
  document
    .querySelector("[data-i18n='thankYouP1']")
    .setAttribute("target", "_blank");
  globalHidePageSpinner();
}

init();
