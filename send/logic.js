let coordinates;
let iti;
let recipientIdGlobal = "";
const geoLocationOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

async function checkForEvents() {
  let events = await localforage.getItem("events");
  let eventsByFollowedUsers = await localforage.getItem(
    "eventsByFollowedUsers"
  );
  let hasEvents = false;

  if (Array.isArray(events) && events.length) {
    hasEvents = true;
  }

  if (Array.isArray(eventsByFollowedUsers) && eventsByFollowedUsers.length) {
    hasEvents = true;
  }

  if (!hasEvents) {
    return new Promise((resolve, reject) => {
      syncEvents()
        .then(async () => {
          events = await localforage.getItem("events");
          eventsByFollowedUsers = await localforage.getItem(
            "eventsByFollowedUsers"
          );

          if (Array.isArray(events) && events.length) {
            hasEvents = true;
          }

          if (
            Array.isArray(eventsByFollowedUsers) &&
            eventsByFollowedUsers.length
          ) {
            hasEvents = true;
          }

          if (!hasEvents) {
            return (window.location.href = "../events/needed/");
          } else {
            resolve();
          }
        })
        .catch((err) => {
          if (
            err === "event sync timed out" ||
            err === "sync failed because user is offline"
          ) {
            return (window.location.href = "../events/needed/");
          } else {
            console.error(err);
          }
        });
    });
  } else {
    return new Promise((resolve, reject) => {
      resolve();
      syncEvents();
    });
  }
}

function clearForm() {
  window.addEventListener("pageshow", () => {
    const form = document.querySelector("#formsendinvite");
    form.reset();
  });
}

function enableWebShareAPI() {
  const supportsWebShareAPI = !!navigator.share || false; // TURNING OFF WEB SHARE API FOR

  if (supportsWebShareAPI) {
    document
      .querySelector("#sendvia option[value='otherapps']")
      .classList.remove("d-none");
  }
}

function downloadCanvasAsImage() {
  let downloadLink = document.createElement("a");
  downloadLink.setAttribute("download", "CanvasAsImage.png");
  let canvas = document.getElementById("myCanvas");
  let dataURL = canvas.toDataURL("image/png");
  let url = dataURL.replace(
    /^data:image\/png/,
    "data:application/octet-stream"
  );
  downloadLink.setAttribute("href", url);
  downloadLink.click();
}

async function eventDetails() {
  const eventEl = document.querySelector("#events_dropdown");
  const meetingdetails = document.querySelector("#meetingdetails");
  const meetingDetailsContainer = document.querySelector(
    "#meetingDetailsContainer"
  );
  const meetingdetails_timedate = document.querySelector(
    "#meetingdetails_timedate"
  );
  const meetingdetails_location = document.querySelector(
    "#meetingdetails_location"
  );
  const selectedEvent = eventEl.selectedOptions[0];
  const events = await localforage.getItem("events");
  const eventsByFollowedUsers = await localforage.getItem(
    "eventsByFollowedUsers"
  );
  const eventid = eventEl.selectedOptions[0].value;

  if (eventid === "") {
    localStorage.setItem("lastEventSelected", "");
    meetingDetailsContainer.classList.add("d-none");
    return;
  }

  let event = [];

  // Try user's events
  event = Array.isArray(events)
    ? events.filter((item) => item.eventid == eventid)
    : [];

  // Try followed users' events
  if (!event.length) {
    event = Array.isArray(eventsByFollowedUsers)
      ? eventsByFollowedUsers.filter((item) => item.eventid == eventid)
      : [];
  }

  // If dropdown still does not match events in IndexedDB
  if (!event.length) {
    console.error(`Event for eventid ${eventid} not found`);
    return;
  }

  const {
    locationname = "",
    locationaddressline1 = "",
    locationaddressline2 = "",
    locationaddressline3 = "",
  } = event[0];

  eventDateTime = await showEventDateTime(event[0]);

  populateQrCode();

  if (selectedEvent.value === "") return meetingdetails.classList.add("d-none");
  localStorage.setItem("lastEventSelected", Number(selectedEvent.value));
  meetingdetails_timedate.innerHTML = `${eventDateTime}`;
  meetingdetails_location.innerHTML = `
    ${!!locationname && locationname.length ? locationname : ""}
    ${
      !!locationaddressline1 && locationaddressline1.length
        ? "<br>" + locationaddressline1
        : ""
    }
    ${
      !!locationaddressline2 && locationaddressline2.length
        ? "<br>" + locationaddressline2
        : ""
    }
    ${
      !!locationaddressline3 && locationaddressline3.length
        ? "<br>" + locationaddressline3
        : ""
    }
  `;
  meetingdetails.classList.remove("d-none");
  meetingDetailsContainer.classList.remove("d-none");
}

