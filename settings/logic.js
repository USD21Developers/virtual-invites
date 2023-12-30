function populateInviteTextExample() {
  const userData = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  );
  const firstName = userData.firstname;
  document
    .querySelectorAll("[data-i18n='customInviteTextExample']")
    .forEach((el) => {
      const rawText = el.innerText;
      const fixedText = rawText.replaceAll("{NAME}", firstName);
      el.innerHTML = fixedText;
    });
}

function attachListeners() {
  //
}

async function init() {
  await populateContent();
  populateInviteTextExample();
  attachListeners();
  globalHidePageSpinner();
}

init();
