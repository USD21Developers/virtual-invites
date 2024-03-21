function init() {
  const redirectOnLogin = sessionStorage.getItem("redirectOnLogin");
  let newUrl = "../login/";
  const launchedFromHomeScreen = (window.location.search =
    "?utm_source=homepage" ? true : false);

  if (launchedFromHomeScreen) {
    newUrl = newUrl + "?utm_source=homepage";
  }

  clearStorage();
  if (redirectOnLogin) {
    sessionStorage.setItem("redirectOnLogin", redirectOnLogin);
  }
  window.location.href = newUrl;
}

init();
