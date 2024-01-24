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
      .then((data) => {
        if (data.msgType === "error") {
          showErrorMessage();
          reject();
        }

        renderContent(data.inviteData);
        resolve();
      });
  }).catch(() => {
    showErrorMessage();
    globalHidePageSpinner();
  });
}

function renderContent(inviteData) {
  const { event, invite, user } = inviteData;
  const prefs = Intl.DateTimeFormat().resolvedOptions();
  console.log(inviteData);

  document.querySelector(
    "#recipientName"
  ).innerHTML = `${invite.recipientname}`;

  document.querySelector("#eventTitle").innerHTML = `${event.title}`;

  let startdate = event.startdate;
  if (event.multidaybegindate) {
    startdate = event.multidaybegindate;
  }

  const eventDate = Intl.DateTimeFormat(prefs.locale, {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(startdate));

  document.querySelector("#eventDate").innerHTML = eventDate;

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
    invite.recipientname
  );
  const headerEntireApp = getPhrase("headerEntireApp");

  const optionTextRecipient = getPhrase("optionRecipient")
    .replaceAll("{SENT-VIA}", sharedVia)
    .replaceAll("{RECIPIENT-NAME}", invite.recipientname);

  const optionTextEntireApp = getPhrase("optionEntireApp").replaceAll(
    "{RECIPIENT-NAME}",
    invite.recipientname
  );

  document.querySelector("#unsub2Header").innerHTML = headerRecipient;
  document.querySelector("#unsub2Text").innerHTML = optionTextRecipient;
  document.querySelector("#unsub3Header").innerHTML = headerEntireApp;
  document.querySelector("#unsub3Text").innerHTML = optionTextEntireApp;

  hideErrorMessage();
}

function onSubmit(e) {
  e.preventDefault();
  console.log("form submitted");
  // TODO:  Create logic to submit the form via fetch (make sure to include the jwt in the body)
  // TODO:  Make API endpoint
}

function attachListeners() {
  document
    .querySelector("#unsubscribeform")
    .addEventListener("submit", onSubmit);
}

async function init() {
  await populateContent();
  await loadContent();
  attachListeners();
  globalHidePageSpinner();
}

init();
