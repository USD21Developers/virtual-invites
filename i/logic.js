async function getInvite() {
  return new Promise((resolve, reject) => {
    const hash = window.location.hash;
    const inviteParts = hash
      ? window.location.hash.split("#")[1].split("/")
      : null;
    if (!inviteParts) {
      hideSpinner(); // Remove this when going to production
      return reject();
    }
    if (!Array.isArray(inviteParts)) {
      return reject();
    }
    if (!inviteParts.length) {
      return reject();
    }

    let eventid = Number(inviteParts[0]) || null;
    let userid = Number(inviteParts[1]) || null;
    let recipientid = inviteParts[2] || null;

    if (!eventid) return reject();

    const endpoint = `${getApiHost()}/invite`;

    showSpinner();

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        eventid: eventid,
        userid: userid,
        recipientid: recipientid,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        hideSpinner();
      })
      .catch((err) => {
        console.error(err);
        showSpinner();
      });
  });
}

function hideSpinner() {
  const spinnerEl = document.querySelector("#pageSpinner");
  const pageEl = document.querySelector("main");
  spinnerEl.classList.add("d-none");
  pageEl.classList.remove("d-none");
}

function showSpinner() {
  const spinnerEl = document.querySelector("#pageSpinner");
  const pageEl = document.querySelector("main");
  spinnerEl.classList.remove("d-none");
  pageEl.classList.add("d-none");
}

function populateTemplate(version = "default") {
  return new Promise((resolve, reject) => {
    const path = `../templates/${version}/index.html`;
    fetch(path)
      .then((res) => res.text())
      .then((unparsed) => {
        const parser = new DOMParser();
        const parsed = parser.parseFromString(unparsed, "text/html");
        const templateContent = parsed.querySelector(".container");
        const el = document.querySelector("main");
        el.appendChild(templateContent);
        resolve();
      });
  });
}

async function init() {
  await populateTemplate();
  await populateContent();
  await getInvite();
  hideSpinner();
}

init();
