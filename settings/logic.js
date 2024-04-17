function populateForm() {
  return new Promise(async (resolve, reject) => {
    const settings = (await localforage.getItem("settings")) || null;
    if (!settings) return reject();
    const {
      autoAddToFollowupList = false,
      customInviteText = "",
      enableEmailNotifications = true,
      enablePushNotifications = false,
      openingPage = "home",
    } = settings;

    // Opening Page
    if (!openingPage) {
      document.querySelector("#openingPageHome").checked = true;
    } else {
      document.querySelectorAll("[name='openingPage']").forEach((item) => {
        if (item.value === openingPage) {
          item.checked = true;
        } else {
          item.checked = false;
        }
      });
    }

    // Custom Invite Text
    if (customInviteText) {
      document.querySelector("#bodyText").value = customInviteText.trim();
    }

    // Enable Email Notifications
    document.querySelector("#notifyViaEmail").checked =
      enableEmailNotifications;

    // Enable Push Notificadtions
    document.querySelector("#notifyViaPush").checked = enablePushNotifications;

    // Auto-add to follow up list
    document.querySelector("#autoAddToFollowUpList").checked =
      autoAddToFollowupList;

    return resolve();
  });
}

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

function showWebPushDeniedModal() {
  //
}

function showWebPushGetReadyModal() {
  $("#webPushModal").modal();
}

function showWebPushNotSupportedModal() {
  //
}

function onEnablePushClicked(e) {
  const isChecked = e.target.checked ? true : false;
  const isMobile = isMobileDevice();

  if (isChecked) {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        e.target.checked = true;
      } else if (Notification.permission === "denied") {
        showWebPushDeniedModal();
        e.target.checked = false;
      } else {
        e.target.checked = isChecked;
        showWebPushGetReadyModal();
      }
    } else {
      e.target.checked = isChecked;
      showWebPushNotSupportedModal();
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
  await localforage.setItem("unsyncedSettings", settings);

  document.querySelector("body").scrollIntoView();

  showToast(getPhrase("settingsUpdated"), 3000, "success");

  syncSettings();
}

function onWebPushRequested() {
  navigator.serviceWorker.ready.then((swReg) => {
    // Do we already have a push message subscription?
    swReg.pushManager.getSubscription().then((subscription) => {
      if (!subscription) {
        console.log("No Subscription endpoint present");
      }
      debugger;
    });
  });
}

function attachListeners() {
  document.querySelector("#settingsForm").addEventListener("submit", onSubmit);
  document
    .querySelector("#notifyViaPush")
    .addEventListener("click", onEnablePushClicked);
  document
    .querySelector("#buttonWebPushRequestPermission")
    .addEventListener("click", onWebPushRequested);
  document
    .querySelector("#toggleCustomTextInstructions")
    .addEventListener("toggle", (e) => {
      console.log(e);
    });
}

async function init() {
  syncSettings().then(async (result) => {
    if (result.changed) {
      await populateForm();
    }
  });
  await populateContent();
  populateInviteTextExample();
  await populateForm();
  attachListeners();
  globalHidePageSpinner();
}

init();
