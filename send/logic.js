let iti;

function selectSendVia(method) {
  const containerSms = document.querySelector("#containerSendToSms");
  const containerEmail = document.querySelector("#containerSendToEmail");
  const containerQRCode = document.querySelector("#containerSendToQRCode");
  const containerTagWithLocation = document.querySelector("#containerTagWithLocation");
  const containerSendInvite = document.querySelector("#containerSendInvite");
  const smsField = document.querySelector("#sendto_sms");
  const emailField = document.querySelector("#sendto_email");
  const sendvia = method ? method : getSendVia();

  containerSms.classList.add("d-none");
  containerEmail.classList.add("d-none");
  containerQRCode.classList.add("d-none");
  containerTagWithLocation.classList.add("d-none");
  containerSendInvite.classList.add("d-none");
  smsField.removeAttribute("required");
  emailField.removeAttribute("required");

  switch (sendvia) {
    case "sms":
      smsField.setAttribute("required", "");
      localStorage.setItem("lastSendMethodSelected", "sms");
      containerSms.classList.remove("d-none");
      containerTagWithLocation.classList.remove("d-none");
      containerSendInvite.classList.remove("d-none");
      break;
    case "email":
      emailField.setAttribute("required", "");
      localStorage.setItem("lastSendMethodSelected", "email");
      containerEmail.classList.remove("d-none");
      containerTagWithLocation.classList.remove("d-none");
      containerSendInvite.classList.remove("d-none");
      break;
    case "qrcode":
      localStorage.setItem("lastSendMethodSelected", "qrcode");
      containerQRCode.classList.remove("d-none");
      populateQrCode();
      if (!method) {
        try {
          document.querySelector("#containerSendToQRCode").scrollIntoView({ behavior: smooth });
        } catch (e) {
          document.querySelector("#containerSendToQRCode").scrollIntoView();
        }
      }
      break;
  }
}

function getSendVia() {
  const value = document.querySelector("#sendvia").selectedOptions[0].value;
  return value;
}

function getInviteToText() {
  const inviteTo = document.querySelector("#events_dropdown").selectedOptions[0].innerText;
  return inviteTo;
}

function getInviteToId() {
  const inviteTo = document.querySelector("#events_dropdown").selectedOptions[0].value;
  return inviteTo;
}

function getSendTo() {
  const sendVia = getSendVia();
  let sendTo;
  switch (sendVia) {
    case "sms":
      sendTo = iti.getNumber();
      break;
    case "email":
      sendTo = document.querySelector("#sendto_email").value.trim().toLowerCase();
      break;
    default:
      break;
  }
  return sendTo;
}

function onSendViaChanged() {
  selectSendVia();
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
      address3: "Phoenix, AZ 99999"
    },
    {
      id: 2,
      type: "Sunday Service",
      name: "Sunday Service",
      day: "Sundays",
      time: "10:00 AM",
      location: "SDA",
      address1: "5555 Camelback Road",
      address2: "Suite 5",
      address3: "Scottsdale, AZ 99999"
    }
  ];

  return JSON.stringify(events);
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
  const meetingdetails_timedate = document.querySelector("#meetingdetails_timedate");
  const meetingdetails_location = document.querySelector("#meetingdetails_location");

  populateQrCode();

  if (selectedEvent.value === "") return meetingdetails.classList.add("d-none");
  meetingdetails_timedate.innerHTML = `${eventDay} @ ${eventTime}`;
  meetingdetails_location.innerHTML = `
    ${eventLocation}
    ${address1.length ? "<br>" + address1 : ""}
    ${address2.length ? "<br>" + address2 : ""}
    ${address3.length ? "<br>" + address3 : ""}
  `;
  meetingdetails.classList.remove("d-none");
}

async function loadEvents() {
  const events_dropdown = document.querySelector("#events_dropdown");
  const meetingdetails = document.querySelector("#meetingdetails");
  const events_stored = localStorage.getItem("events") || loadDummyEvents();
  const events = JSON.parse(events_stored);
  const events_default = localStorage.getItem("events_default") || 1;
  let options;

  events.forEach(event => {
    const { id, name, day, time, location, address1, address2, address3 } = event;
    options += `<option value="${id}" data-day="${day}" data-time="${time}" data-location="${location}" data-address1="${address1}" data-address2="${address2}" data-address3="${address3}">${name}</option>`;
  });

  events_dropdown.innerHTML = options;
  events_dropdown.options[events_default].selected = true;
  eventDetails();
  meetingdetails.classList.remove("d-none");

  // TODO:  fetch events from API for user, store the result to localStorage, then refresh the UI with it 
}

function initIntlTelInput() {
  const input = document.querySelector("#sendto_sms");
  const initialCountry = localStorage.getItem("countryIso") || "us";
  window.intlTelInput(input, {
    initialCountry: initialCountry,
    preferredCountries: ["us"],
    utilsScript: "../js/intl-tel-input-17.0.0/js/utils.js"
  });
  iti = intlTelInput(input);
  // iti.promise.then(onAfterIntlInputInitialized);
}

