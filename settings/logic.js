const userAgent = navigator.userAgent || navigator.vendor || window.opera;
const iOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
let randomRecipientName;

function populateDefaultName() {
  return new Promise((resolve, reject) => {
    const gender = JSON.parse(
      atob(localStorage.getItem("refreshToken").split(".")[1])
    ).gender;
    getDefaultName(gender).then((name) => {
      randomRecipientName = name;
      return resolve();
    });
  });
}

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
        if (!!pushSubscription) {
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
  const gender = userData.gender;
  const genderPronoun =
    gender === "female"
      ? getGlobalPhrase("herPronoun")
      : getGlobalPhrase("himPronoun");

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
    .querySelectorAll("[data-i18n='templatePlaceholderExplanation2']")
    .forEach((el) => {
      const rawText = el.innerHTML;
      const fixedText = rawText
        .replaceAll("{RANDOM-RECIPIENT-NAME}", randomRecipientName)
        .replaceAll("{GENDER-PRONOUN}", genderPronoun);
      el.innerHTML = fixedText;
    });
  document
    .querySelectorAll("[data-i18n='templatePlaceholderAfter']")
    .forEach((el) => {
      const rawText = el.innerHTML;
      const fixedText = rawText
        .replaceAll("{SENDER-FIRST-NAME}", firstName)
        .replaceAll("{RANDOM-RECIPIENT-NAME}", randomRecipientName);
      el.innerHTML = fixedText;
    });
}

function populateReceivePushNotificationsCheckbox(result) {
  const settings = result.settings;
  const pushSubscriptions = result.pushSubscriptions;
  const { changed, enablePushNotifications } = settings;
  const notifyViaPushEl = document.querySelector("#notifyViaPush");
  const notifyViaPushContainerEl = document.querySelector(
    "#notifyViaPushContainer"
  );

  if (pushSubscriptions && pushSubscriptions.length) {
    notifyViaPushEl.checked = enablePushNotifications ? true : false;
    notifyViaPushContainerEl.classList.remove("d-none");
  }

  if (changed) {
    populateForm();
  }
}

function showEnablePushNotificationsCheckbox() {
  const enablePushContainerEl = document.querySelector("#enablePushContainer");
  let pushIsPossible = "Notification" in window ? true : false;

  if (iOS) {
    if (!navigator.standalone) {
      pushIsPossible = false;
    }
  }

  if (!pushIsPossible) return;

  if ("Notification" in window) {
    enablePushContainerEl.classList.remove("d-none");
    if (Notification.permission === "granted") {
      getPushSubscription()
        .then(async (subscription) => {
          if (subscription) {
            enablePushContainerEl.classList.add("d-none");
            const subscriptionHash = await invitesCrypto.hash(
              JSON.stringify(subscription)
            );
            const subscriptions = await localforage.getItem(
              "pushSubscriptions"
            );
            const subscriptionFound = subscriptions.find(
              (item) => item.sha256hex === subscriptionHash
            )
              ? true
              : false;

            if (subscriptionFound) {
              togglePushNotificationExampleButton();
            }
          }
        })
        .catch((error) => console.error(error));
    }
  }
}

async function showReceivePushNotificationsCheckbox() {
  const el = document.querySelector("#notifyViaPushContainer");
  const pushSubscriptions = await localforage.getItem("pushSubscriptions");
  let pushIsSupported = "Notification" in window ? true : false;

  if (iOS) {
    if (!navigator.standalone) {
      pushIsSupported = false;
    }
  }

  if (!pushIsSupported) return;
  if (!navigator.onLine) return;
  if (!pushSubscriptions) return;
  if (!pushSubscriptions.length) return;

  el.classList.remove("d-none");
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
    const paragraph3 = document.querySelector(
      "[data-i18n=webPushNotSupportedParagraph3]"
    );
    const domainNameEl = paragraph3.querySelector("strong");
    domainNameEl.innerText = domainNameEl.innerText.replace(
      "invites.mobi",
      window.location.hostname
    );
    paragraph3.classList.remove("d-none");
  }

  $(".modal").modal("hide");
  $("#webPushNotSupportedModal").modal();
  document.querySelector("#notifyViaPush").checked = false;
}

