function init() {
  const redirectOnLogin = sessionStorage.getItem("redirectOnLogin");
  clearStorage();
  if (redirectOnLogin) {
    sessionStorage.setItem("redirectOnLogin", redirectOnLogin);
  }
  window.location.href = "../login/";
}

init();