async function getCoordinatesOnLoad() {
  if (navigator.permissions) {
    await navigator.permissions
      .query({ name: "geolocation" })
      .then((response) => {
        if (response.state && response.state == "granted") {
          navigator.geolocation.getCurrentPosition(
            onGeoLocationSuccess,
            onGeoLocationError,
            geoLocationOptions
          );
        }
      });
  }
}

function getOtherAppsBodyText() {
  const text = localStorage.getItem("bodyTextOtherApps") || "";
  return text;
}

function getEmailBodyText() {
  const text = localStorage.getItem("bodyTextEmail") || "";
  return text;
}

function getEmailSubjectLine() {
  const eventName = getInviteToText();
  const text =
    localStorage.getItem("subjectLineEmail") ||
    `${getPhrase("invitationto")} ${eventName}`;
  return encodeURI(text);
}

function getFinalURL() {
  const eventId = getInviteToId();
  const userId = getUserId();
  const recipientId = getRecipientId();
  const finalUrl = `${window.location.origin}/i/${eventId}/${userId}/${recipientId}`;

  recipientIdGlobal = recipientId;
  return finalUrl;
}

function getInviteToId() {
  const inviteTo =
    document.querySelector("#events_dropdown").selectedOptions[0].value;
  return inviteTo;
}

function getInviteToText() {
  const inviteTo =
    document.querySelector("#events_dropdown").selectedOptions[0].innerText;
  return inviteTo;
}

function getRecipientId(numChars = 5) {
  const chars =
    "1234567890" + "abcdefghijklmnopqrstuvwxyz" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const charsLen = chars.length;
  const id = [];
  for (let i = 0; i < numChars; i++) {
    id.push(chars[Math.round(Math.random() * 100) % charsLen]);
  }
  const recipientId = id.join("");
  return recipientId;
}

function getSendBody() {
  const sendVia = getSendVia() || "";
  const finalURL = getFinalURL() || "";
  const inviteToText = getInviteToText() || "";
  const clickBelow = getPhrase("clickBelow");
  const smsBodyText = getSmsBodyText() || "";
  const emailBodyText = getEmailBodyText() || "";
  const otherAppsBodyText = getOtherAppsBodyText() || "";
  let sendBody = "";

  switch (sendVia) {
    case "sms":
      sendBody = `${inviteToText} ${clickBelow}\r\n\r\n${finalURL}`;
      if (smsBodyText.length) {
        sendBody += `\r\n\r\n${smsBodyText}`;
      }
      break;
    case "email":
      sendBody = `${inviteToText}:\r\n\r\n${finalURL}`;
      if (emailBodyText.length) {
        sendBody += `\r\n\r\n${emailBodyText}\r\n\r\n`;
      }
      break;
    case "otherapps":
      sendBody = `${inviteToText}:\r\n`;
      if (otherAppsBodyText.length) {
        sendBody += otherAppsBodyText;
      }
      return sendBody;
    default:
      return;
  }

  return encodeURIComponent(sendBody);
}

function getSendTo() {
  const sendVia = getSendVia();
  let sendTo;
  switch (sendVia) {
    case "sms":
      sendTo = iti.getNumber();
      break;
    case "email":
      sendTo = document
        .querySelector("#sendto_email")
        .value.trim()
        .toLowerCase();
      break;
    default:
      break;
  }
  return sendTo;
}

