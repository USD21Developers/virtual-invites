
function onSubmit(e) {
  e.preventDefault();
}

function attachListeners() {
  document.querySelector("#formlogin").addEventListener("submit", onSubmit);
}

function init() {
  attachListeners();
}

init();