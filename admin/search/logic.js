function populateSearchTerm() {
  const el = document.querySelector("#searchTerm");
  const params = new URLSearchParams(document.location.search);
  const churchid = params.get("churchid");
  const firstname = params.get("firstname");
  const lastname = params.get("lastname");

  let searchTerm = "";

  if (firstname.length && lastname.length) {
    searchTerm = `${firstname} ${lastname}`;
  } else if (firstname.length) {
    searchTerm = `${firstname}`;
  } else if (lastname.length) {
    searchTerm = `${lastname}`;
  }

  el.innerHTML = searchTerm;
}

async function init() {
  await populateContent();
  populateSearchTerm();
  globalHidePageSpinner();
}

init();
