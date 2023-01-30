async function clearStorage() {
  await localforage.removeItem("events");
  await localforage.removeItem("eventsByFollowedUsers");
  await localforage.removeItem("followedUsers");
  localStorage.removeItem("lastEventSelected");
  localStorage.removeItem("country");
  localStorage.removeItem("refreshToken");
  sessionStorage.removeItem("accessToken");
}

function onSubmit(e) {
  e.preventDefault();
  const spinner = document.querySelector("#progressbar");
  const submitButton = document.querySelector("#formsubmit");
  const alert = document.querySelector("#alert");
  const username = e.target.username.value.trim().toLowerCase();
  const password = e.target.password.value.trim();
  const usernameEl = document.querySelector("#username");
  const passwordEl = document.querySelector("#password");
  const usernameError = document.querySelector(".username.invalid-feedback");
  const passwordError = document.querySelector(".password.invalid-feedback");
  const endpoint = `${getApiHost()}/login`;
  const controller = new AbortController();
  const signal = controller.signal;
  let state = "before"; // before | during | after | aborted

  document
    .querySelectorAll(".is-invalid")
    .forEach((item) => item.classList.remove("is-invalid"));

  if (!username.length) {
    usernameError.innerHTML = "Please input your username.";
    usernameEl.classList.add("is-invalid");
    usernameEl.scrollIntoView({ behavior: "smooth" });
    return;
  }

  if (!password.length) {
    passwordError.innerHTML = "Please input your password.";
    passwordEl.classList.add("is-invalid");
    passwordEl.scrollIntoView({ behavior: "smooth" });
    return;
  }

  state = "during";
  show(spinner);
  hide(submitButton);
  hide(alert);

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      username: username,
      password: password,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    signal: signal,
  })
    .then((res) => res.json())
    .then(async (data) => {
      switch (data.msg) {
        case "invalid login":
          const phrase = getPhrase("invalid login");
          const headline = getPhrase("invalid login headline");
          state = "before";
          hide(spinner);
          show(submitButton);
          showAlert(alert, phrase, headline);
          break;
        case "user authenticated":
          state = "after";
          localStorage.setItem("datakey", data.datakey);
          localStorage.setItem("refreshToken", data.refreshToken);
          sessionStorage.setItem("accessToken", data.accessToken);
          const countriesPromise = getCountries(getLang());
          const churchesPromise = getChurches();
          await Promise.all([countriesPromise, churchesPromise]);
          window.location.href = "../";
          break;
        default:
          state = "before";
          const glitchMessage = getPhrase("glitchMessage");
          hide(spinner);
          show(submitButton);
          showAlert(alert, glitchMessage);
          break;
      }
    })
    .catch((err) => {
      state = "before";
      console.error(err);
      hide(spinner);
      show(submitButton);
    });

  setTimeout(() => {
    controller.abort();
    const alertMessage = getPhrase("timedout");
    hide(spinner);
    show(submitButton);
    if (state === "during") {
      showAlert(alert, alertMessage);
      state = "aborted";
    }
  }, 30000);
}

function attachListeners() {
  document.querySelector("#formlogin").addEventListener("submit", onSubmit);
}

async function init() {
  clearStorage();
  await populateContent();
  attachListeners();
  globalHidePageSpinner();
}

init();
