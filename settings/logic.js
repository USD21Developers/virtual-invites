function populateInviteTextExample() {
  const userData = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  );
  const firstName = userData.firstname;
  document
    .querySelectorAll("[data-i18n='customInviteTextExample']")
    .forEach((el) => {
      const rawText = el.innerHTML;
      const fixedText = rawText.replaceAll("{SENDER-FIRST-NAME}", firstName);
      el.innerHTML = fixedText;
    });
  document
    .querySelectorAll("[data-i18n='templatePlaceholderBefore']")
    .forEach((el) => {
      const rawText = el.innerHTML;
      let fixedText;
      fixedText = rawText.replaceAll("{SENDER-FIRST-NAME}", firstName);
      el.innerHTML = fixedText;
    });
  document
    .querySelectorAll("[data-i18n='templatePlaceholderAfter']")
    .forEach((el) => {
      const rawText = el.innerHTML;
      const fixedText = rawText.replaceAll("{SENDER-FIRST-NAME}", firstName);
      el.innerHTML = fixedText;
    });
}

function onEnablePushClicked(e) {
  const isChecked = e.target.checked ? true : false;

  if (isChecked) {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        e.target.checked = true;
      } else if (Notification.permission === "denied") {
        e.target.checked = false;
      } else {
        e.target.checked = false;
      }
    } else {
      e.target.checked = false;
    }
  }
}

async function onSubmit(e) {
  e.preventDefault();
  let openingPage = "home";
  let customInviteText = "";
  let enableEmailNotifications = false;
  let enablePushNotifications = false;
  let autoAddToFollowupList = false;

  // Opening Page
  document.querySelectorAll("[name='openingPage']").forEach((item) => {
    if (item.checked) {
      openingPage = item.value;
      return;
    }
  });

  // Custom Invite Text
  customInviteText = document.querySelector("#bodyText").value.trim();

  // Enable Email Notifications
  enableEmailNotifications = document.querySelector("#notifyViaEmail").checked
    ? true
    : false;

  // Enable Push Notificadtions
  enablePushNotifications = document.querySelector("#notifyViaPush").checked
    ? true
    : false;

  // Auto-add to follow up list
  autoAddToFollowupList = document.querySelector("#autoAddToFollowUpList")
    .checked
    ? true
    : false;

  const settings = {
    openingPage: openingPage,
    customInviteText: customInviteText,
    enableEmailNotifications: enableEmailNotifications,
    enablePushNotifications: enablePushNotifications,
    autoAddToFollowupList: autoAddToFollowupList,
  };

  await localforage.setItem("settings", settings);

  syncSettings();
}

function attachListeners() {
  document.querySelector("#settingsForm").addEventListener("submit", onSubmit);
  document
    .querySelector("#notifyViaPush")
    .addEventListener("click", onEnablePushClicked);
}

async function init() {
  await populateContent();
  populateInviteTextExample();
  attachListeners();
  globalHidePageSpinner();
}

init();
