let syncedInvites = false;

function getRecipient() {
  return new Promise(async (resolve, reject) => {
    const hash = window.location.hash;
    let recipientParts = hash.split("/") || null;
    if (!recipientParts) {
      return reject(new Error("Required URL parameters are missing"));
    }
    if (!Array.isArray(recipientParts)) {
      return reject(new Error("URL parameters must be separated by slashes"));
    }
    if (!recipientParts.length) {
      return reject(new Error("At least one URL parameter is required"));
    }

    const invitationid = recipientParts[1] || null;

    let invites = (await localforage.getItem("invites")) || null;

    await syncInvites();
    syncedInvites = true;
    invites = await localforage.getItem("invites");

    const invite = invites.find(
      (item) => item.invitationid === parseInt(Math.abs(invitationid))
    );

    if (invite) {
      renderRecipient(invite);
      resolve();
    }

    return reject(new Error("invite not found"));
  });
}

async function renderRecipient(invite) {
  const {
    coords,
    interactions,
    eventid,
    recipient,
    sentvia,
    timezone,
    utctime,
  } = invite;
  const { email, id, name, sms } = recipient;
  const dateInvitedEl = document.querySelector("#dateInvited");
  const eventNameEl = document.querySelector("#eventName");
  const numTimesViewedInviteEl = document.querySelector(
    "[data-i18n='numTimesViewedInvite']"
  );
  const userDateTimePrefs = Intl.DateTimeFormat().resolvedOptions();
  const userTimezone = userDateTimePrefs.timeZone || "";
  const { locale } = userDateTimePrefs;
  const whenInvited = Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: userTimezone,
  }).format(new Date(utctime));
  const events = await localforage.getItem("events");
  const event = events.filter((item) => item.eventid === eventid);
  const inviteViews = interactions.filter(
    (item) => item.interactiontype === "viewed invite"
  );
  let numTimesViewedInviteText = numTimesViewedInviteEl.innerText;

  if (!event.length) {
    console.error(`Event ${eventid} not found`);
  }

  const eventName = event.title || null;

  document.querySelectorAll("[data-i18n='pagetitle']").forEach((item) => {
    item.innerText = item.innerText.replaceAll("{RECIPIENT-NAME}", name);
  });

  if (dateInvitedEl) dateInvitedEl.innerText = whenInvited;
  if (eventNameEl && eventName) eventNameEl.innerText = eventName;

  numTimesViewedInviteText = numTimesViewedInviteText.replaceAll(
    "{RECIPIENT-NAME}",
    name
  );
  numTimesViewedInviteText = numTimesViewedInviteText.replaceAll(
    "{QUANTITY-VIEWS}",
    inviteViews.length
  );
  numTimesViewedInviteEl.innerHTML = numTimesViewedInviteText;
}

function attachListeners() {
  //
}

async function init() {
  await populateContent();
  await syncEvents();
  await getRecipient();
  attachListeners();
  globalHidePageSpinner();
}

init();
