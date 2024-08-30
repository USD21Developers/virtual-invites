const fetches = [];
let intervalId;

function abortFetches() {
  clearInterval(intervalId);
  if (!fetches.length) return;

  fetches.forEach((controller) => {
    controller.abort();
  });
}

function checkForUserToken() {
  const userToken = localStorage.getItem("userToken");

  if (!userToken) {
    window.location.href = "/logout/";
  }
}

function checkIfAuthorized(didSomeoneScanEl, progressMeterEl, stillWaitingEl) {
  return new Promise(async (resolve, reject) => {
    const controller = new AbortController();
    const endpoint = `${getApiHost()}/am-i-authorized`;
    const userToken = localStorage.getItem("userToken");

    fetches.push(controller);

    fetch(endpoint, {
      mode: "cors",
      method: "post",
      body: JSON.stringify({
        userToken: userToken,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
      }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        switch (data.msg) {
          case "authorization status verified":
            break;
          case "unable to check if user is authorized":
            return resolve("not authorized");
          case "user not found":
            return resolve("not authorized");
        }

        switch (data.result) {
          case "authorized":
            if (data.refreshToken) {
              localStorage.setItem("refreshToken", data.refreshToken);
            }
            if (data.accessToken) {
              sessionStorage.setItem("accessToken", data.accessToken);
            }
            return resolve("authorized");
          default:
            return resolve("not authorized");
        }
      })
      .catch((error) => {
        console.error(error);
        abortFetches();
        return resolve("not authorized");
      });

    setTimeout(() => {
      didSomeoneScanEl.classList.add("d-none");
      progressMeterEl.classList.add("d-none");
      stillWaitingEl.classList.remove("d-none");
      abortFetches();
      return resolve("not authorized");
    }, 30000);
  });
}

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
    explanation.innerHTML = getPhrase("explanationAuthorizingUser");
  } else {
    explanation.innerHTML = getPhrase("explanationAuthorizingUsers");
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
      month: "short",
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
          <div class="small">${registeredOnDate}</div>
        </div>
      </div>
    `;
    ul.appendChild(li);
  });

  el.appendChild(ul);
}

function resetQrCodeContent() {
  const didSomeoneScanEl = document.querySelector("#didSomeoneScan");
  const progressMeterEl = document.querySelector("#progressMeter");
  const stillWaitingEl = document.querySelector("#stillWaiting");

  didSomeoneScanEl.classList.remove("d-none");
  progressMeterEl.classList.add("d-none");
  stillWaitingEl.classList.add("d-none");
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

function onAskSomeoneElse(e) {
  e.preventDefault();

  $("#qrCodeModal").modal("hide");

  onAuthorizersClick(e);
}

function onAuthorized(didSomeoneScanEl, progressMeterEl, stillWaitingEl) {
  didSomeoneScanEl.classList.add("d-none");
  stillWaitingEl.classList.add("d-none");
  progressMeterEl.classList.add("d-none");
  localStorage.removeItem("userToken");
  $("#qrCodeModal").modal("hide");
  $("#authorizationGrantedModal").modal();
}

async function onAuthorizersClick(e) {
  e.preventDefault();

  const jwt = localStorage.getItem("userToken");

  if (!jwt) {
    sessionStorage.setItem("redirectOnLogin", "/authorize/me/");
    window.location.href = "/logout/";
  }

  const endpoint = `${getApiHost()}/authorizing-users`;

  hideToast();
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
          hideToast();
          break;
      }
    })
    .catch((error) => {
      console.error(error);
      $("#authorizingUsersModal").modal("hide");
      hideToast();
    });
}

function onCheckAgain() {
  resetQrCodeContent();
  onQrCodeScanned();
}

function onQrCodeScanned() {
  const didSomeoneScanEl = document.querySelector("#didSomeoneScan");
  const progressMeterEl = document.querySelector("#progressMeter");
  const stillWaitingEl = document.querySelector("#stillWaiting");

  didSomeoneScanEl.classList.add("d-none");
  stillWaitingEl.classList.add("d-none");
  progressMeterEl.classList.remove("d-none");

  intervalId = setInterval(async () => {
    if (!navigator.onLine) {
      resetQrCodeContent();
      showToast(getGlobalPhrase("youAreOffline"), 5000, "danger");
      return abortFetches();
    }

    const result = await checkIfAuthorized(
      didSomeoneScanEl,
      progressMeterEl,
      stillWaitingEl
    );
    switch (result) {
      case "authorized":
        console.log("Authorization granted!");
        abortFetches();
        onAuthorized(didSomeoneScanEl, progressMeterEl, stillWaitingEl);
        break;
      default:
        console.log("Waiting for authorization...");
    }
  }, 2000);

  setTimeout(() => {
    console.error("Authorization timed out");
    abortFetches();
    didSomeoneScanEl.classList.add("d-none");
    stillWaitingEl.classList.remove("d-none");
    progressMeterEl.classList.add("d-none");
  }, 60000);
}

function onShowQrCodeClick() {
  const jwt = localStorage.getItem("userToken") || null;

  if (!jwt) {
    return (location.href = "/logout/");
  }

  let origin = window.location.origin;

  if (window.location.hostname === "localhost") {
    origin = origin.replaceAll("localhost", "192.168.0.85");
  }

  const userToken = JSON.parse(atob(jwt.split(".")[1]));
  const userid = userToken.userid;
  const url = `${origin}/authorize/user/#/${userid}`;

  showQrCode(url, userToken);
}

function attachListeners() {
  document
    .querySelector("#btnShowQRCode")
    .addEventListener("click", onShowQrCodeClick);

  document
    .querySelector("a[href='#authorizers']")
    .addEventListener("click", onAuthorizersClick);

  document
    .querySelector("#qrCodeScanned")
    .addEventListener("click", onQrCodeScanned);

  document
    .querySelector("[data-i18n='suggestAskSomeoneElse'] a")
    .addEventListener("click", onAskSomeoneElse);

  document.querySelector("#checkAgain").addEventListener("click", onCheckAgain);

  $("#qrCodeModal").on("show.bs.modal", () => {
    resetQrCodeContent();
  });

  $("#qrCodeModal").on("hide.bs.modal", () => {
    resetQrCodeContent();
  });

  $("#authorizationGrantedModal").on("hide.bs.modal", () => {
    window.location.href = "/";
  });
}

async function init() {
  checkForUserToken();
  await populateContent();
  personalizeContent();
  attachListeners();
  globalHidePageSpinner();
}

init();
