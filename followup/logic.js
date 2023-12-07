async function populateFollowUpList() {
  const followUpListEl = document.querySelector("#followUpList");
  const msgEmptyListEl = document.querySelector("#msgEmptyList");
  const invites = await localforage.getItem("invites");

  if (!invites) {
    followUpListEl.classList.add("d-none");
    msgEmptyListEl.classList.remove("d-none");
    return;
  }

  const followUps = invites.filter((item) => item.followup === 1);

  if (!Array.isArray(followUps) || !followUps.length) {
    followUpListEl.classList.add("d-none");
    msgEmptyListEl.classList.remove("d-none");
    return;
  }

  const followUpsSorted = followUps.sort((a, b) => {
    return a.recipient.name.localeCompare(b.recipient.name);
  });

  let listHTML = "";

  followUpsSorted.forEach((invite) => {
    const userDateTimePrefs = Intl.DateTimeFormat().resolvedOptions();
    const invitedOnDate = Intl.DateTimeFormat(userDateTimePrefs.locale, {
      dateStyle: "long",
    }).format(new Date(invite.utctime));
    const invitedOnText = getPhrase("invitedOn").replaceAll(
      "{INVITED-ON-DATE}",
      invitedOnDate
    );
    listHTML += `
      <a href="../r/#/${invite.invitationid}" class="list-group-item list-group-item-action">
        <strong>${invite.recipient.name}</strong>
        <div class="text-muted"><small>${invitedOnText}</small></div>
      </a>
    `;
  });

  followUpListEl.innerHTML = listHTML;

  msgEmptyListEl.classList.add("d-none");
  followUpListEl.classList.remove("d-none");
}

function onPageShow(event) {
  if (event.persisted) {
    window.location.reload();
  }
}

function attachListeners() {
  window.addEventListener("pageshow", onPageShow);
}

async function init() {
  await populateContent();
  globalHidePageSpinner();
  populateFollowUpList();
  attachListeners();
  syncUpdatedInvites();
  syncInvites();
}

init();
