
function onSubmit(e) {
  e.preventDefault();
  const username = e.target.username.value.trim().toLowerCase();
  const password = e.target.password.value.trim();
  const usernameEl = document.querySelector("#username");
  const passwordEl = document.querySelector("#password");
  const usernameError = document.querySelector(".username.invalid-feedback");
  const passwordError = document.querySelector(".password.invalid-feedback");

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
}

function attachListeners() {
  document.querySelector("#formlogin").addEventListener("submit", onSubmit);
}

function init() {
  attachListeners();
}

init();