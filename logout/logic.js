function init() {
  const redirectOnLogin = sessionStorage.getItem("redirectOnLogin");
  const isFromHomeScreen = sessionStorage.getItem("isFromHomeScreen");
  let loginURL = "../login/";

  debugger;

  clearStorage();

  if (!!isFromHomeScreen) {
    loginURL = loginURL + "?utm_source=homescreen";
    sessionStorage.setItem("isFromHomeScreen", "true");
  }

  if (!!redirectOnLogin) {
    sessionStorage.setItem("redirectOnLogin", redirectOnLogin);
  }

  window.location.href = loginURL;
}

init();
