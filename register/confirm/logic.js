function checkConfirmationToken() {
  const hash =
    document.location.hash.substring(1, document.location.hash.length) || "";
  const endpoint = `${getApiHost()}/register-confirm`;
  const preAuthToken = localStorage.getItem("preAuthToken") || null;

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      token: hash,
      preAuthToken: preAuthToken,
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
          if (preAuthToken) localStorage.removeItem("preAuthToken");
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
  localStorage.removeItem("preAuthToken");
  sessionStorage.setItem("justRegistered", true);
}

async function init() {
  await populateContent();
  checkConfirmationToken();
  globalHidePageSpinner();
}

init();
