function populatePhotosPendingReview() {
  return new Promise(async (resolve, reject) => {
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

        if (!photos) return resolve([]);
        if (!Array.isArray(photos))
          return reject(new Error("photos must be an array of objects"));

        if (photos.length === 0) {
          reviewLinkEl.classList.add("d-none");
          return resolve([]);
        }

        renderPhotos(photos);

        return resolve(photos);
      })
      .catch((error) => {
        console.error(error);
      });
  });
}

function renderPhotos(photos) {
  const photosEl = document.querySelector("#photos");

  photos.forEach((item) => {
    const {
      createdAt,
      firstname,
      gender,
      lastname,
      profilephoto,
      updatedAt,
      userid,
      userstatus,
      usertype,
    } = item;
    const profilePhoto140 = profilephoto.replaceAll("__400.jpg", "__140.jpg");
    const photoNode = document.createElement("div");
    photoNode.setAttribute("class", "col text-center");
    photoNode.innerHTML = `
      <a href="#" class="thumbnail" data-userid="${userid}">
        <img src="${profilePhoto140}" width="70" height="70" alt="${firstname} ${lastname}" />
        <br><small>${firstname} ${lastname}</small>
      </a>
    `;

    photosEl.appendChild(photoNode);
  });
}

function onThumbClicked(e) {
  e.preventDefault();
}

function attachListeners() {
  document.querySelectorAll(".thumbnail").forEach((item) => {
    item.addEventListener("click", onThumbClicked);
  });
}

async function init() {
  await populateContent();
  await populatePhotosPendingReview();
  attachListeners();
  globalHidePageSpinner();
}

init();
