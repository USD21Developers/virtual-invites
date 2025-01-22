function renderUsers(users) {
  // TODO
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
