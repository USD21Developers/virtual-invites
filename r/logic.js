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
  const interactionViewsEl = document.querySelector("#interactionViews");
  const labelViewsEl = document.querySelector("[data-i18n='label_views']");
  const userDateTimePrefs = Intl.DateTimeFormat().resolvedOptions();
  const userTimezone = userDateTimePrefs.timeZone || "";
  const { locale } = userDateTimePrefs;
  const whenInvited = Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: userTimezone,
  }).format(new Date(utctime));

  const events = await localforage.getItem("events");
  const eventsByFollowedUsers = await localforage.getItem(
    "eventsByFollowedUsers"
  );
  let event = events.find((item) => item.eventid === eventid);
  if (!event) {
    event = eventsByFollowedUsers.find((item) => item.eventid === eventid);
  }

  const inviteViews = interactions.filter(
    (item) => item.interactiontype === "viewed invite"
  );

  const eventName = event.title || null;

  document.querySelectorAll("[data-i18n='pagetitle']").forEach((item) => {
    item.innerText = item.innerText.replaceAll("{RECIPIENT-NAME}", name);
  });

  let inviteViewsHTML = ``;
  inviteViews.forEach((item) => {
    const dateText = Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: userTimezone,
    }).format(new Date(item.utcdate));
    inviteViewsHTML += `<div class="mb-2">${dateText}</div>\n`;
  });

  if (eventNameEl && eventName) eventNameEl.innerText = eventName;
  if (dateInvitedEl) dateInvitedEl.innerText = whenInvited;
  if (interactionViewsEl) interactionViewsEl.innerHTML = inviteViewsHTML;
  if (labelViewsEl) {
    let labelViewsPhrase = getPhrase("label_views");
    labelViewsPhrase = labelViewsPhrase.replaceAll(
      "{QUANTITY-VIEWS}",
      `${inviteViews.length}`
    );
    labelViewsEl.innerHTML = labelViewsPhrase;
  }
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
