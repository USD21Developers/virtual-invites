function showChurch() {
  return new Promise(async (resolve, reject) => {
    const churchNameEl = document.querySelector("#churchName");
    const churchIdParam = Number(window.location.search.split("=")[1]);
    const churches = await getChurches();
    const church = churches.find((item) => item.id === churchIdParam);

    if (!church) {
      return reject(new Error("unable to find church"));
    }

    churchNameEl.innerHTML = church.name;

    return resolve(church.name);
  });
}

async function init() {
  await populateContent();
  syncChurches();
  await showChurch();
  globalHidePageSpinner();
}

init();