function getSendVia() {
  const value = document.querySelector("#sendvia").selectedOptions[0].value;
  return value;
}

function getSmsBodyText() {
  const text = localStorage.getItem("bodyTextSms") || "";
  return text;
}

function getUserId() {
  const userId =
    JSON.parse(atob(localStorage.getItem("refreshToken").split(".")[1]))
      .userid || "";
  return userId;
}

function initIntlTelInput() {
  const input = document.querySelector("#sendto_sms");
  const initialCountry = localStorage.getItem("countryIso") || "us";
  iti = window.intlTelInput(input, {
    initialCountry: initialCountry,
    preferredCountries: [initialCountry],
    showOnly: [initialCountry],
    utilsScript: "../js/intl-tel-input-17.0.0/js/utils.js",
  });
}

function loadDummyEvents() {
  const events = [
    {
      id: 1,
      type: "Bible Talk",
      name: "Bible Talk",
      day: "Fridays",
      time: "7:30 PM",
      location: "Starbucks",
      address1: "555 Main Street",
      address2: "",
      address3: "Phoenix, AZ 99999",
    },
    {
      id: 2,
      type: "Church",
      name: "Church",
      day: "Sundays",
      time: "10:00 AM",
      location: "SDA",
      address1: "5555 Camelback Road",
      address2: "Suite 5",
      address3: "Scottsdale, AZ 99999",
    },
  ];

  return JSON.stringify(events);
}

async function loadEvents() {
  const events_dropdown = document.querySelector("#events_dropdown");
  const meetingdetails = document.querySelector("#meetingdetails");
  const meetingdetailsContainer = document.querySelector(
    "#meetingDetailsContainer"
  );
  const lastEventSelected = localStorage.getItem("lastEventSelected") || "";

  const events = await localforage.getItem("events");
  const eventsByFollowedUsers = await localforage.getItem(
    "eventsByFollowedUsers"
  );
  const followedUsers = await localforage.getItem("followedUsers");

  return new Promise((resolve, reject) => {
    const hasOwnEvents = Array.isArray(events) && events.length > 0;
    const hasEventsByFollowedUsers =
      Array.isArray(eventsByFollowedUsers) && eventsByFollowedUsers.length > 0;
    const hasListOfFollowedUsers =
      Array.isArray(followedUsers) && followedUsers.length > 0;

    if (!hasOwnEvents && !hasEventsByFollowedUsers) {
      reject(new Error("no events in IndexedDB"));
    }

    if (hasEventsByFollowedUsers && !hasListOfFollowedUsers) {
      reject(new Error("no followed users in IndexedDB"));
    }

    let optionsHTML = `
      <option value="">
        ${getPhrase("dropdownDefault")}
      </option>
    `;

    if (hasOwnEvents && !hasEventsByFollowedUsers) {
      events.forEach((e) => {
        optionsHTML += `<option value="${e.eventid}">${e.title}</option>`;
      });
    } else if (!hasOwnEvents && hasEventsByFollowedUsers) {
      followedUsers.forEach((followedUser) => {
        const { userid, firstname, lastname } = followedUser;
        const eventsByFollowedUser = eventsByFollowedUsers.filter(
          (e) => e.createdBy === userid
        );
        let followedUserHTML = "";
        followedUserHTML = `<optgroup label="${firstname} ${lastname}" data-userid="${userid}">`;
        eventsByFollowedUser.forEach((e) => {
          if (e.eventid === lastEventSelected) {
            followedUserHTML += `<option value="${e.eventid}" selected>${e.title}</option>`;
          } else {
            followedUserHTML += `<option value="${e.eventid}">${e.title}</option>`;
          }
        });
        followedUserHTML += `</optgroup>`;
        optionsHTML += followedUserHTML;
      });
    } else if (hasOwnEvents && hasEventsByFollowedUsers) {
      let myEventsHTML = "";
      const { firstname, lastname } = JSON.parse(
        atob(localStorage.getItem("refreshToken").split(".")[1])
      );
      myEventsHTML = `<optgroup label="${firstname} ${lastname}">`;
      events.forEach((e) => {
        myEventsHTML += `<option value="${e.eventid}">${e.title}</option>`;
      });
      myEventsHTML += `</optgroup>`;
      optionsHTML += myEventsHTML;

      followedUsers.forEach((followedUser) => {
        const { userid, firstname, lastname } = followedUser;
        const eventsByFollowedUser = eventsByFollowedUsers.filter(
          (e) => e.createdBy === userid
        );
        let followedUserHTML = "";
        followedUserHTML = `<optgroup label="${firstname} ${lastname}" data-userid="${userid}">`;
        eventsByFollowedUser.forEach((e) => {
          if (e.eventid === lastEventSelected) {
            followedUserHTML += `<option value="${e.eventid}" selected>${e.title}</option>`;
          } else {
            followedUserHTML += `<option value="${e.eventid}">${e.title}</option>`;
          }
        });
        followedUserHTML += `</optgroup>`;
        optionsHTML += followedUserHTML;
      });
    }

    events_dropdown.innerHTML = optionsHTML;

    const matchedOption = events_dropdown.querySelector(
      `option[value="${lastEventSelected}"]`
    );
    if (matchedOption) {
      matchedOption.selected = true;
    } else {
      events_dropdown.options[0].selected = true;
      localStorage.removeItem("lastEventSelected");
    }

    document
      .querySelector("#events_dropdown")
      .addEventListener("change", () => eventDetails(null, null));

    resolve();
  });
}

