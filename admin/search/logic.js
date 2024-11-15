function populateSearchTerm() {
  const searchTermEl = document.querySelector("#searchTerm");
  const churchNameEl = document.querySelector("#churchName");
  const params = new URLSearchParams(document.location.search);
  const churchid = params.get("churchid");
  const firstname = params.get("firstname");
  const lastname = params.get("lastname");

  let searchTerm = "";
  let churchName = "";

  if (firstname.length && lastname.length) {
    searchTerm = `${firstname} ${lastname}`;
  } else if (firstname.length) {
    searchTerm = `${firstname}`;
  } else if (lastname.length) {
    searchTerm = `${lastname}`;
  }

  searchTermEl.innerHTML = searchTerm;

  const churchesJSON = localStorage.getItem("churches");
  if (churchesJSON) {
    const churches = JSON.parse(churchesJSON);
    const church = churches.find((item) => item.id === churchid);
    if (church) {
      churchNameEl.innerHTML = church.name;
    } else {
      churchNameEl.classList.add("d-none");
    }
  } else {
    churchNameEl.classList.add("d-none");
  }
}

async function init() {
  await populateContent();
  populateSearchTerm();
  globalHidePageSpinner();
}

init();
