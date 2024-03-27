let churches = [];

let countries = [];

function openPhotoUploadModal(e) {
  e.preventDefault();
}



function showProfilePhoto() {
  const refreshToken = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  );
  const { firstname, lastname, profilephoto } = refreshToken;
  const profilePhoto400 = profilephoto;
  const profilePhoto140 = profilePhoto400.replaceAll("400.jpg", "140.jpg");
  const profilePhotoEl = document.querySelector("#profilePhoto");
  const altText = getPhrase("profilePhoto")
    .replaceAll("{FIRST-NAME}", firstname)
    .replaceAll("{LAST-NAME}", lastname);

  const img = document.createElement("img");
  img.setAttribute("src", profilePhoto400);
  img.setAttribute("width", 140);
  img.setAttribute("height", 140);
  img.setAttribute("alt", altText);
  img.setAttribute("title", altText);

  profilePhotoEl.appendChild(img);
}

function attachListeners() {
  document
    .querySelector("#profilePhoto")
    .addEventListener("click", openPhotoUploadModal);

  document
    .querySelector("#cameraIcon")
    .addEventListener("click", openPhotoUploadModal);
}

async function init() {
  await populateContent();
  showProfilePhoto();
  attachListeners();
  globalHidePageSpinner();
}

/*
  TO DO:
  1.  Populate churches field from localStorage (sorted by country)
  2.  Sync churches with API asynchronously, with a callback that repopulates churches field again
  3.  Populate form fields
  4.  Enable changing profile photo
  5.  Create API to save changes
*/

init();
