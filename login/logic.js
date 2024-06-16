function forwardAuthenticatedUser() {
  /* await getCountries(getLang());
  await syncChurches();
  await syncEvents();
  await syncInvites();
  await syncUpdatedInvites();
  await syncAllNotes();
  await syncSettings(); */

  Promise.all([
    getCountries(getLang()),
    syncChurches(),
    syncEvents(),
    syncInvites(),
    syncUpdatedInvites(),
    syncAllNotes(),
    syncSettings(),
  ])
    .then(async (result) => {
      try {
        await syncPushSubscription();
      } catch (err) {
        console.log(err);
      }

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

      window.location.href = "../";
    })
    .catch((error) => {
      console.error(error);
    });
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
    return showToast(getGlobalPhrase("youAreOffline"), 5000, "danger");
  }

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
      } else if (data.msg === "user authenticated") {
        localStorage.setItem("datakey", data.datakey);
        localStorage.setItem("refreshToken", data.refreshToken);
        sessionStorage.setItem("accessToken", data.accessToken);

        return forwardAuthenticatedUser();
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
    });
}

function attachListeners() {
  document.querySelector("#formlogin").addEventListener("submit", onSubmit);
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