async function onAfterSubmitted(sendvia) {
  const modalFooter = document.querySelector(".modal-footer");
  modalFooter.classList.remove("d-none");

  resetSendButtonText();

  // Set content of modal
  let modalContent;
  if (sendvia === "qrcode") {
    modalContent = `
      ${getPhrase("afterSentParagraph1QRCode")}
      <p class="mt-4">
        <hr class="my-3" />
        <strong>${getPhrase("problemsScanning")}</strong> &nbsp; 
        ${getPhrase("problemsScanningSuggestion")}
      </p>
    `;
  } else if (sendvia === "otherapps") {
    modalContent = `
      ${getPhrase("afterSentParagraph1OtherApps")}
      <p class="mt-4">
        <hr class="my-3" />
        <strong>${getPhrase("problemsSending")}</strong> &nbsp; 
        ${getPhrase("problemsSendingSuggestion")}
      </p>
    `;
  } else {
    modalContent = `
      ${getPhrase("afterSentParagraph1")}
      <p class="mt-4">
        <hr class="my-3" />
        <strong>${getPhrase("problemsSending")}</strong> &nbsp; 
        ${getPhrase("problemsSendingSuggestion")}
      </p>
    `;
  }

  // Save to localStorage, try to sync, then show modal
  const txtInviteRecorded = getPhrase("inviteRecorded");
  const txtBtnRetry = getPhrase("btnRetry");
  saveAndSync()
    .then(() => {
      showModal(modalContent, txtInviteRecorded, "static");
    })
    .catch(() => {
      // TODO:  Handle failed sync here, if necessary
      showModal(modalContent, txtInviteRecorded, "static");
    });
}

function onFinish() {
  window.location.href = "../";
}

function onGeoLocationError(err) {
  switch (err) {
    case 1:
      showToast(getPhrase("geocoordinatesPermissionDenied"));
      break;
    case 2:
      showToast(getPhrase("geocoordinatesPermissionUnavailable"));
      break;
    case 3:
      showToast(getPhrase("geocoordinatesPermissionTimedOut"));
      break;
    default:
      showToast(`${getPhrase("geocoordinatesErrorCode")} ${err}`);
  }
}

function onGeoLocationSuccess(pos) {
  const { latitude, longitude } = pos.coords;

  coordinates = {
    lat: latitude,
    long: longitude,
    timestamp: pos.timestamp,
  };

  // showToast(`<a href="https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}">${latitude}, ${longitude}</a>`);
}

