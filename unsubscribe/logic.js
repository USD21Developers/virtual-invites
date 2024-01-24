function loadContent() {
  return new Promise((resolve, reject) => {
    let unsubscribeToken = window.location.search.split("?");

    if (!Array.isArray(unsubscribeToken)) {
      return reject(new Error("invalid unsubscribe token"));
    }

    if (unsubscribeToken.length !== 2) {
      return reject(new Error("invalid unsubscribe token"));
    }

    unsubscribeToken = unsubscribeToken[1];

    let jwt;

    try {
      jwt = atob(unsubscribeToken);
    } catch (e) {
      return reject(e);
    }

    const endpoint = `${getApiHost()}/unsubscribe-before`;
    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        jwt: jwt,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.msgType === "error") {
          document
            .querySelector("#invalidUnsubscribe")
            .classList.remove("d-none");
          document
            .querySelectorAll(".invite")
            .forEach((item) => item.classList.add("d-none"));
          reject();
        }

        resolve(data.invite);
      });
  }).catch(() => {
    const el = document.querySelector("#invalidUnsubscribe");
    if (el) el.classList.remove("d-none");
    globalHidePageSpinner();
  });
}

function renderContent(invite) {
  console.log(invite);
}

async function init() {
  await loadContent();
  await populateContent();
  globalHidePageSpinner();
}

init();
