
function onSubmit(e) {
  e.preventDefault();
  console.log("onSubmit");
  const username = e.target.username.value.trim().toLowerCase();
  const password = e.target.password.value.trim();
  const usernameEl = document.querySelector("#username");
  const passwordEl = document.querySelector("#password");
  const usernameError = document.querySelector(".username.invalid-feedback");
  const passwordError = document.querySelector(".password.invalid-feedback");
  const endpoint = `${getApiHost()}/login`

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

  showSpinner(true);
  showAlert(false);

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      username: username,
      password: password
    }),
    headers: new Headers({
      "Content-Type": "application/json"
    })
  })
    .then(res => res.json())
    .then(data => {
      switch (data.msg) {
        case "invalid login":
          showSpinner(false);
          showAlert(true, data.msg);
          break;
      }
      // TODO
      console.log(data);
    })
    .catch(err => {
      console.error(err);
      showSpinner(false);
    });
}

function showAlert(show = true, content = "") {
  const alert = document.querySelector("#alert");
  const contentEl = alert.querySelector("#alert .alert");
  const alertOffset = alert.offsetTop - 64;

  contentEl.innerHTML = content;
  if (!show) {
    alert.classList.add("d-none");
  } else {
    alert.classList.remove("d-none");
    window.scroll({ top: alertOffset, behavior: "smooth" });
  }
}

function showSpinner(show = true) {
  const submitButton = document.querySelector("#formsubmit");
  const progressBar = document.querySelector("#progressbar");

  if (show) {
    submitButton.classList.add("d-none");
    progressBar.classList.remove("d-none");
  } else {
    submitButton.classList.remove("d-none");
    progressBar.classList.add("d-none");
  }
}

function attachListeners() {
  document.querySelector("#formlogin").addEventListener("submit", onSubmit);
}

async function init() {
  await populateContent();
  attachListeners();
}

init();