function clearObsoleteSessionStorage() {
  sessionStorage.removeItem("unsubscribeFromNotifications");
  sessionStorage.removeItem("redirectOnLogin");
}

function hideErrorMessage() {
  document.querySelector("#invalidUnsubscribe").classList.add("d-none");
  document
    .querySelectorAll(".invite")
    .forEach((item) => item.classList.remove("d-none"));
}

function showErrorMessage() {
  document.querySelector("#invalidUnsubscribe").classList.remove("d-none");
  document
    .querySelectorAll(".invite")
    .forEach((item) => item.classList.add("d-none"));
}

function loadContent() {
  return new Promise((resolve, reject) => {
    let unsubscribeToken = window.location.search.split("?");

    if (!Array.isArray(unsubscribeToken)) {
      return reject(new Error("invalid unsubscribe token"));
    }

    if (unsubscribeToken.length !== 2) {
      return reject(new Error("invalid unsubscribe token"));
    }

    unsubscribeToken = unsubscribeToken[1];

    let jwt;

    try {
      jwt = atob(unsubscribeToken);
    } catch (e) {
      return reject(e);
    }

    const endpoint = `${getApiHost()}/unsubscribe-before`;
    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        jwt: jwt,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
      }),
      keepalive: true,
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data.msgType === "error") {
          showErrorMessage();
          reject();
        }

        await renderContent(data.inviteData);

        resolve();
      });
  }).catch(() => {
    showErrorMessage();
    globalHidePageSpinner();
  });
}

function renderContent(inviteData) {
  return new Promise((resolve, reject) => {
    const { event, invite, user } = inviteData;
    const prefs = Intl.DateTimeFormat().resolvedOptions();
    // console.log(inviteData);

    document.querySelector(
      "#recipientName"
    ).innerHTML = `${invite.recipientname}`;

    document.querySelector("#eventTitle").innerHTML = `${event.title}`;

    if (event.multidaybegindate && event.multidayenddate) {
      const from = getPhrase("from");
      const to = getPhrase("to");
      const fromDate = Intl.DateTimeFormat(prefs.locale, {
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date(multidaybegindate));
      const toDate = Intl.DateTimeFormat(prefs.locale, {
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date(multidayenddate));
      document.querySelector("#eventDate").innerHTML = `
        ${from} ${fromDate}<br>
        ${to} ${toDate}
      `;
    } else {
      let startdate = event.startdate; // Could be either recurring or one-time

      if (event.frequency !== "once") {
        // Handle if recurring
        const date = moment.tz(startdate, prefs.timeZone).format("YYYY-MM-DD");
        const time = moment.tz(startdate, prefs.timeZone).format("HH:mm:ss");
        startdate = `${getNextRecurringWeekday(date, time)}T${time}`;
      }

      const eventDate = Intl.DateTimeFormat(prefs.locale, {
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date(startdate));
      document.querySelector("#eventDate").innerHTML = eventDate;
    }

    const invitedDate = Intl.DateTimeFormat(prefs.locale, {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date(invite.invitedAt));

    document.querySelector("#dateInvited").innerHTML = invitedDate;

    const timezoneText = getPhrase("timezoneText").replaceAll(
      "{TIME-ZONE}",
      prefs.timeZone
    );
    document.querySelector("#timezone").innerHTML = timezoneText;

    const optionJustThisInviteTxt = getPhrase(
      "optionJustThisInvite"
    ).replaceAll("{RECIPIENT-NAME}", invite.recipientname.trim());
    document.querySelector("#optionJustThisInvite").innerHTML =
      optionJustThisInviteTxt;

    let sharedVia;
    if (invite.sharedvia === "sms") {
      sharedVia = getGlobalPhrase("textmessage");
    } else if (invite.sharedvia === "email") {
      sharedVia = getGlobalPhrase("email");
    } else {
      sharedVia = getPhrase("yourdevice");
    }

    const headerRecipient = getPhrase("headerRecipient").replaceAll(
      "{RECIPIENT-NAME}",
      invite.recipientname.trim()
    );
    const headerEntireApp = getPhrase("headerEntireApp");

    const optionTextRecipient = getPhrase("optionRecipient")
      .replaceAll("{SENT-VIA}", sharedVia)
      .replaceAll("{RECIPIENT-NAME}", invite.recipientname.trim());

    const optionTextEntireApp = getPhrase("optionEntireApp").replaceAll(
      "{RECIPIENT-NAME}",
      invite.recipientname
    );

    document.querySelector("#unsub2Header").innerHTML = headerRecipient;
    document.querySelector("#unsub2Text").innerHTML = optionTextRecipient;
    document.querySelector("#unsub3Header").innerHTML = headerEntireApp;
    document.querySelector("#unsub3Text").innerHTML = optionTextEntireApp;

    hideErrorMessage();

    resolve();
  });
}

function onSubmit(e) {
  e.preventDefault();

  const unsubscribeFrom = document.querySelector(
    "[name='unsub']:checked"
  ).value; // invite | recipient | app

  if (!["invite", "recipient", "app"].includes(unsubscribeFrom)) return false;

  const token = window.location.search.split("?")[1];
  const jwt = atob(token);

  if (unsubscribeFrom === "recipient") {
    const unsubscribeFromNotifications = {
      unsubscribeFrom: unsubscribeFrom,
      jwt: jwt,
    };

    sessionStorage.setItem(
      "unsubscribeFromNotifications",
      JSON.stringify(unsubscribeFromNotifications)
    );

    sessionStorage.setItem("redirectOnLogin", "/unsubscribe/done");

    window.location.href = "../logout/";
    return;
  }

  const endpoint = `${getApiHost()}/unsubscribe`;

  globalShowPageSpinner();

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      jwt: jwt,
      unsubscribeFrom: unsubscribeFrom,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.msgType !== "success") return;
      globalHidePageSpinner();
      window.location.href = "./success/";
    })
    .catch((err) => {
      console.error(err);
      globalHidePageSpinner();
    });
}

function attachListeners() {
  document
    .querySelector("#unsubscribeform")
    .addEventListener("submit", onSubmit);

  document.addEventListener("visibilitychange", (e) => {
    if (document.visibilityState === "visible") {
      clearObsoleteSessionStorage();
    }
  });
}

async function init() {
  await populateContent();
  await loadContent();
  clearObsoleteSessionStorage();
  attachListeners();
  globalHidePageSpinner();
}

init();
