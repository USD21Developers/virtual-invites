let coordinates;
let iti;
let recipientIdGlobal = "";
const geoLocationOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

function clearForm() {
  window.addEventListener("pageshow", () => {
    const form = document.querySelector("#formsendinvite");
    form.reset();
  });
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

function eventDetails() {
  const event = document.querySelector("#events_dropdown");
  const meetingdetails = document.querySelector("#meetingdetails");
  const selectedEvent = event.selectedOptions[0];
  const eventDay = selectedEvent.getAttribute("data-day");
  const eventTime = selectedEvent.getAttribute("data-time");
  const eventLocation = selectedEvent.getAttribute("data-location");
  const address1 = selectedEvent.getAttribute("data-address1");
  const address2 = selectedEvent.getAttribute("data-address2");
  const address3 = selectedEvent.getAttribute("data-address3");
  const meetingdetails_timedate = document.querySelector(
    "#meetingdetails_timedate"
  );
  const meetingdetails_location = document.querySelector(
    "#meetingdetails_location"
  );

  populateQrCode();

  if (selectedEvent.value === "") return meetingdetails.classList.add("d-none");
  localStorage.setItem("lastEventSelected", selectedEvent.value);
  meetingdetails_timedate.innerHTML = `${eventDay} @ ${eventTime}`;
  meetingdetails_location.innerHTML = `
    ${eventLocation}
    ${address1.length ? "<br>" + address1 : ""}
    ${address2.length ? "<br>" + address2 : ""}
    ${address3.length ? "<br>" + address3 : ""}
  `;
  meetingdetails.classList.remove("d-none");
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

function getCopyPasteBodyText() {
  const text = localStorage.getItem("bodyTextCopyPaste") || "";
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
  const finalUrl = `${window.location.origin}/i/#/${eventId}/${userId}/${recipientId}`;

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
  const smsBodyText = getSmsBodyText() || "";
  const emailBodyText = getEmailBodyText() || "";
  const copyPasteBodyText = getCopyPasteBodyText() || "";
  let sendBody = "";

  switch (sendVia) {
    case "sms":
      sendBody = `${inviteToText}:\r\n\r\n${finalURL}`;
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
    case "copypaste":
      sendBody = `${inviteToText}:

${finalURL}`;
      if (copyPasteBodyText.length) {
        sendBody += copyPasteBodyText;
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

async function loadEventsToInvitePeopleTo() {
  const events_dropdown = document.querySelector("#events_dropdown");
  const meetingdetails = document.querySelector("#meetingdetails");
  const events_stored = localStorage.getItem("events") || loadDummyEvents();
  const events = JSON.parse(events_stored);
  const events_default = localStorage.getItem("events_default") || 1;
  const lastEventSelected = localStorage.getItem("lastEventSelected") || "";
  let optionsContainLastEventSelected = false;
  let options;

  events.forEach((event) => {
    const { id, name, day, time, location, address1, address2, address3 } =
      event;
    if (id == lastEventSelected) optionsContainLastEventSelected = true;
    options += `<option value="${id}" data-day="${day}" data-time="${time}" data-location="${location}" data-address1="${address1}" data-address2="${address2}" data-address3="${address3}">${name}</option>`;
  });

  events_dropdown.innerHTML = options;
  events_dropdown.options[events_default].selected = true;
  if (lastEventSelected.length && optionsContainLastEventSelected)
    events_dropdown.value = lastEventSelected;

  eventDetails();
  meetingdetails.classList.remove("d-none");

  // TODO:  fetch events from API for user, store the result to localStorage, then refresh the UI with it
}

async function onAfterSubmitted(sendvia) {
  const modalFooter = document.querySelector(".modal-footer");
  modalFooter.classList.remove("d-none");

  const thisRecipient = document.querySelector("#recipientname").value.trim() || "";
  if ((sendvia === "copypaste") && (thisRecipient === "")) {
    modalFooter.classList.add("d-none");
    return showError(getPhrase("recipientNameRequired"), "#recipientname", getPhrase("fieldRequired"));
  }

  // Reset text of send button
  const sendButton = document.querySelector("#btnSendInvite");

  if (sendvia === "qrcode") {
    sendButton.innerText = getPhrase("buttonsaveinvite");
  } else if (sendvia === "copypaste") {
    sendButton.innerText = getPhrase("buttoncopyinvite");
    const sendBody = getSendBody();
    await navigator.clipboard.writeText(sendBody);
  }

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
  } else if (sendvia === "copypaste") {
    modalContent = `
      <p>${getPhrase("afterSentParagraph1CopyPaste")}</p>
      <ol>
        <li>${getPhrase("afterSentBullet1CopyPaste").replace("{RECIPIENT-NAME}", thisRecipient)}</li>
        <li>${getPhrase("afterSentBullet2CopyPaste").replace("{RECIPIENT-NAME}", thisRecipient)}</li>
        <li>${getPhrase("afterSentBullet3CopyPaste")}</li>
      </ol>
      <p>${getPhrase("afterSentParagraph2CopyPaste").replaceAll("{RECIPIENT-NAME}", thisRecipient)}</p>
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
  const txtInviteRecorded = (sendvia === "copypaste") ? getPhrase("inviteCopied") : getPhrase("inviteRecorded");
  const txtBtnRetry = getPhrase("btnRetry");
  saveAndSync()
    .then(() => {
      showModal(modalContent, txtInviteRecorded, txtBtnRetry, "static");
    })
    .catch(() => {
      // TODO:  Handle failed sync here, if necessary
      showModal(modalContent, txtInviteRecorded, txtBtnRetry, "static");
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

function onSubmitButtonClick(e) {
  const sendVia = getSendVia();
  const btnSendInvite = document.querySelector("#btnSendInvite");
  const sendTo = getSendTo();
  const sendBody = getSendBody();
  const emailSubjectLine = getEmailSubjectLine();

  clearErrorMessages();

  switch (sendVia) {
    case "sms":
      btnSendInvite.setAttribute("href", `sms:${sendTo};?&body=${sendBody}`);
      showForwardingMessage("sms");
      console.log("Setting SMS timer");

      setTimeout(() => {
        onAfterSubmitted("sms");
        console.log("Timer finished");
      }, 5000);
      break;
    case "email":
      btnSendInvite.setAttribute(
        "href",
        `mailto:${sendTo}?subject=${emailSubjectLine}&body=${sendBody}`
      );
      showForwardingMessage("email");
      setTimeout(() => {
        onAfterSubmitted("email");
      }, 5000);
      break;
    case "copypaste":
      e.preventDefault();
      onAfterSubmitted("copypaste");
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
  btnSendInvite.setAttribute("data-copypastetext", getPhrase("buttoncopyinvite"));
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
        downloadLink.setAttribute("download", "invite.png");
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
        const qrCodeContainerOffset =
          document.getElementById("containerSendToQRCode").offsetTop - 64;
        window.scroll({ top: qrCodeContainerOffset, behavior: "smooth" });
      }
      break;
    case "copypaste":
      localStorage.setItem("lastSendMethodSelected", "copypaste");
      isMobile && containerTagWithLocation.classList.remove("d-none");
      btnSendInvite.innerHTML = btnSendInvite.getAttribute("data-copypastetext");
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
  const defaultSendMethod = localStorage.getItem("defaultSendMethod") || "";
  const lastSendMethodSelected =
    localStorage.getItem("lastSendMethodSelected") || "";

  if (defaultSendMethod.length) {
    document.querySelector("#sendvia").value = defaultSendMethod;
    selectSendVia(defaultSendMethod);
  } else if (lastSendMethodSelected.length) {
    document.querySelector("#sendvia").value = lastSendMethodSelected;
    selectSendVia(lastSendMethodSelected);
  }
}

function showError(msg, selector, inlineMsg) {
  const formIncomplete = getPhrase("formIncomplete");

  formErrorsReset();
  if (selector) {
    if (inlineMsg) {
      formError(selector, inlineMsg);
    } else {
      formError(selector);
    };
  }
  showModal(msg, formIncomplete);
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
}

async function init() {
  clearForm();
  await populateContent();
  populateSaveButtonData();
  loadEventsToInvitePeopleTo();
  setDefaultSendMethod();
  initIntlTelInput();
  setEventListeners();
  getCoordinatesOnLoad();
  showTagInviteWithLocation();
}

init();
