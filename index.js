async function toggleUsersIFollow() {
  const el = document.querySelector("[data-i18n='followinglink']");
  const followedUsers = await localforage.getItem("followedUsers");
  const userid = getUserId();
  const link = `following/#${userid}`;

  if (Array.isArray(followedUsers)) {
    if (followedUsers.length) {
      el.setAttribute("href", link);
      el.classList.remove("d-none");
    }
  }
}

function redirectIfNecessary() {
  return new Promise(async (resolve, reject) => {
    const launchedFromHomescreen =
      window.location.search === "?utm_source=homescreen" ? true : false;
    const settings = await localforage.getItem("settings");
    let redirectUrl;
    let redirect = false;

    if (!launchedFromHomescreen) return resolve(redirect);
    if (!settings) return resolve(redirect);
    if (!settings.openingPage) return resolve(redirect);

    switch (settings.openingPage) {
      case "home":
        break;
      case "send an invite":
        redirectUrl = "/send/";
        if (launchedFromHomescreen) redirect = true;
        break;
      case "my invites":
        redirectUrl = "/invites/";
        if (launchedFromHomescreen) redirect = true;
        break;
      case "follow up list":
        redirectUrl = "/followup/";
        if (launchedFromHomescreen) redirect = true;
        break;
      default:
        break;
    }

    if (redirect) {
      window.location.href = redirectUrl;
    }

    return resolve(redirect);
  });
}

function syncOnLogin() {
  return new Promise((resolve, reject) => {
    const proceedWithSync = sessionStorage.getItem("syncOnLogin")
      ? true
      : false;

    if (proceedWithSync) {
      sessionStorage.removeItem("syncOnLogin");
      Promise.all([
        getCountries(getLang()),
        syncChurches(),
        syncEvents(),
        syncInvites(),
        syncUpdatedInvites(),
        syncAllNotes(),
        syncSettings(),
      ]).then((result) => {
        try {
          syncPushSubscription();
        } catch (error) {
          console.error(error);
        }

        return resolve();
      });
    }

    return resolve();
  });
}

async function init() {
  await syncOnLogin();

  const isRedirecting = await redirectIfNecessary();
  if (!isRedirecting) {
    window.history.replaceState(
      null,
      null,
      location.origin + location.pathname.split("/")[0]
    );
    toggleUsersIFollow();
    await populateContent();
    globalHidePageSpinner();
  }
}

init();
