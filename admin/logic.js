async function populatePhotosPendingReview() {
  const reviewLinkEl = document.querySelector("#photoReviewLink");
  const quantityPhotoReviewEl = document.querySelector("#quantityPhotoReview");
  const endpoint = `${getApiHost()}/photos-pending-review`;
  const accessToken = await getAccessToken();

  fetch(endpoint, {
    mode: "cors",
    method: "post",
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      const { photos } = data;

      if (!photos) return;
      if (!Array.isArray(photos)) return;

      if (photos.length > 0) {
        quantityPhotoReviewEl.classList.add("badge-danger", "border-danger");
        quantityPhotoReviewEl.innerHTML = photos.length;
        if (reviewLinkEl) reviewLinkEl.classList.remove("d-none");
      }
    })
    .catch((error) => {
      console.error(error);
    });
}

function populateDeletedChurches() {
  const deletedChurchesLinkEl = document.querySelector("#deletedChurchesLink");
  const churchesJSON = localStorage.getItem("churches");

  if (!churchesJSON) return;

  const churches = JSON.parse(churchesJSON);

  const deletedChurches = churches.filter((item) => item.isDeleted === 1);

  if (!deletedChurches.length) return;

  document.querySelector("#quantityDeletedChurches").innerHTML =
    deletedChurches.length;

  deletedChurchesLinkEl.classList.remove("d-none");
}

function redirectIfUnauthorized() {
  if (getUserType() !== "sysadmin") {
    window.location.href = "/logout/";
  }
}

function attachListeners() {}

async function init() {
  await populateContent();
  redirectIfUnauthorized();
  populatePhotosPendingReview();
  populateDeletedChurches();
  attachListeners();
  globalHidePageSpinner();
}

init();
