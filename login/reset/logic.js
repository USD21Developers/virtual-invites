async function onSubmit(e) {
  e.preventDefault();
  formErrorsReset();
  const hash =
    document.location.hash.substring(1, document.location.hash.length) || "";
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
  const dataKey = await crypto.generateKey();
  const exportedDataKey = await crypto.exportCryptoKey(dataKey);
  const serializedDataKey = crypto.serialize(exportedDataKey);
  const controller = new AbortController();
  const signal = controller.signal;

  if (!newPassword.length) {
    formError("#newpassword", passwordrequired);
  }

  hide(submitButton);
  show(progressBar);

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      dataKey: serializedDataKey,
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
      switch (data.msg) {
        case "unable to query for token":
          break;
        case "token not found":
          break;
        case "token is expired":
          break;
        case "password is missing":
          break;
        case "new password lacks sufficient complexity":
          formError("#newpassword", passwordNotComplexEnough);
          const modalMessage = `
            <p>${passwordNotComplexEnoughLine1}</p>
            <p>${passwordNotComplexEnoughLine2}</p>
          `;
          showModal(modalMessage, invalidpassword);
          break;
        case "unable to generate password hash":
          break;
        case "unable to store hashed password":
          break;
        case "unable to designate token as claimed":
          break;
        case "password updated":
          break;
      }
    })
    .catch((err) => {
      console.error(err);
      hide(progressBar);
      show(submitButton);
    });

  setTimeout(() => {
    controller.abort();
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
}

init();
