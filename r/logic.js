function getRecipient() {
  return new Promise(async (resolve, reject) => {
    const hash = window.location.hash;
    let recipientParts = hash.split("/") || null;
    if (!recipientParts) {
      return reject(new Error("Required URL parameters are missing"));
    }
    if (!Array.isArray(recipientParts)) {
      return reject(new Error("URL parameters must be separated by slashes"));
    }
    if (!recipientParts.length) {
      return reject(new Error("At least one URL parameter is required"));
    }

    const eventid = Number(recipientParts[1]) || null;
    const userid = Number(recipientParts[2]) || null;
    const recipientid = recipientParts[3] || null;
    const endpoint = `${getApiHost()}/recipient`;

    // TODO:  validate notification token

    const accessToken = await getAccessToken();

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
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);

        const { recipientname } = data.recipient;

        document.querySelectorAll("[data-i18n='pagetitle']").forEach((item) => {
          item.innerText = item.innerText.replaceAll(
            "{RECIPIENT-NAME}",
            recipientname
          );
        });

        resolve(data.recipient);
      });
  });
}

function attachListeners() {
  //
}

async function init() {
  await populateContent();
  await getRecipient();
  attachListeners();
  globalHidePageSpinner();
}

init();
