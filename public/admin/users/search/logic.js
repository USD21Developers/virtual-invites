function populateSearchTerm() {
  const searchTermEl = document.querySelector("#searchTerm");
  const churchNameEl = document.querySelector("#churchName");
  const params = new URLSearchParams(document.location.search);
  const churchid = params.get("churchid");
  const firstname = params.get("firstname");
  const lastname = params.get("lastname");

  let searchTerm = "";

  if (firstname.length && lastname.length) {
    searchTerm = `${firstname} ${lastname}`;
  } else if (firstname.length) {
    searchTerm = `${firstname}`;
  } else if (lastname.length) {
    searchTerm = `${lastname}`;
  }

  searchTermEl.innerHTML = searchTerm;

  const churchesJSON = localStorage.getItem("churches");
  if (churchesJSON) {
    const churches = JSON.parse(churchesJSON);
    const church = churches.find((item) => item.id == churchid);
    if (church) {
      churchNameEl.innerHTML = church.name;
    } else {
      churchNameEl.classList.add("d-none");
    }
  } else {
    churchNameEl.classList.add("d-none");
  }
}

function renderUsers(users) {
  const noResultsFoundEl = document.querySelector("#noResultsFound");
  const usersListEl = document.querySelector("#usersList");
  const usersListItemsEl = document.querySelector("#usersListItems");
  const quantityFoundContainerEl = document.querySelector(
    "#quantityFoundContainer"
  );
  const quantityFoundEl = document.querySelector("#quantityFound");
  const txtOneUserFound = getPhrase("oneUserFound");
  const txtMultipleUsersFound = getPhrase("multipleUsersFound").replaceAll(
    "{QUANTITY}",
    users.length
  );

  noResultsFoundEl.classList.add("d-none");

  // Display quantity of results
  if (users.length === 1) {
    quantityFoundEl.innerHTML = txtOneUserFound;
  } else if (users.length > 1) {
    quantityFoundEl.innerHTML = txtMultipleUsersFound;
  }

  // Render the users

  let listItems = ``;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const profileURL = `/admin/user/#/${user.userid}`;
    const fullName = `${user.firstname} ${user.lastname}`;
    const profilePhoto = user.profilephoto.replaceAll("400.jpg", "140.jpg");
    const regDate = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(user.createdAt));
    const txtRegistered = getPhrase("registered").replaceAll(
      "{DATE}",
      `<span class="registrationDate">
        ${regDate}
      </span>`
    );
    const statusCSS =
      user.userstatus === "frozen" ? "text-danger" : "text-success";
    const statusText =
      user.userstatus === "frozen"
        ? getPhrase("statusFrozen")
        : getPhrase("statusActive");
    const txtStatus = getPhrase("status").replaceAll(
      "{STATUS}",
      `<strong class="${statusCSS}">${statusText}</strong>`
    );
    const searchResult = `
      <a href="${profileURL}" class="list-group-item list-group-item-action border-bottom border-secondary py-4">
        <div class="media">
          <img class="mr-3 align-self-center" src="${profilePhoto}" alt="${fullName}" width="80" height="80" border="0" class="rounded-circle">
          <div class="media-body align-self-center">
            <h4 class="mt-0 mb-1">${fullName}</h4>
            <div class="my-1 small">${txtRegistered}</div>
            <div class="small">${txtStatus}</div>
          </div>
        </div>
      </a>
    `;
    listItems += searchResult;
  }

  usersListItemsEl.innerHTML = listItems;
  quantityFoundContainerEl.classList.remove("d-none");
  usersListEl.classList.remove("d-none");

  globalHidePageSpinner();
}

function search() {
  return new Promise(async (resolve, reject) => {
    const endpoint = `${getApiHost()}/admin-user-search`;
    const accessToken = await getAccessToken();
    const params = new URLSearchParams(document.location.search);
    const churchid = params.get("churchid");
    const firstname = params.get("firstname");
    const lastname = params.get("lastname");

    globalShowPageSpinner();

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        churchid: Number(churchid),
        firstname: firstname.trim(),
        lastname: lastname.trim(),
      }),
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data) {
          return reject("no data returned");
        }

        if (!data.users) {
          return reject("no users object returned");
        }

        if (data.users.length === 0) {
          const noResultsFoundEl = document.querySelector("#noResultsFound");
          const quantityFoundContainerEl = document.querySelector(
            "#quantityFoundContainer"
          );
          const usersListEl = document.querySelector("#usersList");
          quantityFoundContainerEl.classList.add("d-none");
          usersListEl.classList.add("d-none");
          noResultsFoundEl.classList.remove("d-none");

          globalHidePageSpinner();
          return resolve(data.users);
        }

        renderUsers(data.users);
        return resolve(data.users);
      })
      .catch((error) => {
        console.error(error);
        globalHidePageSpinner();
      });
  });
}

async function init() {
  await populateContent();
  populateSearchTerm();
  search();
}

init();
