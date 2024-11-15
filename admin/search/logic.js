function redirectIfUnauthorized() {
  const refreshTokenStored = localStorage.getItem("refreshToken");

  const kickOut = () => {
    return (window.location.href = "/logout/");
  };

  if (!refreshTokenStored) {
    kickOut();
  }

  const refreshToken = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  );
  const { canAuthorize, canAuthToAuth } = refreshToken;

  if (!canAuthorize && !canAuthToAuth) {
    kickOut();
  }
}

async function init() {
  await populateContent();
  redirectIfUnauthorized();
  globalHidePageSpinner();
}

init();
