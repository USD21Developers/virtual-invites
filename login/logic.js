async function forwardAuthenticatedUser() {
  let redirectUrl = null;

  if (sessionStorage.getItem("redirectOnLogin")) {
    const newUrl = sessionStorage.getItem("redirectOnLogin");
    sessionStorage.removeItem("redirectOnLogin");
    if (newUrl && newUrl.length) {
      redirectUrl = newUrl;
    }
  }

  if (sessionStorage.getItem("unsubscribeFromNotifications")) {
    await unsubscribeFromNotifications();
    sessionStorage.removeItem("unsubscribeFromNotifications");
  }

  const isFromHomeScreen = !!sessionStorage.getItem("isFromHomeScreen");
  if (isFromHomeScreen) {
    redirectUrl = "../?utm_source=homescreen";
  }

  sessionStorage.setItem("syncOnLogin", "true");

  if (redirectUrl && redirectUrl.length) {
    return (window.location.href = redirectUrl);
  }

  window.location.href = "../";
}

async function storeMapKeys(refreshToken) {
  if (!refreshToken) return;
  if (typeof refreshToken !== "string") return;
  if (!refreshToken.length) return;

  const parsed = JSON.parse(atob(refreshToken.split(".")[1]));
  const mapsApiKeys = parsed.mapsApiKeys;

  if (!mapsApiKeys) await getMapApiKeys();
  if (typeof mapsApiKeys !== "object") return;

  localStorage.setItem("mapsApiKeys", JSON.stringify(mapsApiKeys));
}

function unsubscribeFromNotifications() {
  return new Promise(async (resolve, reject) => {
    const unsubscribeJSON = sessionStorage.getItem(
      "unsubscribeFromNotifications"
    );
    if (!unsubscribeJSON) return reject();

    const unsubscribe = JSON.parse(unsubscribeJSON);
    const { jwt, unsubscribeFrom } = unsubscribe;

    if (unsubscribeFrom !== "recipient") return reject();

    const payload = jwt.split(".")[1];
    const data = JSON.parse(atob(payload));
    const { invitationid, userid } = data;

    if (userid !== getUserId()) return reject();

    const invites = await localforage.getItem("invites");
    if (!Array.isArray(invites)) return reject();
    if (!invites.length) return reject();

    const invite = invites.find((item) => (item.invitationid = invitationid));
    if (!invite) return reject();

    const { email, sms } = invite.recipient;
    let invitationids = [];

    if (email) {
      invitationids = invites.map((item) => {
        if (item.recipient.email === email) return item.invitationid;
        return;
      });
    } else if (sms) {
      invitationids = invites.map((item) => {
        if (item.recipient.sms === sms) return item.invitationid;
        return;
      });
    }

    const endpoint = `${getApiHost()}/unsubscribe`;

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        jwt: jwt,
        unsubscribeFrom: unsubscribeFrom,
        invitationids: invitationids,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (!data) return reject();
        if (!data.msgType) return reject();
        if (!data.msgType === "success") return reject();
        const promise1 = syncSettings();
        const promise2 = syncInvites();
        Promise.all([promise1, promise2]).then(() => {
          return resolve();
        });
      });
  });
}

