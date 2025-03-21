let initializedDatatable = false;

async function initializeDatatable() {
  const translationURL = getDatatablesTranslationURL();
  const languageData = await fetch(translationURL).then((res) => res.json());

  if (!initializedDatatable) {
    initializedDatatable = true;
    let table = $(".table.table-striped").DataTable({
      language: languageData,
      order: [[1, "desc"]],
    });
  }
}

function populateLeafBreadcrumb(place) {
  const el = document.querySelector("[data-i18n='breadcrumbList']");
  if (!el) return;

  el.innerText = place;
}

function populateQuantityOfUsers(quantity) {
  const el = document.querySelector("#quantityUsers");
  let text = getPhrase("quantityOfUsers");

  if (quantity < 1) {
    return;
  }

  if (quantity === 1) {
    text = getPhrase("quantityOfUsers1");
  }

  text = text.replaceAll("{QUANTITY}", quantity);

  el.innerHTML = text;
}

async function renderUsers(users) {
  const userTableContainerEl = document.querySelector("#userTableContainer");
  const userTableEl = document.querySelector("#userTable");
  const tbody = userTableEl.querySelector("tbody");
  const usersLen = users.length;
  const userDateTimePrefs = Intl.DateTimeFormat().resolvedOptions();
  const locale = userDateTimePrefs.locale;
  const translationURL = getDatatablesTranslationURL();
  const languageData = await fetch(translationURL).then((res) => res.json());
  const now = Date.now();
  let rowsHTML = "";

  populateQuantityOfUsers(users.length);

  for (let i = 0; i < usersLen; i++) {
    const user = users[i];
    const {
      userid,
      firstname,
      lastname,
      profilephoto,
      createdAt,
      lastInvitationDate,
    } = user;
    const shortDateFormatter = new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
    });
    const dateOfRegistration = shortDateFormatter.format(new Date(createdAt));
    const dataOfRegistrationEpoch = new Date(createdAt).getTime();
    const dateOfLastInvitation = lastInvitationDate
      ? shortDateFormatter.format(new Date(lastInvitationDate))
      : "N/A";
    const dateOfLastInvitationEpoch =
      dateOfLastInvitation === "NA"
        ? now
        : new Date(lastInvitationDate).getTime();
    const profilePhotoSmall = profilephoto
      ? profilephoto.replaceAll("__400.jpg", "__140.jpg")
      : "";

    rowsHTML += `
      <tr>
        <td class="text-center" data-search="${firstname} ${lastname}">
          <a
            href="/admin/user/#/${userid}"
            class="d-inline-block"
          >
            <div class="profileImage">
              <img
                src="${profilePhotoSmall}"
                alt="${firstname} ${lastname}"
              />
            </div>
            <div class="pt-2">
              <strong>
                ${firstname} ${lastname}
              </strong>
            </div>
          </a>
        </td>
        <td class="text-center" data-order="${dataOfRegistrationEpoch}">${dateOfRegistration}</td>
        <td class="text-center" data-order="${dateOfLastInvitationEpoch}">${dateOfLastInvitation}</td>
      </tr>
    `;

    tbody.innerHTML = rowsHTML;

    initializeDatatable();
  }
}

function showChurchName() {
  return new Promise(async (resolve, reject) => {
    const churchNameEl = document.querySelector("#churchName");
    const churchIdParam = Number(window.location.search.split("=")[1]);
    const churches = await getChurches();
    const church = churches.find((item) => item.id === churchIdParam);

    if (!church) {
      return reject(new Error("unable to find church"));
    }

    populateLeafBreadcrumb(church.place);
    churchNameEl.innerHTML = church.name;

    return resolve(church.name);
  });
}

function showChurchMembers() {
  return new Promise(async (resolve, reject) => {
    const churchid = Number(window.location.search.split("=")[1]);
    const endpoint = `${getApiHost()}/users-church`;
    const accessToken = await getAccessToken();

    if (typeof churchid !== "number")
      return reject(new Error("churchid in URL parameters must be a number"));

    fetch(endpoint, {
      mode: "cors",
      method: "post",
      body: JSON.stringify({
        churchid: churchid,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data) {
          return reject(new Error("API did not return data"));
        }

        const { users } = data;

        if (!users) {
          return reject(new Error("users were missing in API response"));
        }

        renderUsers(users);

        return resolve(users);
      })
      .catch((error) => {
        console.error(error);
        return reject(error);
      });
  });
}

async function init() {
  await populateContent();
  syncChurches();
  await showChurchName();
  await showChurchMembers();
  globalHidePageSpinner();
}

init();
