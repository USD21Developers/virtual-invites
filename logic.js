let iti;

function selectSendVia() {
  const sendToLabel = document.querySelector("#sendToLabel");
  const containerName = document.querySelector("#containerName");
  const containerSms = document.querySelector("#containerSendToSms");
  const containerEmail = document.querySelector("#containerSendToEmail");
  const containerQRCode = document.querySelector("#containerSendToQRCode");
  const containerTagWithLocation = document.querySelector("#containerTagWithLocation");
  const containerSendInvite = document.querySelector("#containerSendInvite");
  const sendvia = getSendVia();

  sendToLabel.classList.add("d-none");
  containerSms.classList.add("d-none");
  containerEmail.classList.add("d-none");
  containerQRCode.classList.add("d-none");
  containerName.classList.add("d-none");
  containerTagWithLocation.classList.add("d-none");
  containerSendInvite.classList.add("d-none");

  switch(sendvia) {
    case "sms":
      sendToLabel.classList.remove("d-none");
      containerSms.classList.remove("d-none");
      containerName.classList.remove("d-none");
      containerTagWithLocation.classList.remove("d-none");
      containerSendInvite.classList.remove("d-none");
      break;
    case "email":
      sendToLabel.classList.remove("d-none");
      containerEmail.classList.remove("d-none");
      containerName.classList.remove("d-none");
      containerTagWithLocation.classList.remove("d-none");
      containerSendInvite.classList.remove("d-none");
      break;
    case "qrcode":
      containerQRCode.classList.remove("d-none");
      document.querySelector("#sendvia_label").scrollIntoView();
      populateQrCode();
      break;
  }
}

function getSendVia() {
  const value = document.querySelector("input[type=radio][name='sendvia']:checked").value;
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
  switch(sendVia) {
    case "sms":
      sendTo = iti.getNumber();
      break;
    case "email":
      sendTo = document.querySelector("#sendto_email").value.trim();
      break;
    default:
      break;
  }
  return sendTo;
}

function onSendViaChanged(item) {
  item.addEventListener("change", (evt) => {
    selectSendVia();
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
      address: "555 Main Street, Phoenix, AZ, 99999"
    },
    {
      id: 2,
      type: "Sunday Service",
      name: "Sunday Service",
      day: "Sundays",
      time: "10:00 AM",
      location: "SDA",
      address: "5555 Camelback Road, Scottsdale, AZ, 99999"
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
  const eventAddress = selectedEvent.getAttribute("data-address");
  const meetingdetails_timedate = document.querySelector("#meetingdetails_timedate");
  const meetingdetails_location = document.querySelector("#meetingdetails_location");

  populateQrCode();

  if (selectedEvent.value === "") return meetingdetails.classList.add("d-none");
  meetingdetails_timedate.innerHTML = `${eventDay} @ ${eventTime}`;
  meetingdetails_location.innerHTML = `${eventLocation} ${eventAddress.length && "<br>"} ${eventAddress}`;
  meetingdetails.classList.remove("d-none");
}

async function loadEvents() {
  const events_dropdown = document.querySelector("#events_dropdown");
  const meetingdetails = document.querySelector("#meetingdetails");
  const events_stored = localStorage.getItem("events")  || loadDummyEvents();
  const events = JSON.parse(events_stored);
  const events_default = localStorage.getItem("events_default") || 1;
  let options = `<option value="">(Select)</option>`;

  events.forEach(event => {
    const { id, name, day, time, location, address } = event;
    options += `<option value="${id}" data-day="${day}" data-time="${time}" data-location="${location}" data-address="${address}">${name}</option>`;
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
    utilsScript: "js/intl-tel-input-17.0.0/js/utils.js"
  });
  iti = intlTelInput(input);
}

function populateQrCode() {
  const userid = localStorage.getItem("userid") || 0;
  const env = document.location.hostname || "localhost";
  const selectedEvent = document.querySelector("#events_dropdown").selectedOptions[0].value || "";
  const availableWidth = document.querySelector("#qrcode").clientWidth;
  const maxWidth = 250;
  const width = (availableWidth > maxWidth) ? maxWidth : availableWidth;
  let url;
  switch(env) {
    case "localhost":
      url = `${getApiHost()}/${userid}`;
      break;
    case "staging.invites.usd21.org":
      url = `${getApiHost()}/${userid}`;
      break;
    case "invites.usd21.org":
      url = `${getApiHost()}/${userid}`;
      break;
  }
  if (selectedEvent.length) url += `/${selectedEvent}`;

  // TODO:  Generate link from link shortener instead of using raw URL

  const qr = new QRious({
    element: document.getElementById('qr'),
    value: url,
    size: width
  });
}

function getRootURL() {
  return `${window.location.origin}/i/#/${getInviteToId()}`;
}

function getSmsBodyText() {
  return localStorage.getItem("bodyTextSms") || "";
}

function getEmailBodyText() {
  return localStorage.getItem("bodyTextEmail") || "";
}

function getEmailSubjectLine() {
  return localStorage.getItem("subjectLineEmail") || "Invitation";
}

function getSendBody() {
  const sendVia = getSendVia();
  let sendBody;

  switch(sendVia) {
    case "sms":
      sendBody = `${getInviteToText()}:\n${getRootURL()}\n\n${getSmsBodyText()}`;
      break;
    case "email":
      sendBody = `${getInviteToText()}:\n${getRootURL()}\n\n${getEmailBodyText()}`
      break;
    default:
      return;
  }

  return sendBody;
}

function onSubmit(e) {
  const sendVia = getSendVia();
  const btnSendInvite = document.querySelector("#btnSendInvite");

  switch(sendVia) {
    case "sms":
      btnSendInvite.setAttribute("href", `sms://${getSendTo()}?body=${encodeURI(getSendBody())}`);
      break;
    case "email":
      btnSendInvite.setAttribute("href", `mailto://${getSendTo()}?subject=${encodeURI(getEmailSubjectLine())}&body=${encodeURI(getSendBody())}`);
      break;
    default:
      e.preventDefault();
  }
}

function setEventListeners() {
  document.querySelectorAll("input[type=radio][name='sendvia']").forEach(item => onSendViaChanged(item));
  document.querySelector("#events_dropdown").addEventListener("change", eventDetails);
  document.querySelector("#btnSendInvite").addEventListener("click", onSubmit);
}

function init() {
  loadEvents();
  initIntlTelInput();
  setEventListeners();
}

init();