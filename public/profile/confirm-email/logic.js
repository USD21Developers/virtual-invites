async function checkConfirmationToken() {
  const token = getHash().split("/")[1];
  const endpoint = `${getApiHost()}/profile-email-confirm`;
  const accessToken = await getAccessToken();

  document.title = getPhrase("verifyingHeadline");

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      token: token,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
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
          document.title = getPhrase("confirmationFailedHeadline");
          notrecognized.classList.remove("d-none");
          break;
        case "token is invalid":
          document.title = getPhrase("confirmationFailedHeadline");
          notrecognized.classList.remove("d-none");
          break;
        case "token not found":
          document.title = getPhrase("confirmationFailedHeadline");
          notrecognized.classList.remove("d-none");
          break;
        case "token already claimed":
          confirmed.classList.remove("d-none");
          document.title = getPhrase("emailConfirmedHeadline");
          break;
        case "token expired":
          document.title = getPhrase("confirmationFailedHeadline");
          expired.classList.remove("d-none");
          break;
        case "user not found":
          document.title = getPhrase("confirmationFailedHeadline");
          notrecognized.classList.remove("d-none");
          break;
        case "email confirmed":
          if (data.refreshToken) {
            localStorage.setItem("refreshToken", data.refreshToken);
          }

          if (data.accessToken) {
            sessionStorage.setItem("accessToken", data.accessToken);
          }

          confirmed.classList.remove("d-none");

          document.title = getPhrase("emailConfirmedHeadline");
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

async function init() {
  await populateContent();
  checkConfirmationToken();
  globalHidePageSpinner();
}

init();