function onAfterIntlInputInitialized() {
  const sendto_sms = document.querySelector("#sendto_sms");
  const container = sendto_sms.parentElement;
  const label = document.createElement("label");
  label.setAttribute("for", "sendto_sms");
  label.appendChild(document.createTextNode(sendto_sms.getAttribute("placeholder")));
  container.classList.add("form-floating");
  container.appendChild(label);
}


function populateQrCode() {
  const env = document.location.hostname || "localhost";
  const availableWidth = document.querySelector("#qrcode").clientWidth;
  const maxWidth = 200;
  const width = (availableWidth > maxWidth) ? maxWidth : availableWidth;
  const url = getFinalURL();

  const qr = new QRious({
    element: document.getElementById('qr'),
    value: url,
    size: width
  });
}

function getFinalURL() {
  const finalUrl = `${window.location.origin}/i/#/${getInviteToId()}/${getRecipientId()}/${getSenderId()}`;
  return finalUrl;
}

function getSmsBodyText() {
  const text = localStorage.getItem("bodyTextSms") || "";
  return text;
}

function getEmailBodyText() {
  const text = localStorage.getItem("bodyTextEmail") || "";
  return text;
}

function getEmailSubjectLine() {
  const text = localStorage.getItem("subjectLineEmail") || "Invitation";
  return encodeURI(text);
}

function getSendBody() {
  const sendVia = getSendVia() || "";
  const finalURL = getFinalURL() || "";
  const inviteToText = getInviteToText() || "";
  const smsBodyText = getSmsBodyText() || "";
  const emailBodyText = getEmailBodyText() || "";
  let sendBody = "";

  switch (sendVia) {
    case "sms":
      sendBody = `${getInviteToText()}:\n\n${finalURL}`;
      if (smsBodyText.length) {
        sendBody += `\n\n${smsBodyText}`;
      }
      break;
    case "email":
      sendBody = `${inviteToText}:\n\n${finalURL}`;
      if (emailBodyText.length) {
        sendBody += `\n\n${emailBodyText}\n\n`;
      }
      break;
    default:
      return;
  }

  return encodeURIComponent(sendBody);
}



function showForwardingMessage(sendvia) {
  if (!["sms", "email"].includes(sendvia)) return;
  const btnSendInvite = document.querySelector("#btnSendInvite");
  btnSendInvite.classList.add("d-none");
  btnSendInvite.classList.remove("btn-primary");
  btnSendInvite.classList.add("btn-info");
  btnSendInvite.setAttribute("disabled", true);
  btnSendInvite.classList.remove("d-none");

  switch (sendvia) {
    case "sms":
      btnSendInvite.innerText = "Opening SMS...";
      break;
    case "email":
      btnSendInvite.innerText = "Opening e-mail...";
      break;
  }

  setTimeout(() => {
    btnSendInvite.classList.add("d-none");
    btnSendInvite.classList.remove("btn-info");
    btnSendInvite.classList.add("btn-primary");
    btnSendInvite.innerText = btnSendInvite.getAttribute("data-defaulttext");
    btnSendInvite.removeAttribute("disabled");
    btnSendInvite.classList.remove("d-none");
  }, 5000);
}

function onSubmit(e) {
  const sendVia = getSendVia();
  const btnSendInvite = document.querySelector("#btnSendInvite");
  const sendTo = getSendTo();
  const sendBody = getSendBody();
  const emailSubjectLine = getEmailSubjectLine();

  switch (sendVia) {
    case "sms":
      btnSendInvite.setAttribute("href", `sms:${sendTo};?&body=${sendBody}`);
      showForwardingMessage("sms");
      break;
    case "email":
      btnSendInvite.setAttribute("href", `mailto:${sendTo}?subject=${emailSubjectLine}&body=${sendBody}`);
      showForwardingMessage("email");
      break;
    default:
      e.preventDefault();
  }
}

function setDefaultSendMethod() {
  const defaultSendMethod = localStorage.getItem("defaultSendMethod") || "";
  const lastSendMethodSelected = localStorage.getItem("lastSendMethodSelected") || "";

  if (defaultSendMethod.length) {
    document.querySelector("#sendvia").value = defaultSendMethod;
    selectSendVia(defaultSendMethod);
  } else if (lastSendMethodSelected.length) {
    document.querySelector("#sendvia").value = lastSendMethodSelected;
    selectSendVia(lastSendMethodSelected);
  }
}

function getRecipientId() {
  return 221;
}

function getSenderId() {
  return 185;
}

function setEventListeners() {
  document.querySelector("#sendvia").addEventListener("change", onSendViaChanged);
  document.querySelector("#events_dropdown").addEventListener("change", eventDetails);
  document.querySelector("#btnSendInvite").addEventListener("click", onSubmit);
}

function init() {
  loadEvents();
  setDefaultSendMethod();
  initIntlTelInput();
  setEventListeners();
}

init();