function enableTooltips() {
  $('[data-toggle="tooltip"]').tooltip();
}

function getApiHost() {
  let host;

  switch (window.location.hostname) {
    case "localhost":
      host = `http://${window.location.hostname}:4000/invites`;
      break;
    case "staging.invites.usd21.org":
      host = "https://api.usd21.org/invites/staging/api";
      break;
    case "invites.usd21.org":
      host = "https://api.usd21.org/invites/api";
      break;
  }

  return host;
}

function getLang() {
  const path = window.location.pathname.split("/");
  const langFromPath = path.find(frag => frag === "lang") ? path[2] : "en";
  return langFromPath;
}

function isMobileDevice() {
  const result = (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
  return result;
};

function showMaterialIcons() {
  document.querySelectorAll(".material-icons").forEach(item => item.style.opacity = "1");
}

function showToast(message, duration = 5000) {
  const snackbar = document.querySelector(".snackbar");
  const body = document.querySelector(".snackbar-body");

  body.innerHTML = message;
  snackbar.classList.add("show");
  setTimeout(() => {
    snackbar.classList.remove("show");
  }, duration);
}

function init() {
  showMaterialIcons();
}

init();