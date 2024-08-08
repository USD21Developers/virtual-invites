async function personalizeContent() {
  const jwt = localStorage.getItem("userToken");

  if (!jwt) {
    sessionStorage.setItem("redirectOnLogin", "/authorize/me/");
    return (window.location.href = "/logout/");
  }

  const userToken = JSON.parse(atob(jwt.split(".")[1]));

  const { firstname, churchid, isAuthorized } = userToken;

  if (isAuthorized) {
    return (window.location.href = "/");
  }

  const paragraph1El = document.querySelector("#paragraph1");
  const paragraph1Text = getPhrase("paragraph1").replaceAll(
    "{FIRST-NAME}",
    firstname
  );
  paragraph1El.innerHTML = paragraph1Text;
}

async function populateAuthorizingUsersModal(users) {
  const el = document.querySelector("#authorizingUsersModal .modal-body");
  const explanation = document.createElement("p");
  const churches = await getChurches();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  el.innerHTML = "";

  if (users.length === 1) {
    explanation.innerHTML = getPhrase("authorizingUser");
  } else {
    explanation.innerHTML = getPhrase("authorizingUsers");
  }

  el.appendChild(explanation);

  const ul = document.createElement("ul");
  ul.classList.add("list-group");
  ul.classList.add("mt-4");

  users.forEach((item) => {
    const { churchid, createdAt, firstname, lastname, profilephoto, userid } =
      item;
    const profilePhotoSmall = profilephoto.replaceAll("400", "140");
    const church = churches.find((item) => item.id === churchid);
    const country = church.country;
    const lang = getLang();
    const locale = `${lang}-${country}`;
    const registrationDate = Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: timeZone,
    }).format(new Date(createdAt));

    const registeredOnDate = getPhrase("registeredOn").replaceAll(
      "{REGISTRATION-DATE}",
      registrationDate
    );
    const li = document.createElement("li");
    li.classList.add("list-group-item");
    li.innerHTML = `
      <div class="media">
        <img class="mr-3" width="70" height="70" src="${profilePhotoSmall}" alt="${firstname} ${lastname}">
        <div class="media-body">
          <h3 class="mt-0">${firstname} ${lastname}</h3>
          <div>${registeredOnDate}</div>
        </div>
      </div>
    `;
    ul.appendChild(li);
  });

  el.appendChild(ul);
}

async function showQrCode(qrCodeUrl, userToken) {
  return new Promise(async (resolve, reject) => {
    $("#qrCodeModal").modal();

    $("#qrCodeModal").on("shown.bs.modal", (e) => {
      const availableWidth = document.querySelector("#qrcode").clientWidth;
      const maxWidth = 200;
      const width = availableWidth > maxWidth ? maxWidth : availableWidth;

      const qr = new QRious({
        element: document.getElementById("qr"),
        value: qrCodeUrl,
        size: width,
      });

      const { firstname, lastname } = userToken;

      const modalTitleEl = document.querySelector("#modaltitle");
      const headlineText = getPhrase("modalHeadline")
        .replaceAll("{FIRST-NAME}", firstname)
        .replaceAll("{LAST-NAME}", lastname);
      modalTitleEl.innerHTML = headlineText;

      const qrCodeInstructionsEl = document.querySelector(
        "#qrCodeInstructions"
      );
      const instructionsText = getPhrase("modalInstructions")
        .replaceAll("{FIRST-NAME}", firstname)
        .replaceAll("{LAST-NAME}", lastname);
      qrCodeInstructionsEl.innerHTML = instructionsText;

      return resolve(qr);
    });
  });
}

async function onAuthorizersClick(e) {
  e.preventDefault();

  const jwt = localStorage.getItem("userToken");

  if (!jwt) {
    sessionStorage.setItem("redirectOnLogin", "/authorize/me/");
    window.location.href = "/logout/";
  }

  const endpoint = `${getApiHost()}/authorizing-users`;

  $("#authorizingUsersModal").modal();

  fetch(endpoint, {
    mode: "cors",
    method: "post",
    body: JSON.stringify({
      userToken: jwt,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      switch (data.msg) {
        case "no authorizing users found":
          $("#authorizingUsersModal").modal("hide");
          showToast(
            getPhrase("noAuthorizingUsersFound"),
            5000,
            "danger",
            ".snackbar",
            true
          );
          $("#authorizingUsersModal").modal("hide");
          break;
        case "authorizing users retrieved":
          populateAuthorizingUsersModal(data.users);
          break;
        default:
          $("#authorizingUsersModal").modal("hide");
          break;
      }
    })
    .catch((error) => {
      console.error(error);
      $("#authorizingUsersModal").modal("hide");
    });
}

function onShowQrCodeClick() {
  const jwt = localStorage.getItem("userToken") || null;

  if (!jwt) {
    return (location.href = "/logout/");
  }

  const userToken = JSON.parse(atob(jwt.split(".")[1]));
  const userid = userToken.userid;
  const url = `${window.location.origin}/authorize/user/#/${userid}`;

  showQrCode(url, userToken);
  // TODO:  create actual front end route for above url
  // TODO:  start polling the API to check for (A) authorizing user clicked on URL from QR Code, and (B) approval granted
  // TODO:  create a UX for when approval has been granted
}

function attachListeners() {
  document
    .querySelector("#btnShowQRCode")
    .addEventListener("click", onShowQrCodeClick);

  document
    .querySelector("a[href='#authorizers']")
    .addEventListener("click", onAuthorizersClick);

  /* $("#authorizingUsersModal").on("show.bs.modal", (e) => {
    
  }); */
}

async function init() {
  await populateContent();
  personalizeContent();
  attachListeners();
  globalHidePageSpinner();
}

init();