function onResendEmail() {
  return new Promise(async (resolve, reject) => {
    const emailDisplayedEl = document.querySelector("#emailDisplayed");
    const waitingTooLongEl = document.querySelector("#waitingTooLong");
    const alternativeEmailEl = document.querySelector("#alternativeEmail");
    const storedToken = localStorage.getItem("pendingConfirmationToken");

    if (!storedToken) {
      return reject("pendingConfirmationToken not found in localStorage");
    }

    const parsedToken = JSON.parse(atob(storedToken.split(".")[1]));

    const {
      createdAt,
      email,
      exp,
      firstname,
      iat,
      lastname,
      updatedAt,
      userid,
      username,
    } = parsedToken;

    const expiresAt = exp * 1000;
    const now = Date.now();

    if (now > expiresAt) {
      localStorage.removeItem("pendingConfirmationToken");
      return reject("pendingConfirmationToken is expired");
    }

    const registrationPageContent = await fetch(
      `../register/i18n/${getLang()}.json`
    ).then((res) => res.json());

    const emailSenderText = getPhrase(
      "emailSenderText",
      registrationPageContent
    );
    const emailSubject = getPhrase("emailSubject", registrationPageContent);
    let emailParagraph1 = getPhrase("emailParagraph1", registrationPageContent);
    const emailLinkText = getPhrase("emailLinkText", registrationPageContent);
    const emailSignature = getPhrase("emailSignature", registrationPageContent);
    const endpoint = `${getApiHost()}/register-resend-confirmation`;

    emailParagraph1 = emailParagraph1.replaceAll(
      "${fullname}",
      `${firstname} ${lastname}`
    );

    alternativeEmailEl.value = "";

    waitingTooLongEl.classList.add("d-none");

    globalShowPageSpinner();

    document
      .querySelectorAll(".modal")
      .forEach((item) => item.classList.add("d-none"));

    fetch(endpoint, {
      mode: "cors",
      method: "post",
      body: JSON.stringify({
        emailSenderText: emailSenderText,
        emailSubject: emailSubject,
        emailParagraph1: emailParagraph1,
        emailLinkText: emailLinkText,
        emailSignature: emailSignature,
        lang: getLang(),
      }),
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${storedToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        localStorage.setItem(
          "pendingConfirmationToken",
          data.pendingConfirmationToken
        );

        const parsedToken = JSON.parse(
          atob(data.pendingConfirmationToken.split(".")[1])
        );

        document.querySelector(".modal-title").innerText = getPhrase(
          "checkyouremailtitle",
          registrationPageContent
        );

        emailDisplayedEl.innerText = parsedToken.email;

        document.querySelector(".modal-title").scrollIntoView();

        document
          .querySelector("#modalAccountUnconfirmed")
          .classList.remove("d-none");

        globalHidePageSpinner();

        setTimeout(() => {
          waitingTooLongEl.classList.remove("d-none");
        }, 15000);

        // TODO:  Validate response

        showToast(
          getPhrase("emailSentAgain"),
          5000,
          "success",
          "#contentdone .snackbar"
        );
      });
  });
}

async function onAlternateEmailUpdated(e) {
  const emailDisplayedEl = document.querySelector("#emailDisplayed");
  const alternativeEmailEl = document.querySelector("#alternativeEmail");
  const alternativeEmail = alternativeEmailEl.value.trim().toLowerCase();

  // TODO:  confirm that "pendingConfirmationToken" exists in localStorage
  // TODO:  validate, to prevent too many form submissions (maybe wait at least 1 minute)
  // TODO:  validate, to prevent previously attempted email addresses from going through
  // TODO:  validate e-mail address
  // TODO:  contact API
  // TODO:  update displayed e-mail
  // TODO:  clear alternative e-mail field
  // TODO:  show toast
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
  let fetchSettled = false;

  localStorage.removeItem("refreshToken");
  sessionStorage.removeItem("accessToken");

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

  show(spinner);
  hide(submitButton);
  hide(alert);

  if (!navigator.onLine) {
    hide(spinner);
    show(submitButton);
    return showToast(getGlobalPhrase("youAreOffline"), 5000, "danger");
  }

  const proxyEndpoint =
    window.location.hostname === "localhost"
      ? endpoint
      : `/login/proxy.php?target=${endpoint}`;

  fetch(proxyEndpoint, {
    method: "POST",
    body: JSON.stringify({
      username: username,
      password: password,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    signal: controller.signal,
  })
    .then((res) => res.json())
    .then(async (data) => {
      if (data.msg === "invalid login") {
        const phrase = getPhrase("invalid login");
        const headline = getPhrase("invalid login headline");
        hide(spinner);
        show(submitButton);
        showAlert(alert, phrase, headline);
        return;
      } else if (data.msg === "user is not authorized") {
        localStorage.setItem("userToken", data.userToken);
        return (window.location.href = "/authorize/me/");
      } else if (data.msg === "user authenticated") {
        localStorage.setItem("datakey", data.datakey);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.removeItem("pendingConfirmationToken");
        sessionStorage.setItem("accessToken", data.accessToken);

        storeMapKeys(data.refreshToken);

        return forwardAuthenticatedUser();
      } else if (data.msg === "user status is not registered") {
        if (data.pendingConfirmationToken) {
          localStorage.setItem(
            "pendingConfirmationToken",
            data.pendingConfirmationToken
          );
        }

        const registrationPageContent = await fetch(
          `../register/i18n/${getLang()}.json`
        ).then((res) => res.json());

        document.querySelector(".modal-title").innerText = getPhrase(
          "headlineAccountUnconfirmed"
        );

        document.querySelector("[data-i18n='checkyouremailtext']").innerHTML =
          getPhrase("checkyouremailtext", registrationPageContent);

        const pendingConfirmationTokenJSON = localStorage.getItem(
          "pendingConfirmationToken"
        );

        if (!pendingConfirmationTokenJSON) return;

        const pendingConfirmationToken = JSON.parse(
          atob(pendingConfirmationTokenJSON.split(".")[1])
        );

        const now = Date.now();

        const expires = pendingConfirmationToken.exp * 1000;

        if (now > expires) return;

        document.querySelector("[data-i18n='checkThisEmail']").innerText =
          getPhrase("checkThisEmail", registrationPageContent);

        document.querySelector("#emailDisplayed").innerText =
          pendingConfirmationToken.email;

        document.querySelector("[data-i18n='checkSpamFolder']").innerText =
          getPhrase("checkSpamFolder", registrationPageContent);

        document.querySelector("[data-i18n='waitingTooLong']").innerText =
          getPhrase("waitingTooLong", registrationPageContent);

        document.querySelector("[data-i18n='sendAgain']").innerText = getPhrase(
          "sendAgain",
          registrationPageContent
        );

        document.querySelector("[data-i18n='emailBlocked']").innerText =
          getPhrase("emailBlocked", registrationPageContent);

        document.querySelector(
          "[data-i18n='emailBlockedExplanation']"
        ).innerText = getPhrase(
          "emailBlockedExplanation",
          registrationPageContent
        );

        document.querySelector(
          "[data-i18n='labelAlternativeEmailAddress']"
        ).innerText = getPhrase(
          "labelAlternativeEmailAddress",
          registrationPageContent
        );

        document
          .querySelector("[data-i18n-placeholder='email']")
          .setAttribute(
            "placeholder",
            getPhrase("email", registrationPageContent)
          );

        document.querySelector("[data-i18n='updateEmailButton']").innerText =
          getPhrase("updateEmailButton", registrationPageContent);

        hide(spinner);
        show(submitButton);
        $("#modalAccountUnconfirmed").modal();
        return;
      } else {
        const glitchMessage = getPhrase("glitchMessage");
        hide(spinner);
        show(submitButton);
        showAlert(alert, glitchMessage);
      }
    })
    .catch((err) => {
      console.error(err);
      hide(spinner);
      show(submitButton);
    })
    .finally(() => {
      fetchSettled = true;
    });

  setTimeout(() => {
    if (!fetchSettled) {
      controller.abort(`Timeout reached (30 seconds)`);
      hide(spinner);
      show(submitButton);
      const phrase = getPhrase("timedout");
      const headline = getPhrase("timedoutHeadline");
      showAlert(alert, phrase, headline);
    }
  }, 90000);
}

function attachListeners() {
  document.querySelector("#formlogin").addEventListener("submit", onSubmit);
  document
    .querySelector("#buttonSendAgain")
    .addEventListener("click", onResendEmail);
  document
    .querySelector("#formAlternativeEmail")
    .addEventListener("submit", onAlternateEmailUpdated);
  $("#modalAccountUnconfirmed").on("hide.bs.modal", function (e) {
    window.location.reload();
  });
}

async function init() {
  let redirectOnLogin = sessionStorage.getItem("redirectOnLogin");
  const isFromHomeScreen = sessionStorage.getItem("isFromHomeScreen");
  const unsubscribeFromNotifications = sessionStorage.getItem(
    "unsubscribeFromNotifications"
  );

  if (isFromHomeScreen) {
    redirectOnLogin = "/?utm_source=homescreen";
  }

  clearStorage();

  if (redirectOnLogin && redirectOnLogin.length) {
    sessionStorage.setItem("redirectOnLogin", redirectOnLogin);
  }

  await populateContent();
  attachListeners();
  globalHidePageSpinner();
}

init();