function onSendViaChanged() {
  clearErrorMessages();
  selectSendVia();
}

function onSubmit(e) {
  e.preventDefault();
  const sendVia = getSendVia();

  clearErrorMessages();

  if (sendVia !== "qrcode") {
    const btnSendInvite = document.querySelector("#btnSendInvite");
    btnSendInvite.click();
  }
}

async function onSubmitButtonClick(e) {
  const sendVia = getSendVia();
  const btnSendInvite = document.querySelector("#btnSendInvite");
  const sendTo = getSendTo();
  const sendBody = getSendBody();
  const emailSubjectLine = getEmailSubjectLine();
  const recipientName =
    document.querySelector("#recipientname").value.trim() || "";

  clearErrorMessages();

  if (recipientName === "") {
    const msg = getPhrase("recipientNameRequired");
    const msgInline = getPhrase("fieldRequired");
    e.preventDefault();
    return showError(msg, "#recipientname", msgInline);
  }

  switch (sendVia) {
    case "sms":
      const phoneNumber = iti.getNumber();
      const isPhoneNumberValid = iti.isValidNumber();

      if (phoneNumber === "") {
        const msg = getPhrase("phoneNumberIsRequired");
        const msgInline = getPhrase("fieldRequired");
        const inputEl = document.querySelector(".iti--allow-dropdown");
        const errorContainer = document.createElement("div");
        errorContainer.classList.add("invalid-feedback");
        inputEl.appendChild(errorContainer);
        e.preventDefault();
        return showError(msg, "#sendto_sms", msgInline);
      }

      if (!isPhoneNumberValid) {
        const msg = getPhrase("phoneNumberMustBeValid");
        const msgInline = getPhrase("validPhoneNumberIsRequired");
        const inputEl = document.querySelector(".iti--allow-dropdown");
        const errorContainer = document.createElement("div");
        errorContainer.classList.add("invalid-feedback");
        inputEl.appendChild(errorContainer);
        e.preventDefault();
        return showError(msg, "#sendto_sms", msgInline);
      }

      btnSendInvite.setAttribute("href", `sms:${sendTo};?&body=${sendBody}`);

      showForwardingMessage("sms");

      setTimeout(() => {
        onAfterSubmitted("sms");
      }, 5000);

      break;
    case "email":
      const email = document.querySelector("#sendto_email").value.trim() || "";
      const isValidEmail = validateEmail(email);

      if (email === "") {
        const msg = getPhrase("emailIsRequired");
        const msgInline = getPhrase("fieldRequired");
        e.preventDefault();
        return showError(msg, "#sendto_email", msgInline);
      }

      if (!isValidEmail) {
        const msg = getPhrase("emailMustBeValid");
        const msgInline = getPhrase("validEmailIsRequired");
        e.preventDefault();
        return showError(msg, "#sendto_email", msgInline);
      }

      btnSendInvite.setAttribute(
        "href",
        `mailto:${sendTo}?subject=${emailSubjectLine}&body=${sendBody}`
      );

      showForwardingMessage("email");

      setTimeout(() => {
        onAfterSubmitted("email");
      }, 5000);

      break;
    case "otherapps":
      const url = getFinalURL();

      const shareData = {
        title: decodeURI(emailSubjectLine),
        text: sendBody,
        url: url,
      };

      try {
        e.preventDefault();
        navigator.share(shareData).then(() => {
          setTimeout(() => {
            onAfterSubmitted("otherapps");
          }, 5000);
        });
      } catch (err) {
        console.error(err);
      }

      break;
    default:
      e.preventDefault();
      onAfterSubmitted("qrcode");
  }
}

function onTagWithLocation(e) {
  const isChecked = e.target.checked || false;

  if (isChecked && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      onGeoLocationSuccess,
      onGeoLocationError,
      geoLocationOptions
    );
  }
}

async function populateEvents() {
  //
}

