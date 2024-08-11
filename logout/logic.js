function init() {
  const redirectOnLogin = sessionStorage.getItem("redirectOnLogin");
  const isFromHomeScreen = sessionStorage.getItem("isFromHomeScreen");
  let loginURL = "../login/";

  clearStorage();

  if (!!isFromHomeScreen) {
    loginURL = loginURL + "?utm_source=homescreen";
    sessionStorage.setItem("isFromHomeScreen", "true");
  }

  if (!!redirectOnLogin) {
    sessionStorage.setItem("redirectOnLogin", redirectOnLogin);
  }

  document.cookie =
    "preAuthToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  window.location.href = loginURL;
}

init();
