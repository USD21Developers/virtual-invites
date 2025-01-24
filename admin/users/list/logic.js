function populateLeafBreadcrumb(place) {
  const el = document.querySelector("[data-i18n='breadcrumbList']");
  if (!el) return;

  el.innerText = place;
}

function renderUsers(users) {
  const userTableContainerEl = document.querySelector("#userTableContainer");
  const userTableEl = document.querySelector("#userTable");
  const tbody = userTableEl.querySelector("tbody");
  const usersLen = users.length;
  const locale = "en-US"; // TODO
  let rowsHTML = "";

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
    const dateOfLastInvitation = lastInvitationDate
      ? shortDateFormatter.format(new Date(lastInvitationDate))
      : "N/A";
    const profilePhotoSmall = profilephoto
      ? profilephoto.replaceAll("400", "140")
      : "";

    rowsHTML += `
      <tr>
        <td class="text-center">
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
        <td class="text-center">${dateOfRegistration}</td>
        <td class="text-center">${dateOfLastInvitation}</td>
      </tr>
    `;

    tbody.innerHTML = rowsHTML;
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