function populateQrCode() {
  const el = document.querySelector("#qrcode");
  const availableWidth = el.clientWidth;
  const maxWidth = 200;
  const width = availableWidth > maxWidth ? maxWidth : availableWidth;
  const url = getFinalURL();

  return new Promise((resolve, reject) => {
    const qr = new QRious({
      element: document.getElementById("qr"),
      value: url,
      size: width,
    });
    resolve(qr);
  });
}

function populateSaveButtonData() {
  const btnSendInvite = document.querySelector("#btnSendInvite");
  btnSendInvite.setAttribute("data-defaulttext", getPhrase("buttonsendinvite"));
  btnSendInvite.setAttribute("data-qrcodetext", getPhrase("buttonsaveinvite"));
  btnSendInvite.setAttribute(
    "data-otherappstext",
    getPhrase("buttonsendinvite")
  );
}

async function resetSendButtonText() {
  const sendButton = document.querySelector("#btnSendInvite");
  const sendvia = getSendVia();

  switch (sendvia) {
    case "qrcode":
      sendButton.innerText = getPhrase("buttonsaveinvite");
      break;
    case "otherapps":
      sendButton.innerText = getPhrase("buttonsendinvite");
      break;
    default:
      sendButton.innerText = getPhrase("buttonsendinvite");
      break;
  }
}

function selectSendVia(method) {
  const containerSms = document.querySelector("#containerSendToSms");
  const containerEmail = document.querySelector("#containerSendToEmail");
  const containerQRCode = document.querySelector("#containerSendToQRCode");
  const containerQRCodeInstructions = document.querySelector(
    "#containerQRCodeInstructions"
  );
  const containerTagWithLocation = document.querySelector(
    "#containerTagWithLocation"
  );
  const btnSendInvite = document.querySelector("#btnSendInvite");
  const smsField = document.querySelector("#sendto_sms");
  const emailField = document.querySelector("#sendto_email");
  const sendvia = method ? method : getSendVia();
  const isMobile = isMobileDevice();

  containerSms.classList.add("d-none");
  containerEmail.classList.add("d-none");
  containerQRCode.classList.add("d-none");
  containerQRCodeInstructions.classList.add("d-none");
  containerTagWithLocation.classList.add("d-none");
  smsField.removeAttribute("required");
  emailField.removeAttribute("required");

  switch (sendvia) {
    case "sms":
      smsField.setAttribute("required", "");
      localStorage.setItem("lastSendMethodSelected", "sms");
      containerSms.classList.remove("d-none");
      isMobile && containerTagWithLocation.classList.remove("d-none");
      btnSendInvite.innerHTML = btnSendInvite.getAttribute("data-defaulttext");
      break;
    case "email":
      emailField.setAttribute("required", "");
      localStorage.setItem("lastSendMethodSelected", "email");
      containerEmail.classList.remove("d-none");
      isMobile && containerTagWithLocation.classList.remove("d-none");
      btnSendInvite.innerHTML = btnSendInvite.getAttribute("data-defaulttext");
      break;
    case "qrcode":
      localStorage.setItem("lastSendMethodSelected", "qrcode");
      containerQRCode.classList.remove("d-none");
      containerQRCodeInstructions.classList.remove("d-none");
      btnSendInvite.innerHTML = btnSendInvite.getAttribute("data-qrcodetext");
      isMobile && containerTagWithLocation.classList.remove("d-none");
      populateQrCode().then((obj) => {
        let downloadLink = document.createElement("a");
        downloadLink.setAttribute("download", "invite-qrcode.png");
        const dataURL = obj.toDataURL();
        const url = dataURL.replace(
          /^data:image\/png/,
          "data:application/octet-stream"
        );
        downloadLink.setAttribute("href", url);
        const canvas = document.querySelector("#qr");
        canvas.addEventListener("click", () => downloadLink.click());

        const linkHowToScan = document.querySelector("a[href='#howtoscan']");
        linkHowToScan.addEventListener("click", (e) => {
          e.preventDefault();
          const instructionsShort = document.querySelector(
            "[data-i18n='instructionsShort']"
          );
          const instructionsLong = document.querySelector(
            "[data-i18n='instructionsLong']"
          );
          instructionsShort.classList.add("d-none");
          instructionsLong.classList.remove("d-none");
        });
      });
      if (!method) {
        /* const qrCodeContainerOffset =
          document.getElementById("containerSendToQRCode").offsetTop - 80;
        window.scroll({ top: qrCodeContainerOffset, behavior: "smooth" }); */
      }
      break;
    case "otherapps":
      localStorage.setItem("lastSendMethodSelected", "otherapps");
      isMobile && containerTagWithLocation.classList.remove("d-none");
      btnSendInvite.innerHTML =
        btnSendInvite.getAttribute("data-otherappstext");
      break;
  }
}

