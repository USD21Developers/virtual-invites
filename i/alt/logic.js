function onSearch(e) {
  e.preventDefault();
}

function attachListeners() {
  document
    .querySelector("#formEventSearch")
    .addEventListener("submit", onSearch);
}

async function init() {
  attachListeners();
  await populateContent();
}

init();
