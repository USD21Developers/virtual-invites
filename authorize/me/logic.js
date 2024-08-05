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

  const churches = await fetch(`${getApiServicesHost()}/churches`)
    .then((res) => res.json())
    .then((data) => data.churches);

  const church = churches.find((item) => item.id === churchid);
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

function onShowQrCodeClick() {
  console.log("Button clicked");
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
}

async function init() {
  await populateContent();
  personalizeContent();
  attachListeners();
  globalHidePageSpinner();
}

init();