function saveAndSync() {
  return new Promise((resolve, reject) => {
    let syncSucceeded = true;

    // TODO:  SAVE ALL INVITE DATA TO LOCAL STORAGE
    // TODO:  ATTEMPT TO SYNC
    // TODO:  USE A TIMEOUT ABORT IN CASE SYNCING TAKES TOO LONG

    if (syncSucceeded) {
      resolve();
    } else {
      reject();
    }
  });
}

function setDefaultSendMethod() {
  const defaultSendMethod = "sms";
  const lastSendMethodSelected =
    localStorage.getItem("lastSendMethodSelected") || "";

  if (lastSendMethodSelected.length) {
    document.querySelector("#sendvia").value = lastSendMethodSelected;
    selectSendVia(lastSendMethodSelected);
  } else {
    document.querySelector("#sendvia").value = defaultSendMethod;
    selectSendVia(defaultSendMethod);
  }
}

function showError(
  msg,
  selector,
  inlineMsg,
  modalSelector = "#modalFormErrors"
) {
  const formIncomplete = getPhrase("formIncomplete");

  formErrorsReset();

  if (selector) {
    if (inlineMsg) {
      formError(selector, inlineMsg);
    } else {
      formError(selector);
    }
  }

  showModal(msg, formIncomplete, "true", modalSelector);
}

function showForwardingMessage(sendvia) {
  if (!["sms", "email"].includes(sendvia)) return;
  const btnSendInvite = document.querySelector("#btnSendInvite");

  switch (sendvia) {
    case "sms":
      btnSendInvite.innerText = getPhrase("openingsms");
      break;
    case "email":
      btnSendInvite.innerText = getPhrase("openingemail");
      break;
  }

  btnSendInvite.setAttribute("disabled", true);
}

function showTagInviteWithLocation() {
  const isMobile = isMobileDevice();
  if (isMobile) {
    const containerTagWithLocation = document.querySelector(
      "#containerTagWithLocation"
    );
    containerTagWithLocation.classList.remove("d-none");
  }
}

function setEventListeners() {
  document
    .querySelector("#sendvia")
    .addEventListener("change", onSendViaChanged);
  document
    .querySelector("#events_dropdown")
    .addEventListener("change", () => eventDetails(null, null));
  document
    .querySelector("#tagwithlocation")
    .addEventListener("click", onTagWithLocation);
  document
    .querySelector("#btnSendInvite")
    .addEventListener("click", onSubmitButtonClick);
  document
    .querySelector("#formsendinvite")
    .addEventListener("submit", onSubmit);
  document.querySelector("#btnFinish").addEventListener("click", onFinish);
  window.addEventListener("pageshow", (event) => {
    onSendViaChanged();
    if (event.persisted) {
      console.log("Page was restored from the bfcache");
    }
  });
}

async function init() {
  await checkForEvents();
  clearForm();
  await populateContent();
  // enableWebShareAPI();    // TURNING OFF WEB SHARE API FOR NOW
  populateSaveButtonData();
  await loadEvents();
  initIntlTelInput();
  setEventListeners();
  eventDetails();
  getCoordinatesOnLoad();
  showTagInviteWithLocation();
  globalHidePageSpinner();
  setDefaultSendMethod();
}

init();
