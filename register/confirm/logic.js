function checkConfirmationToken() {
  const hashParts = document.location.hash.split("/");

  hashParts.shift();

  const churchid = Number(hashParts[0]);
  const authorizedBy = Number(hashParts[1]);
  const preAuthCode = Number(hashParts[2]);
  const token = hashParts[3];

  const endpoint = `${getApiHost()}/register-confirm`;
  let preAuth = localStorage.getItem("preAuth") || null;

  if (!preAuth) {
    let resetPreAuth = true;
    if (isNaN(churchid)) resetPreAuth = false;
    if (isNaN(authorizedBy)) resetPreAuth = false;
    if (isNaN(preAuthCode)) resetPreAuth = false;
    if (resetPreAuth) {
      preAuth = {
        churchid: churchid,
        authorizedby: authorizedBy,
        authcode: preAuthCode,
      };
    }
  }

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      token: token,
      preAuth: preAuth,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      const notrecognized = document.querySelector("#notrecognized");
      const expired = document.querySelector("#expired");
      const glitch = document.querySelector("#glitch");
      const confirmed = document.querySelector("#confirmed");

      hideContentContainers();

      switch (data.msg) {
        case "token is missing":
          notrecognized.classList.remove("d-none");
          break;
        case "token is invalid":
          notrecognized.classList.remove("d-none");
          break;
        case "token not found":
          notrecognized.classList.remove("d-none");
          break;
        case "token already claimed":
          confirmed.classList.remove("d-none");
          onConfirmed(refreshToken, accessToken);
          break;
        case "token expired":
          expired.classList.remove("d-none");
          break;
        case "user not found":
          notrecognized.classList.remove("d-none");
          break;
        case "registration confirmed":
          if (preAuth) localStorage.removeItem("preAuth");
          confirmed.classList.remove("d-none");
          onConfirmed();
          break;
        default:
          glitch.classList.remove("d-none");
      }
    })
    .catch((err) => {
      console.error(err);
    });
}

function hideContentContainers() {
  document.querySelectorAll(".contentcontainer").forEach((item) => {
    item.classList.add("d-none");
  });
}

function onConfirmed() {
  document.cookie =
    "preAuthArray=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  localStorage.removeItem("preAuth");
  sessionStorage.setItem("justRegistered", true);
}

async function init() {
  await populateContent();
  checkConfirmationToken();
  globalHidePageSpinner();
}

init();
