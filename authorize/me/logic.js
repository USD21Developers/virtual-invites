async function personalizeContent() {
  let jwt = localStorage.getItem("userToken");

  jwt = sessionStorage.getItem("accessToken"); // DELETE THIS LATER!

  if (!jwt) {
    sessionStorage.setItem("redirectOnLogin", "/authorize/me/");
    return (window.location.href = "/logout/");
  }

  const userToken = JSON.parse(atob(jwt.split(".")[1]));

  userToken.firstname = "Jason";
  userToken.churchid = 7;
  userToken.isAuthorized = false;

  const { firstname, userid, churchid, isAuthorized } = userToken;

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

  const instructions3El = document.querySelector("#instructions3");
  const instructions3Text = getPhrase("instructions3").replaceAll(
    "{CHURCH-NAME}",
    church.name
  );
  instructions3El.innerHTML = instructions3Text;
}

function onShowQrCodeClick() {
  console.log("Button clicked");

  // TODO:  generate QR code, pointing to "/authorize/user/#/{USER-ID}"
  // TODO:  create actual front end route above
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
