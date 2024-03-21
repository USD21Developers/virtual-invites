function init() {
  const redirectOnLogin = sessionStorage.getItem("redirectOnLogin");
  const isFromHomeScreen = sessionStorage.getItem("isFromHomeScreen");
  let newUrl = "../login/";

  clearStorage();

  if (redirectOnLogin) {
    sessionStorage.setItem("redirectOnLogin", redirectOnLogin);
  }

  if (!!isFromHomeScreen) {
    newUrl = newUrl + "?utm_source=homescreen";
  }

  window.location.href = newUrl;
}

init();
