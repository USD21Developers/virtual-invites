async function showMessage(newUser, authorizedBy, expiresAt, churchid) {
  // TODO:  if preauth was done via QR code, show a modal containing a similar message as sent via e-mail or text message.
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

    <p class="text-center">
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

function verifyAuthorization() {
  return new Promise(async (resolve, reject) => {
    const hash = window.location.hash.split("#")[1];
    const params = hash.split("/");

    if (!Array.isArray(params)) throw new Error("params must be an array");

    params.shift();

    if (params.length !== 3)
      throw new Error("params must be an array of length 3");

    const churchid = Number(params[0]) || null;
    const authorizedBy = Number(params[1]) || null;
    const authcode = params[2] || null;

    if (!churchid) throw new Error("churchid not found");
    if (!authorizedBy) throw new Error("authorizedBy not found");
    if (!authcode) throw new Error("authcode not found");
    if (typeof churchid !== "number")
      throw new Error("churchid must be a number");
    if (typeof authorizedBy !== "number")
      throw new Error("authorizedBy must be a number");
    if (typeof authcode !== "string")
      throw new Error("authcode must be a string");
    if (churchid <= 0) throw new Error("churchid must be a positive number");
    if (authorizedBy <= 0)
      throw new Error("authorizedBy must be a positive number");
    if (authcode.length !== 6)
      throw new Error("authcode must be exactly 6 characters");

    const endpoint = `${getApiHost()}/authorize-pre`;
    const accessToken = await getAccessToken();

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
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        switch (data.msg) {
          case "no records found":
            break;
          case "preauth is expired":
            break;
          case "authorization verified":
            const jwt = data.registrationToken;
            const { newUser, authorizedBy, sentvia, expiresAt, churchid } =
              JSON.parse(atob(jwt.split(".")[1]));

            localStorage.setItem("registrationToken", jwt);

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
