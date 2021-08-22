function checkConfirmationToken() {
  const hash = document.location.hash.substring(1, document.location.hash.length) || "";
  const endpoint = `${getApiHost()}/invites/register-confirm`;

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      token: hash,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
    })
  })
    .then(res => res.json())
    .then(data => {
      const { accessToken = "", refreshToken = "" } = data;
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
          confirmed.classList.remove("d-none");
          onConfirmed(refreshToken, accessToken);
          break;
        default:
          glitch.classList.remove("d-none");
      }
    })
    .catch(err => {
      console.error(err);
    });
}

function hideContentContainers() {
  document.querySelectorAll(".contentcontainer").forEach(item => {
    item.classList.add("d-none");
  });
}

function onConfirmed(refreshToken, accessToken) {
  localStorage.setItem("refreshToken", refreshToken);
  sessionStorage.setItem("accessToken", accessToken);
  sessionStorage.setItem("justRegistered", true);
}

async function init() {
  await populateContent();
  checkConfirmationToken();
}

init();
