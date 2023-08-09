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

    const eventid = Number(recipientParts[1]) || null;
    const userid = Number(recipientParts[2]) || null;
    const recipientid = recipientParts[3] || null;

    let invites = (await localforage.getItem("invites")) || null;

    if (!invites) {
      await syncInvites();
      syncedInvites = true;
      invites = await localforage.getItem("invites");
    }

    const invite = invites.find((item) => item.recipient.id === recipientid);

    if (invite) {
      renderRecipient(invite);
      return resolve();
    }

    syncInvites().then(() => {
      syncedInvites = true;
      getRecipient();
      return resolve();
    });
  });
}

function renderRecipient(invite) {
  const { coords, eventid, recipient, sentvia, timezone, utctime } = invite;
  const { email, id, name, sms } = recipient;

  document.querySelectorAll("[data-i18n='pagetitle']").forEach((item) => {
    item.innerText = item.innerText.replaceAll("{RECIPIENT-NAME}", name);
  });
}

function attachListeners() {
  //
}

async function init() {
  await populateContent();
  await getRecipient();
  if (!syncedInvites) syncInvites();
  attachListeners();
  globalHidePageSpinner();
}

init();
