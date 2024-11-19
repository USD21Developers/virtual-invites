async function populatePhotosPendingReview() {
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

      if (photos.length === 0) {
        quantityPhotoReviewEl.classList.remove("badge-danger", "border-danger");
        quantityPhotoReviewEl.classList.add("badge-light", "border-dark");
        quantityPhotoReviewEl.innerHTML = "0";
        return;
      }

      quantityPhotoReviewEl.classList.remove("badge-light", "border-dark");
      quantityPhotoReviewEl.classList.add("badge-danger", "border-danger");
      quantityPhotoReviewEl.innerHTML = photos.length;
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
  const refreshTokenStored = localStorage.getItem("refreshToken");

  const kickOut = () => {
    return (window.location.href = "/logout/");
  };

  if (!refreshTokenStored) {
    kickOut();
  }

  const refreshToken = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  );
  const { canAuthorize, canAuthToAuth } = refreshToken;

  if (!canAuthorize && !canAuthToAuth) {
    kickOut();
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
