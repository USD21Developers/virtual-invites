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
      debugger;
    })
    .catch((error) => {
      console.error(error);
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
}

async function init() {
  await populateContent();
  personalizeContent();
  attachListeners();
  globalHidePageSpinner();
}

init();
