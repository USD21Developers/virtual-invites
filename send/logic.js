let coordinates;
let iti;
const geoLocationOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
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
    await navigator.permissions.query({ name: 'geolocation' }).then((response) => {
      if (response.state && response.state == 'granted') {
        navigator.geolocation.getCurrentPosition(onGeoLocationSuccess, onGeoLocationError, geoLocationOptions);
      }
    });
  }
}

function getEmailBodyText() {
  const text = localStorage.getItem("bodyTextEmail") || "";
  return text;
}

function getEmailSubjectLine() {
  const eventName = getInviteToText();
  const text = localStorage.getItem("subjectLineEmail") || `Invitation to ${eventName}`;
  return encodeURI(text);
}

function getFinalURL() {
  const finalUrl = `${window.location.origin}/i/#/${getInviteToId()}/${getRecipientId()}/${getSenderId()}`;
  return finalUrl;
}

function getInviteToId() {
  const inviteTo = document.querySelector("#events_dropdown").selectedOptions[0].value;
  return inviteTo;
}

function getInviteToText() {
  const inviteTo = document.querySelector("#events_dropdown").selectedOptions[0].innerText;
  return inviteTo;
}

function getRecipientId() {
  // TODO: make this return an actual recipient ID
  return 221;
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

function getSenderId() {
  // TODO: make this return the actual sender ID
  return 185;
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

function getSendVia() {
  const value = document.querySelector("#sendvia").selectedOptions[0].value;
  return value;
}

function getSmsBodyText() {
  const text = localStorage.getItem("bodyTextSms") || "";
  return text;
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

async function loadEvents() {
  const events_dropdown = document.querySelector("#events_dropdown");
  const meetingdetails = document.querySelector("#meetingdetails");
  const events_stored = localStorage.getItem("events") || loadDummyEvents();
  const events = JSON.parse(events_stored);
  const events_default = localStorage.getItem("events_default") || 1;
  const lastEventSelected = localStorage.getItem("lastEventSelected") || "";
  let optionsContainLastEventSelected = false;
  let options;

  events.forEach(event => {
    const { id, name, day, time, location, address1, address2, address3 } = event;
    if (id == lastEventSelected) optionsContainLastEventSelected = true;
    options += `<option value="${id}" data-day="${day}" data-time="${time}" data-location="${location}" data-address1="${address1}" data-address2="${address2}" data-address3="${address3}">${name}</option>`;
  });

  events_dropdown.innerHTML = options;
  events_dropdown.options[events_default].selected = true;
  if (lastEventSelected.length && optionsContainLastEventSelected) events_dropdown.value = lastEventSelected;

  eventDetails();
  meetingdetails.classList.remove("d-none");

  // TODO:  fetch events from API for user, store the result to localStorage, then refresh the UI with it 
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


function onFormSubmit(e) {
  e.preventDefault();
  onSubmit();
}

function onGeoLocationError(err) {
  switch (err) {
    case 1:
      showToast("Geocoordinates: permission denied");
      break;
    case 2:
      showToast("Geocoordinates: position unavailable");
      break;
    case 3:
      showToast("Geocoordinates: timed out");
      break;
    default:
      showToast(`Geocoordinates: error code ${err}`);
  }
}

function onGeoLocationSuccess(pos) {
  const { latitude, longitude } = pos.coords;

  coordinates = {
    lat: latitude,
    long: longitude,
    timestamp: pos.timestamp
  };

  // showToast(`<a href="https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}">${latitude}, ${longitude}</a>`);
}

function onSendViaChanged() {
  selectSendVia();
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

function onTagWithLocation(e) {
  const isChecked = e.target.checked || false;

  if (isChecked && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(onGeoLocationSuccess, onGeoLocationError, geoLocationOptions);
  }
}

function populateQrCode() {
  const availableWidth = document.querySelector("#qrcode").clientWidth;
  const maxWidth = 200;
  const width = (availableWidth > maxWidth) ? maxWidth : availableWidth;
  const url = getFinalURL();

  new QRious({
    element: document.getElementById('qr'),
    value: url,
    size: width
  });
}

function selectSendVia(method) {
  const containerSms = document.querySelector("#containerSendToSms");
  const containerEmail = document.querySelector("#containerSendToEmail");
  const containerQRCode = document.querySelector("#containerSendToQRCode");
  const containerQRCodeInstructions = document.querySelector("#containerQRCodeInstructions");
  const containerTagWithLocation = document.querySelector("#containerTagWithLocation");
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

function showForwardingMessage(sendvia) {
  if (!["sms", "email"].includes(sendvia)) return;
  const btnSendInvite = document.querySelector("#btnSendInvite");

  switch (sendvia) {
    case "sms":
      btnSendInvite.innerText = "Opening SMS...";
      break;
    case "email":
      btnSendInvite.innerText = "Opening e-mail...";
      break;
  }

  btnSendInvite.setAttribute("disabled", true);

  setTimeout(() => {
    window.scrollTo(0, 0);
    setInterval(() => {
      try {
        window.location.reload();
      } catch (e) {
        console.error(e);
      }
    }, 500);
  }, 5000);
}

function showTagInviteWithLocation() {
  const isMobile = isMobileDevice();
  if (isMobile) {
    const containerTagWithLocation = document.querySelector("#containerTagWithLocation");
    containerTagWithLocation.classList.remove("d-none");
  }
}

function setEventListeners() {
  document.querySelector("#sendvia").addEventListener("change", onSendViaChanged);
  document.querySelector("#events_dropdown").addEventListener("change", eventDetails);
  document.querySelector("#tagwithlocation").addEventListener("click", onTagWithLocation);
  document.querySelector("#btnSendInvite").addEventListener("click", onSubmit);
  document.querySelector("#formsendinvite").addEventListener("submit", onFormSubmit);
}

function init() {
  loadEvents();
  setDefaultSendMethod();
  initIntlTelInput();
  setEventListeners();
  getCoordinatesOnLoad();
  showTagInviteWithLocation();
}

init();