async function onSubmit(e) {
  e.preventDefault();
  formErrorsReset();
  const hash = getHash() || "";
  const mainHeadline = document.querySelector("#mainheadline");
  const form = document.querySelector("#formResetPassword");
  const done = document.querySelector("#contentdone");
  const alert = document.querySelector("#alert");
  const submitButton = document.querySelector("#formsubmit");
  const progressBar = document.querySelector("#progressbar");
  const passwordrequired = getPhrase("passwordrequired");
  const invalidpassword = getPhrase("invalidpassword");
  const passwordNotComplexEnough = getPhrase("passwordNotComplexEnough");
  const passwordNotComplexEnoughLine1 = getPhrase(
    "passwordNotComplexEnoughLine1"
  );
  const passwordNotComplexEnoughLine2 = getPhrase(
    "passwordNotComplexEnoughLine2"
  );
  const newPassword = e.target.newpassword.value.trim();
  const endpoint = `${getApiHost()}/reset-password`;
  const dataKey = await invitesCrypto.generateKey();
  const controller = new AbortController();
  const signal = controller.signal;

  if (!newPassword.length) {
    return formError("#newpassword", passwordrequired);
  }

  hide(submitButton);
  show(progressBar);

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      dataKey: dataKey,
      newPassword: newPassword,
      token: hash,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    signal: signal,
  })
    .then((res) => res.json())
    .then((data) => {
      hide(progressBar);
      show(submitButton);
      switch (data.msg) {
        case "token not found":
          showAlert(
            alert,
            getPhrase("tokenNotFound"),
            getPhrase("invalidHash")
          );
          hide(form);
          break;
        case "token is expired":
          showAlert(alert, getPhrase("tokenExpired"), getPhrase("invalidHash"));
          hide(form);
          break;
        case "password is missing":
          formError("#newpassword", getPhrase("passwordrequired"));
          break;
        case "new password lacks sufficient complexity":
          formError("#newpassword", passwordNotComplexEnough);
          const modalMessage = `
            <p>${passwordNotComplexEnoughLine1}</p>
            <p>${passwordNotComplexEnoughLine2}</p>
          `;
          showModal(modalMessage, invalidpassword);
          break;
        case "password updated":
          hide(mainHeadline);
          hide(form);
          show(done);
          break;
        default:
          showAlert(alert, getPhrase("glitch"), getPhrase("glitchHeadline"));
          break;
      }
    })
    .catch((err) => {
      console.error(err);
      hide(progressBar);
      show(submitButton);
    });

  setTimeout(() => {
    controller.abort(`Timeout reached (5 seconds)`);
    hide(progressBar);
    show(submitButton);
  }, 5000);
}

function attachListeners() {
  document
    .querySelector("#formResetPassword")
    .addEventListener("submit", onSubmit);
}

async function init() {
  await populateContent();
  attachListeners();
  globalHidePageSpinner();
}

init();
