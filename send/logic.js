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
  const supportsWebShareAPI = !!navigator.share || false; // TURNING OFF WEB SHARE API FOR NOW

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
  const qrcode = document.querySelector("#containerSendToQRCode");
  const qrcodeInstructions = document.querySelector(
    "#containerQRCodeInstructions"
  );
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
  const events = await localforage.getItem("events");
  const eventsByFollowedUsers = await localforage.getItem(
    "eventsByFollowedUsers"
  );

  localStorage.setItem("lastEventSelected", "");

  const eventid = getInviteToId();
  const sendVia = getSendVia();

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
    if (eventid && Number(eventid) >= 0) {
      console.error(`Event for eventid ${eventid} not found`);
    }
    localStorage.setItem("lastEventSelected", "");
    meetingDetailsContainer.classList.add("d-none");
    qrcode.classList.add("d-none");
    qrcodeInstructions.classList.add("d-none");
    return;
  }

  const {
    locationname = "",
    locationaddressline1 = "",
    locationaddressline2 = "",
    locationaddressline3 = "",
  } = event[0];

  eventDateTime = await showEventDateTime(event[0]);

  if (eventid.value === "") {
    meetingdetails.classList.add("d-none");
    qrcode.classList.add("d-none");
    qrcodeInstructions.add("d-none");
    return;
  }

  localStorage.setItem("lastEventSelected", Number(eventid));
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

  if (sendVia === "qrcode") {
    let okToShowQRCode = true;
    if (sendVia !== "qrcode") okToShowQRCode = false;
    if (!eventid.length || Number(eventid) <= 0) okToShowQRCode = false;

    if (okToShowQRCode) {
      qrcode.classList.remove("d-none");
      qrcodeInstructions.classList.remove("d-none");
      meetingDetailsContainer.classList.remove("d-none");
    } else {
      qrcode.classList.add("d-none");
      qrcodeInstructions.classList.add("d-none");
      meetingDetailsContainer.classList.add("d-none");
    }
    const qrCodeObject = await populateQrCode();
    /* const url = qrCodeObject._value;
    const canvas = document.querySelector("#qr");
    canvas.addEventListener("click", () => onQRCodeClick(url)); */
  }
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

function getPlaceholderData() {
  const recipientName = document.querySelector("#recipientname").value.trim();
  const eventName = getInviteToText().trim();

  return {
    recipientName: recipientName,
    eventName: eventName,
  };
}

function getSmsBodyText() {
  const placeholderData = getPlaceholderData();
  const bodyText = getBodyText(placeholderData);
  return bodyText;
}

function getEmailBodyText() {
  const placeholderData = getPlaceholderData();
  const bodyText = getBodyText(placeholderData);
  return bodyText;
}

