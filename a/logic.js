function reset() {
  globalHidePageSpinner();
  document.querySelector("html").style.setProperty("background-color", "white");
}

async function showMessage(newUser, authorizedBy, expiresAt, churchid) {
  const churchesEndpoint = `${getApiServicesHost()}/churches`;
  const churchesQuery = await fetch(churchesEndpoint).then((res) => res.json());
  const churches = churchesQuery.churches;
  const lang = getLang();
  const church = churches.find((item) => item.id === Number(churchid));
  const locale = `${lang.toLowerCase()}-${church.country.toUpperCase()}`;
  const utcExpiryDate = moment(expiresAt).utc().format();
  const localizedExpiryDate = Intl.DateTimeFormat(locale, {
    dateStyle: "short",
  }).format(new Date(utcExpiryDate));
  const url = `../authorize/i18n/${lang}.json`;
  const phraseJSON = await fetch(url).then((res) => res.json());
  const header = getPhrase("notificationQRCodeHeader", phraseJSON).replaceAll(
    "{NEW-USER-FIRST-NAME}",
    newUser.firstname
  );
  let sentence1 = getPhrase("notificationSentence1", phraseJSON);
  let sentence2 = getPhrase("notificationSentence2HTML", phraseJSON);
  const sentence3 = getPhrase("notificationSentence3", phraseJSON);
  const sentence4 = getPhrase("notificationSentence4", phraseJSON);
  let sentence5 = getPhrase("notificationSentence5QRCode", phraseJSON);
  const moreInfo = getPhrase("notificationMoreInfoQRCode", phraseJSON);
  const sincerely = getPhrase("notificationSincerely", phraseJSON);
  const internetMinistry = getPhrase(
    "notificationInternetMinistry",
    phraseJSON
  );

  sentence1 = sentence1.replaceAll("{NEW-USER-FIRST-NAME}", newUser.firstname);
  sentence2 = sentence2.replaceAll("{FIRST-NAME}", authorizedBy.firstname);
  sentence2 = sentence2.replaceAll("{LAST-NAME}", authorizedBy.lastname);
  sentence5 = sentence5.replaceAll("{DEADLINE-DATE}", localizedExpiryDate);

  const content = `
    <p>
      ${sentence1} ${sentence2}
    </p>

    <p>
      ${sentence3}
    </p>

    <p>
      ${sentence4}
    </p>

    <p>
      ${sentence5}
    </p>

    <p class="text-center text-sm-left">
      <a href="/about/" class="btn btn-sm btn-outline-primary border border-primary">
        ${moreInfo}
      </a>
    </p>

    <p>
      ${sincerely}
    </p>

    <p>
      ${internetMinistry}
    </p>
  `;

  globalHidePageSpinner();
  document.querySelector("html").setAttribute("data-sentvia", "qrcode");
  showModal(content, header);
}

function validate(churchid, authorizedBy, authcode) {
  const noRecordsFound = getPhrase("noRecordsFound");

  if (!churchid) {
    console.error("churchid not found");
    reset();
    showToast(noRecordsFound, 0, "danger");
    return false;
  }

  if (!authorizedBy) {
    console.log("authorizedBy not found");
    reset();
    showToast(noRecordsFound, 0, "danger");
    return false;
  }

  if (!authcode) {
    console.log("authcode not found");
    reset();
    showToast(noRecordsFound, 0, "danger");
    return false;
  }

  if (typeof churchid !== "number") {
    console.log("churchid must be a number");
    reset();
    showToast(noRecordsFound, 0, "danger");
    return false;
  }

  if (typeof authorizedBy !== "number") {
    console.log("authorizedBy must be a number");
    reset();
    showToast(noRecordsFound, 0, "danger");
    return false;
  }

  if (typeof authcode !== "string") {
    console.log("authcode must be a string");
    reset();
    showToast(noRecordsFound, 0, "danger");
    return false;
  }

  if (churchid <= 0) {
    console.log("churchid must be a positive number");
    reset();
    showToast(noRecordsFound, 0, "danger");
    return false;
  }

  if (authorizedBy <= 0) {
    console.log("authorizedBy must be a positive number");
    reset();
    showToast(noRecordsFound, 0, "danger");
    return false;
  }
  if (authcode.length !== 6) {
    console.log("authcode must be exactly 6 characters");
    reset();
    showToast(noRecordsFound, 0, "danger");
    return false;
  }

  return true;
}

function verifyAuthorization() {
  return new Promise(async (resolve, reject) => {
    const hash = window.location.hash.split("#")[1];
    const params = hash.split("/");

    if (!Array.isArray(params)) {
      console.error("params must be an array");
    }

    params.shift();

    if (params.length !== 3) {
      console.error("params must be an array of length 3");
    }

    const churchid = Number(params[0]) || null;
    const authorizedBy = Number(params[1]) || null;
    const authcode = params[2] || null;
    const isValidated = validate(churchid, authorizedBy, authcode);

    if (!isValidated) return reject();

    const endpoint = `${getApiHost()}/authorization-prereg-claim`;

    fetch(endpoint, {
      mode: "cors",
      method: "post",
      body: JSON.stringify({
        churchid: churchid,
        authorizedBy: authorizedBy,
        authcode: authcode,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        switch (data.msg) {
          case "no records found":
            reset();
            showToast(getPhrase("noRecordsFound"), 0, "danger");
            break;
          case "preauth is expired":
            localStorage.removeItem("preAuthToken");
            window.location.href = "/about/";
            break;
          case "authorization verified":
            const jwt = data.preAuthToken;
            const { newUser, authorizedBy, sentvia, expiresAt, churchid } =
              JSON.parse(atob(jwt.split(".")[1]));

            localStorage.setItem("preAuthToken", jwt);

            document.cookie = `preAuthToken=${jwt}`;

            if (sentvia === "qrcode") {
              showMessage(newUser, authorizedBy, expiresAt, churchid);
              return resolve();
            }

            window.location.href = "/about/";

            return resolve();
          default:
            break;
        }
      })
      .catch((error) => {
        console.error(error);
        return reject();
      });
  });
}

function onPageShow(event) {
  if (
    event.persisted ||
    performance.getEntriesByType("navigation")[0].type === "back_forward"
  ) {
    window.location.reload();
  }
}

function attachListeners() {
  $("#modal").on("hide.bs.modal", () => {
    window.location.href = "/about/";
  });

  window.addEventListener("pageshow", onPageShow);
}

async function init() {
  await populateContent();
  await verifyAuthorization();
  attachListeners();
}

init();
