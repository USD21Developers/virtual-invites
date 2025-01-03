function toggleRegistrationPromotion() {
  const refreshTokenStored = localStorage.getItem("refreshToken");

  if (!refreshTokenStored) {
    document.querySelectorAll(".promotesRegistration").forEach((item) => {
      item.classList.remove("d-none");
    });
  }
}

async function init() {
  await populateContent();
  toggleRegistrationPromotion();
  globalHidePageSpinner();
}

init();
