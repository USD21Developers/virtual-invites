
function onSubmit(e) {
  e.preventDefault();
  console.log("onSubmit");
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

  document.querySelectorAll(".is-invalid").forEach(item => item.classList.remove("is-invalid"));

  if (!username.length) {
    usernameError.innerHTML = "Please input your username.";
    usernameEl.classList.add("is-invalid");
    usernameEl.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  if (!password.length) {
    passwordError.innerHTML = "Please input your password.";
    passwordEl.classList.add("is-invalid");
    passwordEl.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  show(spinner);
  hide(submitButton);
  hide(alert);

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      username: username,
      password: password
    }),
    headers: new Headers({
      "Content-Type": "application/json"
    }),
    signal: signal
  })
    .then(res => res.json())
    .then(data => {
      switch (data.msg) {
        case "invalid login":
          hide(spinner);
          show(submitButton);
          showAlert(alert, data.msg);
          break;
        case "user authenticated":
          localStorage.setItem("datakey", data.datakey);
          localStorage.setItem("refreshToken", data.refreshToken);
          sessionStorage.setItem("accessToken", data.accessToken);
          window.location.href = "../";
          break;
        default:
          const glitchMessage = getPhrase("glitchMessage");
          hide(spinner);
          show(submitButton);
          showAlert(alert, glitchMessage);
          break;
      }
    })
    .catch(err => {
      console.error(err);
      hide(spinner);
      show(submitButton);
    });

  setTimeout(() => {
    controller.abort();
    const alertMessage = getPhrase("timedout");
    hide(spinner);
    show(submitButton);
    showAlert(alert, alertMessage);
  }, 30000);
}

function attachListeners() {
  document.querySelector("#formlogin").addEventListener("submit", onSubmit);
}

async function init() {
  await populateContent();
  attachListeners();
}

init();