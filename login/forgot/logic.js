function onSubmit(e) {
  e.preventDefault();
  const email = e.target.email.value.trim().toLowerCase();
  const mainheadline = document.querySelector("#mainheadline");
  const alert = document.querySelector("#alert");
  const form = document.querySelector("#formforgot");
  const done = document.querySelector("#contentdone");
  const submitButton = document.querySelector("#formsubmit");
  const progressBar = document.querySelector("#progressbar");
  const emailError = getPhrase("emailError");
  const emailErrorHeadline = getPhrase("emailErrorHeadline");
  const emailSenderText = getPhrase("emailSenderText");
  const emailSubject = getPhrase("emailSubject");
  const emailParagraph1 = getPhrase("emailParagraph1");
  const emailParagraph2 = getPhrase("emailParagraph2");
  const emailParagraph3 = getPhrase("emailParagraph3");
  const emailNotFound = getPhrase("emailNotFound");
  const emailNotFoundHeadline = getPhrase("emailNotFoundHeadline");
  const hereIsYourUsername = getPhrase("hereIsYourUsername");
  const glitch = getPhrase("glitch");
  const glitchHeadline = getPhrase("glitchHeadline");
  const endpoint = `${getApiHost()}/forgot-password`;
  const controller = new AbortController();
  const signal = controller.signal;
  let state = "before"; // before | during | after | aborted

  hide(alert);

  if (!validateEmail(email)) {
    return showAlert(alert, emailError, emailErrorHeadline);
  }

  state = "during";
  hide(submitButton);
  show(progressBar);

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      email: email,
      emailSenderText: emailSenderText,
      emailSubject: emailSubject,
      emailParagraph1: emailParagraph1,
      emailParagraph2: emailParagraph2,
      emailParagraph3: emailParagraph3,
      hereIsYourUsername: hereIsYourUsername,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    signal: signal,
  })
    .then((res) => res.json())
    .then((data) => {
      switch (data.msg) {
        case "invalid e-mail format":
          state = "before";
          hide(progressBar);
          show(submitButton);
          showAlert(alert, emailError, emailErrorHeadline);
          break;
        case "user not found":
          state = "before";
          hide(progressBar);
          show(submitButton);
          showAlert(alert, emailNotFound, emailNotFoundHeadline);
          break;
        case "password reset e-mail sent":
          state = "after";
          hide(mainheadline);
          hide(form);
          show(done);
          break;
        default:
          state = "before";
          hide(progressBar);
          show(submitButton);
          showAlert(alert, glitch, glitchHeadline);
          break;
      }
    })
    .catch((err) => {
      state = "before";
      console.error(err);
      hide(progressBar);
      show(submitButton);
      showAlert(alert, glitch, glitchHeadline);
    });

  setTimeout(() => {
    controller.abort(`Timeout reached (30 seconds)`);
    if (state === "during") {
      state = "aborted";
      hide(progressBar);
      show(submitButton);
      showAlert(alert, glitch, glitchHeadline);
    }
  }, 30000);
}

function attachListeners() {
  document.querySelector("#formforgot").addEventListener("submit", onSubmit);
}

async function init() {
  await populateContent();
  attachListeners();
  globalHidePageSpinner();
}

init();
