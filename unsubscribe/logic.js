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
      jwt = JSON.parse(atob(unsubscribeToken));
    } catch (e) {
      return reject(e);
    }

    const endpoint = `${getApiHost()}/unsubscribe-before`;
    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        invitationid: jwt.invitationid,
        userid: jwt.userid,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${jwt}`,
      }),
    });

    resolve();
  }).catch(() => {
    const el = document.querySelector("#invalidUnsubscribe");
    if (el) el.classList.remove("d-none");
    globalHidePageSpinner();
  });
}

async function init() {
  await loadContent();
  await populateContent();
  globalHidePageSpinner();
}

init();
