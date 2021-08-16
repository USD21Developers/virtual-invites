
function onSubmit(e) {
  e.preventDefault();
}

function attachListeners() {
  document.querySelector("#formlogin").addEventListener("submit", onSubmit);
}

async function init() {
  await populateContent();
  attachListeners();
}

init();