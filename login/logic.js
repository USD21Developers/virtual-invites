
function onSubmit(e) {
  e.preventDefault();
  const username = e.target.username.value.trim().toLowerCase();
  const password = e.target.password.value.trim();

  console.log(password);
}

function attachListeners() {
  document.querySelector("#formlogin").addEventListener("submit", onSubmit);
}

function init() {
  attachListeners();
}

init();