function init() {
  const redirectOnLogin = sessionStorage.getItem("redirectOnLogin");
  let newUrl = "../login/";

  clearStorage();
  if (redirectOnLogin) {
    sessionStorage.setItem("redirectOnLogin", redirectOnLogin);
  }
  window.location.href = newUrl;
}

init();
