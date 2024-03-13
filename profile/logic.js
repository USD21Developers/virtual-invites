function openPhotoUploadModal() {
  console.log("Open modal");
}

function showProfilePhoto() {
  const refreshToken = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  );
  const { firstname, lastname, profilephoto } = refreshToken;
  const profilePhoto140 = profilephoto.replaceAll("400.jpg", "140.jpg");
  const profilePhotoEl = document.querySelector("#profilePhoto");
  const altText = getPhrase("profilePhoto")
    .replaceAll("{FIRST-NAME}", firstname)
    .replaceAll("{LAST-NAME}", lastname);

  const img = document.createElement("img");
  img.setAttribute("src", profilePhoto140);
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

init();
