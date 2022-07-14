async function getEvent() {
  const eventid = Math.abs(parseInt(getHash()));
  const endpoint = `${getApiHost()}/event-get`;
  const accessToken = await getAccessToken();
  const controller = new AbortController;

  if (typeof eventid !== "number") return;

  spinner("show");

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      eventid: eventid
    }),
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`
    })
  })
    .then(res => res.json())
    .then(data => {
      populateDetails(data);
      spinner("hide");
    })
    .catch(err => {
      console.error(err);
      spinner("hide");
    });

  setTimeout(() => {
    controller.abort();
    spinner("hide");
  }, 8000);
}

function populateDetails(data) {
  const details = document.querySelector("#eventdetails");

  console.log(data);

  details.innerHTML = `[ Event details here ]`;
}

function spinner(action = "show") {
  const actionButtons = document.querySelector("#actionbuttons");
  const progressBar = document.querySelector("#progressbar");

  if (action === "show") {
    actionButtons.classList.add("d-none");
    progressBar.classList.remove("d-none");
  } else if (action === "hide") {
    actionButtons.classList.remove("d-none");
    progressBar.classList.add("d-none");
  }
}

async function onSubmit() {
  const eventid = Math.abs(parseInt(getHash()));
  const endpoint = `${getApiHost()}/event-delete`;
  const accessToken = await getAccessToken();
  const controller = new AbortController();

  if (typeof eventid !== "number") return;

  spinner("show");

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      eventid: eventid
    }),
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`
    }),
    signal: controller.signal
  })
    .then(res => res.json())
    .then(data => {
      spinner("hide");
    })
    .catch(err => {
      spinner("hide");
    });

  setTimeout(() => {
    controller.abort();
    spinner("hide");
  }, 8000);
}

function attachListeners() {
  document.querySelector("#btnDelete").addEventListener("click", onSubmit);
}

async function init() {
  await populateContent();
  await getEvent();
  attachListeners();
}

init();