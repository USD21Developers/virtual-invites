function toggleRegistrationPromotion() {
  const refreshToken = localStorage.getItem("refreshToken") || null;

  if (refreshToken) {
    document.querySelectorAll(".promotesRegistration").forEach((item) => {
      item.classList.add("d-none");
    });
  }
}

async function init() {
  await populateContent();
  toggleRegistrationPromotion();
  globalHidePageSpinner();
}

init();
