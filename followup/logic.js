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

function onSubmitByActivity(e) {
  e.preventDefault();

  const fromDateEl = e.target.fromDate;
  const fromDate = fromDateEl.value;
  fromDateEl.classList.add("is-invalid");

  const toDateEl = e.target.toDate;
  const toDate = toDateEl.value;

  const haventViewedInviteEl = e.target.searchHaveNotViewedInvite;
  const haventViewedInvite = haventViewedInviteEl.checked;

  const haveViewedInviteEl = e.target.searchHaveViewedInvite;
  const haveViewedInvite = haveViewedInviteEl.checked;

  const clickedRSVPEl = e.target.searchClickedRSVP;
  const clickedRSVP = clickedRSVPEl.checked;

  const clickedAddToCalendarEl = e.target.searchClickedAddToMyCalendar;
  const clickedAddToCalendar = clickedAddToCalendarEl.checked;

  // TODO: Process form
}

function onSubmitSpecificRecipient(e) {
  e.preventDefault();

  const recipientNameEl = e.target.specificRecipientName;
  const recipientName = recipientNameEl.value;

  const recipientPhoneEl = e.target.specificRecipientPhone;
  const recipientPhone = recipientPhoneEl.value;

  const recipientEmailEl = e.target.specificRecipientEmail;
  const recipientEmail = recipientEmailEl.value;

  // TODO: Process form
}

function attachListeners() {
  document
    .querySelector("#formSearchByActivity")
    .addEventListener("submit", onSubmitByActivity);

  document
    .querySelector("#formSpecificRecipient")
    .addEventListener("submit", onSubmitSpecificRecipient);

  document.querySelector("#searchHaveViewedInvite").addEventListener("click", (e) => {
    const searchClickedAddToMyCalendarEl = document.querySelector("#searchClickedAddToMyCalendar");
    const searchClickedRSVPEl = document.querySelector("#searchClickedRSVP");
    const isChecked = e.target.checked ? true : false;

    if (isChecked) {
      searchClickedAddToMyCalendarEl.checked = false;
      searchClickedRSVPEl.checked = false;
    }
  });

  document.querySelector("#searchClickedRSVP").addEventListener("click", (e) => {
    const searchHaveViewedInviteEl = document.querySelector("#searchHaveViewedInvite");
    const isChecked = e.target.checked ? true : false;

    if (isChecked) {
      searchHaveViewedInviteEl.checked = false;
    }
  });

  document.querySelector("#searchClickedAddToMyCalendar").addEventListener("click", (e) => {
    const searchHaveViewedInviteEl = document.querySelector("#searchHaveViewedInvite");
    const isChecked = e.target.checked ? true : false;

    if (isChecked) {
      searchHaveViewedInviteEl.checked = false;
    }
  });
}

async function init() {
  await populateContent();
  globalHidePageSpinner();
  populateFollowUpList();
  attachListeners();
}

init();