async function togglePushNotificationExampleButton() {
  const testWebPushContainerEl = document.querySelector(
    "#testWebPushContainer"
  );

  let pushIsPossible = "Notification" in window ? true : false;

  if (iOS) {
    if (!navigator.standalone) {
      pushIsPossible = false;
    }
  }

  if (!pushIsPossible) {
    return;
  }

  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      getPushSubscription().then(async (subscription) => {
        if (subscription) {
          const subscriptionHash = await invitesCrypto.hash(
            JSON.stringify(subscription)
          );
          const subscriptions = await localforage.getItem("pushSubscriptions");
          const subscriptionFound = subscriptions.find(
            (item) => item.sha256hex === subscriptionHash
          )
            ? true
            : false;

          if (subscriptionFound) {
            testWebPushContainerEl.classList.remove("d-none");
          }
        }
      });
    }
  }
}

async function onEnablePushClicked(e) {
  const isChecked = e.target.checked ? true : false;

  if (isChecked) {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        const pushSubscription = await getPushSubscription().catch((error) => {
          return null;
        });
        if (!!pushSubscription) {
          if (navigator.onLine) {
            syncPushSubscription().then(() => {
              e.target.checked = true;
              document
                .querySelector("#enablePushContainer")
                .classList.add("d-none");
              document.querySelector("#notifyViaPush").checked = false;
              document
                .querySelector("#notifyViaPushContainer")
                .classList.remove("d-none");
              togglePushNotificationExampleButton();
            });
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
  let receiveEmailNotifications = false;
  let receivePushNotifications = false;
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

  // Receive Email Notifications
  receiveEmailNotifications = document.querySelector("#notifyViaEmail").checked
    ? true
    : false;

  // Receive Push Notificadtions
  receivePushNotifications = document.querySelector("#notifyViaPush").checked
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
    enableEmailNotifications: receiveEmailNotifications,
    enablePushNotifications: receivePushNotifications,
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
          document.querySelector("#enablePushNotifications").checked = false;
          $(".modal").modal("hide");
          break;
        case "denied":
          document.querySelector("#enablePushNotifications").checked = false;
          $(".modal").modal("hide");
          showWebPushDeniedModal();
          break;
        case "granted":
          const subscription = await getPushSubscription().catch((error) => {
            return null;
          });
          await syncPushSubscription().then(() => {
            document
              .querySelector("#enablePushContainer")
              .classList.add("d-none");
            document
              .querySelector("#testWebPushContainer")
              .classList.remove("d-none");
            $(".modal").modal("hide");
            showToast(
              getPhrase("webPushNowAuthorized"),
              5000,
              "success",
              ".snackbar",
              true
            );
          });
          break;
        default:
          document.querySelector("#enablePushNotifications").checked = false;
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
  const pushSubscription = await getPushSubscription().catch((error) => {
    console.error(error);
    return null;
  });
  const firstName = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  ).firstname;
  const pushTitle = getPhrase("pushTitle").replaceAll(
    "{FIRST-NAME}",
    firstName
  );
  const pushBody = getPhrase("pushBody");
  const payload = {
    title: pushTitle,
    body: pushBody,
  };

  if (isPushPermitted() === false) {
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

  const accessToken = await getAccessToken();

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
    })
    .catch((error) => {
      console.error(error);
      document
        .querySelector("#testSpinner")
        .classList.replace("d-inline-block", "d-none");
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
    .querySelector("#enablePushNotifications")
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
    populateReceivePushNotificationsCheckbox(result);
    showReceivePushNotificationsCheckbox();
    togglePushNotificationExampleButton();
  });

  if (navigator.onLine) syncPushSubscription();
  showEnablePushNotificationsCheckbox();
  await populateContent();
  await populateDefaultName();
  populateInviteTextExample();
  await populateForm();
  attachListeners();
  await togglePushNotificationExampleButton();
  globalHidePageSpinner();
}

init();