function getOtherAppsBodyText() {
  const placeholderData = getPlaceholderData();
  const bodyText = getBodyText(placeholderData);
  return bodyText;
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
  const recipientId = recipientIdGlobal.length
    ? recipientIdGlobal
    : getRecipientId();
  const finalUrl =
    window.location.hostname === "localhost"
      ? `${window.location.origin}/i/#/${eventId}/${userId}/${recipientId}`
      : `${window.location.origin}/i/${eventId}/${userId}/${recipientId}`;
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

async function getSendBody() {
  const sendVia = getSendVia() || "";
  const finalURL = getFinalURL() || "";
  const inviteToText = getInviteToText() || "";
  const clickBelow = getPhrase("clickBelow");
  const smsBodyText = getSmsBodyText();
  const emailBodyText = getEmailBodyText();
  const otherAppsBodyText = getOtherAppsBodyText();
  let sendBody = "";

  switch (sendVia) {
    case "sms":
      sendBody = `${inviteToText} ${clickBelow} \r\n\r\n${finalURL}`;
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
          if (e.eventid == lastEventSelected) {
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
          if (e.eventid == lastEventSelected) {
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

    const matchedOption =
      lastEventSelected !== ""
        ? events_dropdown.querySelector(`option[value="${lastEventSelected}"]`)
        : null;
    if (matchedOption) {
      matchedOption.selected = true;
    } else {
      events_dropdown.options[0].selected = true;
      localStorage.removeItem("lastEventSelected");
    }

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

  const txtInviteRecorded = getPhrase("inviteRecorded");

  showModal(modalContent, txtInviteRecorded, "static");
}

function onFinish() {
  window.location.href = "../";
}

function onGeoLocationError(err) {
  switch (err) {
    case 1:
      console.log(getPhrase("geocoordinatesPermissionDenied"));
      break;
    case 2:
      console.log(getPhrase("geocoordinatesPermissionUnavailable"));
      break;
    case 3:
      console.log(getPhrase("geocoordinatesPermissionTimedOut"));
      break;
    default:
      console.log(err);
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

function onHowToScanClick(e) {
  e.preventDefault();
  const instructionsShort = document.querySelector(
    "[data-i18n='instructionsShort']"
  );
  const instructionsLong = document.querySelector(
    "[data-i18n='instructionsLong']"
  );
  instructionsShort.classList.add("d-none");
  instructionsLong.classList.remove("d-none");
}

function onQRCodeClick(url) {
  const phrase = getPhrase("linkCopied");
  navigator.clipboard.writeText(url);
  showToast(phrase, 2000);
  return;
}

async function onSendViaChanged() {
  clearErrorMessages();
  const url = getFinalURL();
  const sendVia = getSendVia();
  const eventid = getInviteToId();
  const containerSendToQRCode = document.querySelector(
    "#containerSendToQRCode"
  );
  const containerQRCodeInstructions = document.querySelector(
    "#containerQRCodeInstructions"
  );
  let okToShowQRCode = true;
  if (sendVia !== "qrcode") okToShowQRCode = false;
  if (!eventid || Number(eventid) <= 0) okToShowQRCode = false;
  if (okToShowQRCode) {
    containerSendToQRCode.classList.remove("d-none");
    containerQRCodeInstructions.classList.remove("d-none");
    await populateQrCode(url);
  } else {
    containerSendToQRCode.classList.add("d-none");
    containerQRCodeInstructions.classList.add("d-none");
  }
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
  const events_dropdown = document.querySelector("#events_dropdown");
  const eventid = events_dropdown.selectedOptions[0].value;

  clearErrorMessages();

  console.log(getFinalURL());

  if (eventid === "") {
    const msg = getPhrase("eventIsRequired");
    const msgInline = getPhrase("fieldRequired");
    e.preventDefault();
    return showError(msg, "#events_dropdown", msgInline);
  }

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

      saveAndSync(sendVia);

      btnSendInvite.setAttribute("href", `sms:${sendTo};?&body=${sendBody}`);

      showForwardingMessage(sendVia);

      await sleep(2000);

      setTimeout(() => {
        globalHidePageSpinner();
        onAfterSubmitted(sendVia);
      }, 2000);

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

      saveAndSync(sendVia);

      btnSendInvite.setAttribute(
        "href",
        `mailto:${sendTo}?subject=${emailSubjectLine}&body=${sendBody}`
      );

      showForwardingMessage(sendVia);

      await sleep(2000);

      setTimeout(() => {
        globalHidePageSpinner();
        onAfterSubmitted(sendVia);
      }, 2000);

      break;
    case "otherapps":
      const url = getFinalURL();

      const shareData = {
        title: decodeURI(emailSubjectLine),
        text: sendBody,
        url: url,
      };

      saveAndSync(sendVia);

      try {
        e.preventDefault();
        navigator.share(shareData).then(() => {
          globalShowPageSpinner();
          setTimeout(() => {
            globalHidePageSpinner();
            onAfterSubmitted(sendVia);
          }, 2000);
        });
      } catch (err) {
        console.error(err);
      }

      break;
    default:
      // Probably a QR Code
      e.preventDefault();
      globalShowPageSpinner();
      saveAndSync(sendVia);
      setTimeout(() => {
        globalHidePageSpinner();
        onAfterSubmitted(sendVia);
      }, 2000);
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

function populateQrCode() {
  return new Promise(async (resolve, reject) => {
    const containerSendToQRCode = document.querySelector(
      "#containerSendToQRCode"
    );
    const containerQRCodeInstructions = document.querySelector(
      "#containerQRCodeInstructions"
    );
    const sendvia = getSendVia();
    const eventid = getInviteToId();
    const availableWidth = document.querySelector("#qrcode").clientWidth;
    const maxWidth = 200;
    const width = availableWidth > maxWidth ? maxWidth : availableWidth;
    const url = getFinalURL();
    const qr = new QRious({
      element: document.getElementById("qr"),
      value: url,
      size: width,
    });
    let okToShowQRCode = true;
    if (sendvia !== "qrcode") okToShowQRCode = false;
    if (!eventid || Number(eventid) <= 0) okToShowQRCode = false;
    if (okToShowQRCode) {
      containerSendToQRCode.classList.remove("d-none");
      containerQRCodeInstructions.classList.remove("d-none");
    } else {
      containerSendToQRCode.classList.add("d-none");
      containerQRCodeInstructions.classList.add("d-none");
    }
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

function prepopulateInvite() {
  const myInterval = setInterval(() => {
    const inviteRecipientJSON = sessionStorage.getItem("inviteRecipientObj");

    const clearInviteRecipientJSON = () => {
      sessionStorage.removeItem("inviteRecipientObj");
    };

    if (!inviteRecipientJSON) {
      clearInterval(myInterval);
      return;
    }

    const inviteRecipientObj = JSON.parse(inviteRecipientJSON);
    const { name, email, sms, sendvia } = inviteRecipientObj;

    const eventsDropdownEl = document.querySelector("#events_dropdown");
    const meetingDetailsEl = document.querySelector("#meetingDetailsContainer");
    const nameEl = document.querySelector("#recipientname");

    if (!eventsDropdownEl) return;
    if (eventsDropdownEl.options.length <= 1) return;
    if (!meetingDetailsEl) return;
    if (!nameEl) return;
    if (!name) return;
    if (!sendvia) return;
    if (!email && !sms) return;

    // Set events to unselected
    eventsDropdownEl.selectedOptions[0].selected = true;
    meetingDetailsEl.classList.add("d-none");

    // Populate name
    nameEl.value = name;

    // Populate contact method
    if (email) {
      const emailEl = document.querySelector("#sendto_email");
      if (!emailEl) return;
      emailEl.value = email;
      selectSendVia("email");
    } else if (sms) {
      const smsEl = document.querySelector("#sendto_sms");
      if (!smsEl) return;
      smsEl.value = sms;
      selectSendVia("sms");
    } else if (sendvia === "qrcode") {
      selectSendVia("qrcode");
    }

    clearInviteRecipientJSON();
    clearInterval(myInterval);
  }, 250);
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
      document.querySelector("#sendvia").value = "sms";
      break;
    case "email":
      emailField.setAttribute("required", "");
      localStorage.setItem("lastSendMethodSelected", "email");
      containerEmail.classList.remove("d-none");
      isMobile && containerTagWithLocation.classList.remove("d-none");
      btnSendInvite.innerHTML = btnSendInvite.getAttribute("data-defaulttext");
      document.querySelector("#sendvia").value = "email";
      break;
    case "qrcode":
      const eventid = getInviteToId();
      localStorage.setItem("lastSendMethodSelected", "qrcode");
      btnSendInvite.innerHTML = btnSendInvite.getAttribute("data-qrcodetext");
      if (eventid.length) {
        containerQRCode.classList.remove("d-none");
        containerQRCodeInstructions.classList.remove("d-none");
        isMobile && containerTagWithLocation.classList.remove("d-none");
      } else {
        containerQRCode.classList.add("d-none");
        containerQRCodeInstructions.classList.add("d-none");
      }
      document.querySelector("#sendvia").value = "qrcode";
      break;
    case "otherapps":
      localStorage.setItem("lastSendMethodSelected", "otherapps");
      isMobile && containerTagWithLocation.classList.remove("d-none");
      btnSendInvite.innerHTML =
        btnSendInvite.getAttribute("data-otherappstext");
      document.querySelector("#sendvia").value = "otherapps";
      break;
  }
}

function saveAndSync(sendvia) {
  return new Promise(async (resolve, reject) => {
    const eventid = Number(
      document.querySelector("#events_dropdown").selectedOptions[0].value
    );
    const recipientName = document.querySelector("#recipientname").value || "";
    const recipientSms = sendvia === "sms" ? iti.getNumber() : null;
    const recipientEmail =
      sendvia === "email"
        ? document.querySelector("#sendto_email").value
        : null;
    const timezone = moment.tz.guess();
    const invitedAtUtcTime = moment.utc().format();
    const tagWithLocationCheckbox = document.querySelector("#tagwithlocation");
    const okToUseCoordinates = tagWithLocationCheckbox?.checked ? true : false;
    const coords = okToUseCoordinates && coordinates ? coordinates : null;

    const invite = {
      eventid: eventid,
      sentvia: sendvia,
      coords: coords,
      utctime: invitedAtUtcTime,
      timezone: timezone,
      recipient: {
        id: recipientIdGlobal,
        name: recipientName,
        sms: recipientSms,
        email: recipientEmail,
      },
    };

    const unsyncedInvite = {
      eventid: eventid,
      sentvia: sendvia,
      coords: coords,
      utctime: invitedAtUtcTime,
      timezone: timezone,
      recipient: {
        id: recipientIdGlobal,
        name: recipientName,
        sms: null,
        email: null,
      },
    };

    // Encrypt recipient's contact information
    const datakey = localStorage.getItem("datakey");
    const encryptedSms = recipientSms
      ? await invitesCrypto.encrypt(datakey, recipientSms)
      : null;
    const encryptedEmail = recipientEmail
      ? await invitesCrypto.encrypt(datakey, recipientEmail)
      : null;
    unsyncedInvite.recipient.sms = encryptedSms;
    unsyncedInvite.recipient.email = encryptedEmail;

    // Get stored invites from IndexedDB
    const invites = (await localforage.getItem("invites")) || [];
    const unsyncedInvites =
      (await localforage.getItem("unsyncedInvites")) || [];

    // Add new invite to stored invites
    invites.push(invite);
    unsyncedInvites.push(unsyncedInvite);

    // Overwrite previous invites in IndexedDB
    await localforage.setItem("invites", invites);
    await localforage.setItem("unsyncedInvites", unsyncedInvites);

    // Save invite via sendBeacon
    const sendBeaconEndpoint = `${getApiHost()}/invite-send-beacon`;
    const sendBeaconAccessToken = await getAccessToken();
    const sendBeaconPayload = JSON.stringify({
      accessToken: sendBeaconAccessToken,
      invite: unsyncedInvite,
    });
    navigator.sendBeacon(sendBeaconEndpoint, sendBeaconPayload);

    // Sync invites via fetch + keepalive
    const invitesSynced = await syncInvites();

    resolve(invitesSynced);
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

function setRecipientID() {
  recipientIdGlobal = getRecipientId();
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
    .addEventListener("change", eventDetails);
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
    if (
      event.persisted ||
      performance.getEntriesByType("navigation")[0].type === "back_forward"
    ) {
      window.location.reload();
    }
  });

  document
    .querySelector("a[href='#howtoscan']")
    .addEventListener("click", onHowToScanClick);
}

async function init() {
  setRecipientID();
  await checkForEvents();
  clearForm();
  await populateContent();
  populateSaveButtonData();
  await loadEvents();
  setDefaultSendMethod();
  initIntlTelInput();
  eventDetails();
  getCoordinatesOnLoad();
  showTagInviteWithLocation();
  setEventListeners();
  globalHidePageSpinner();
  syncInvites(); // Don't put an "await" on this; let it succeed or fail without blocking.
  prepopulateInvite();
}

init();
