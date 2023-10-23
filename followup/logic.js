function populateFollowUpList() {
  const followUpListEl = document.querySelector("#followUpList");
  const msgEmptyListEl = document.querySelector("#msgEmptyList");
  localforage.getItem("followUpList").then(async (followUpList = []) => {
    if (!Array.isArray(followUpList) || !followUpList.length) {
      followUpListEl.classList.add("d-none");
      msgEmptyListEl.classList.remove("d-none");
      return;
    }

    const invites = await localforage.getItem("invites");

    if (!invites) {
      followUpListEl.classList.add("d-none");
      msgEmptyListEl.classList.remove("d-none");
      return;
    }

    const followUps = followUpList.map((invitationid) => {
      const invite = invites.find(
        (invite) => invite.invitationid === invitationid
      );
      return invite;
    });

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
  });
}

function attachListeners() {}

async function init() {
  await populateContent();
  globalHidePageSpinner();
  populateFollowUpList();
  attachListeners();
}

init();
