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

    // Enable Push Notifications
    document.querySelector("#notifyViaPush").checked = false;
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        const pushSubscription = await getPushSubscription().catch((error) => {
          return null;
        });
        if (typeof pushSubscription === "object") {
          document.querySelector("#notifyViaPush").checked =
            enablePushNotifications;
        }
      }
    }

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

function showPushNotificationsCheckbox() {
  const el = document.querySelector("#notifyViaPushContainer");
  let pushIsSupported = "Notification" in window ? true : false;

  if (typeof navigator.standalone !== undefined) {
    // Specific to iOS. If iOS, display mode must be standalone.
    if (!navigator.standalone) {
      pushIsSupported = false;
    }
  }

  if (pushIsSupported) {
    el.classList.remove("d-none");
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        getPushSubscription().then((subscription) => {
          if (subscription) {
            document
              .querySelector("#testWebPushContainer")
              .classList.remove("d-none");
          }
        });
      }
    }
  }
}

function showWebPushDeniedModal() {
  const domainName = document.querySelector(
    "[data-i18n=webPushBlockedParagraph2] strong"
  );
  domainName.innerText = domainName.innerText.replace(
    "invites.mobi",
    window.location.hostname
  );
  $(".modal").modal("hide");
  $("#webPushDeniedModal").modal();
}

function showWebPushGetReadyModal() {
  $(".modal").modal("hide");
  $("#webPushModal").modal();
}

function showWebPushNotSupportedModal() {
  if (!isMobileDevice()) {
    const paragraph2 = document.querySelector(
      "[data-i18n=webPushNotSupportedParagraph2]"
    );
    const domainNameEl = paragraph2.querySelector("strong");
    domainNameEl.innerText = domainNameEl.innerText.replace(
      "invites.mobi",
      window.location.hostname
    );
    paragraph2.classList.remove("d-none");
  }

  $(".modal").modal("hide");
  $("#webPushNotSupportedModal").modal();
  document.querySelector("#notifyViaPush").checked = false;
}

async function onEnablePushClicked(e) {
  const isChecked = e.target.checked ? true : false;

  if (isChecked) {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        const pushSubscription = await getPushSubscription().catch((error) => {
          return null;
        });
        if (typeof pushSubscription === "object") {
          if (navigator.onLine) {
            syncPushSubscription();
          }
        } else {
          e.target.checked = false;
        }
      } else if (Notification.permission === "denied") {
        showWebPushDeniedModal();
        e.target.checked = false;
      } else {
        e.target.checked = false;
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
  Notification.requestPermission()
    .then(async (permission) => {
      switch (permission) {
        case "default":
          document.querySelector("#notifyViaPush").checked = false;
          $(".modal").modal("hide");
          break;
        case "denied":
          document.querySelector("#notifyViaPush").checked = false;
          $(".modal").modal("hide");
          showWebPushDeniedModal();
          break;
        case "granted":
          const subscription = await getPushSubscription().catch((error) => {
            return null;
          });
          if (typeof subscription === "object") {
            showToast(
              getPhrase("webPushNowAuthorized"),
              5000,
              "success",
              ".snackbar",
              true
            );
            document.querySelector("#notifyViaPush").checked = true;
            $(".modal").modal("hide");
            if (navigator.onLine) {
              syncPushSubscription();
            }
          } else {
            document.querySelector("#notifyViaPush").checked = false;
            $(".modal").modal("hide");
            showToast(
              getPhrase("webPushSomethingWentWrong"),
              5000,
              "danger",
              ".snackbar",
              true
            );
          }
          break;
        default:
          document.querySelector("#notifyViaPush").checked = false;
          $(".modal").modal("hide");
          break;
      }
    })
    .catch((error) => {
      console.error(error);
      $(".modal").modal("hide");
    });
}

async function onTestWebPushClick(e) {
  e.preventDefault();

  const endpoint = `${getApiHost()}/push-test`;
  const accessToken = await getAccessToken();
  const pushSubscription = await getPushSubscription().catch((error) => {
    console.error(error);
    return null;
  });
  const userGender = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  ).gender;
  const recipientName = await getRandomName();
  const pushTitle = getPhrase("pushTitle").replaceAll(
    "{RECIPIENT}",
    recipientName
  );
  const pushBody = getPhrase("pushBody");
  const payload = {
    title: pushTitle,
    body: pushBody,
  };

  let permissionGranted = false;
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      permissionGranted = true;
    }
  }

  if (!permissionGranted) {
    const msg =
      "User has not yet granted permission to receive push notifications";
    if (window.location.hostname === "localhost") {
      return showToast(msg, 5000, "danger", ".snackbar", true);
    } else {
      return console.error(msg);
    }
  }

  if (!pushSubscription) {
    const msg = "Push subscription does not exist in this browser.";
    if (window.location.hostname === "localhost") {
      return showToast(msg, 5000, "danger", ".snackbar", true);
    } else {
      return console.error(msg);
    }
  }

  document
    .querySelector("#testSpinner")
    .classList.replace("d-none", "d-inline-block");

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
    }),
    body: JSON.stringify({
      pushSubscription: pushSubscription,
      payload: payload,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
    });

  setTimeout(() => {
    document
      .querySelector("#testSpinner")
      .classList.replace("d-inline-block", "d-none");
  }, 5000);
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

  document
    .querySelector("#testWebPush")
    .addEventListener("click", onTestWebPushClick);

  navigator.serviceWorker.addEventListener("message", (event) => {
    // Hide spinner when push message has been received
    if (event.data && event.data.type === "pushReceived") {
      document
        .querySelector("#testSpinner")
        .classList.replace("d-inline-block", "d-none");
    }
  });
}

async function init() {
  syncSettings().then(async (result) => {
    if (result.changed) {
      await populateForm();
    }
  });
  if (navigator.onLine) syncPushSubscription();
  showPushNotificationsCheckbox();
  await populateContent();
  populateInviteTextExample();
  await populateForm();
  attachListeners();
  globalHidePageSpinner();
}

init();
