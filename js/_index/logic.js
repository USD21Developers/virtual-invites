(() => {

  function selectSendVia() {
    const sendToLabel = document.querySelector("#sendToLabel");
    const containerSms = document.querySelector("#containerSendToSms");
    const containerEmail = document.querySelector("#containerSendToEmail");
    const containerQRCode = document.querySelector("#containerSendToQRCode");
    const sendvia = getSendVia();

    sendToLabel.classList.add("d-none");
    containerSms.classList.add("d-none");
    containerEmail.classList.add("d-none");
    containerQRCode.classList.add("d-none");

    switch(sendvia) {
      case "sms":
        sendToLabel.classList.remove("d-none");
        containerSms.classList.remove("d-none");
        break;
      case "email":
        sendToLabel.classList.remove("d-none");
        containerEmail.classList.remove("d-none");
        break;
      case "qrcode":
        sendToLabel.classList.add("d-none");
        containerQRCode.classList.remove("d-none");
        break;
    }
  }

  function getSendVia() {
    const value = document.querySelector("input[type=radio][name='sendvia']:checked").value;
    return value;
  }

  function onSendViaChanged(item) {
    item.addEventListener("change", (evt) => {
      selectSendVia();
    });
  }

  function setEventListeners() {
    document.querySelectorAll("input[type=radio][name='sendvia']").forEach(item => onSendViaChanged(item));
  }

  function init() {
    setEventListeners();
  }

  init();

})();