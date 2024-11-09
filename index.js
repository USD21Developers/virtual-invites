function redirectIfNecessary() {
  return new Promise(async (resolve, reject) => {
    const launchedFromHomescreen =
      window.location.search === "?utm_source=homescreen" ? true : false;
    const settings = await localforage.getItem("settings");
    let redirectUrl = "";
    let redirect = false;

    if (!launchedFromHomescreen) return resolve(false);
    if (!settings) return resolve(false);
    if (!settings.openingPage) return resolve(false);

    switch (settings.openingPage) {
      case "home":
        redirect = false;
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

    if (redirect && redirectUrl.length) {
      window.location.href = redirectUrl;
      return resolve(true);
    }

    setTimeout(() => {
      return resolve(redirect);
    }, 4000);
  });
}

function showContentForLeaders() {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) return;

  const { canAuthorize, canAuthToAuth } = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  );

  if (!canAuthorize && !canAuthToAuth) return;

  document
    .querySelectorAll(".leadersOnly")
    .forEach((item) => item.classList.remove("d-none"));
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
    } else {
      return resolve();
    }
  });
}

async function toggleUsersIFollow() {
  localforage.getItem("followedUsers").then((followedUsers) => {
    if (Array.isArray(followedUsers) && followedUsers.length) {
      const el = document.querySelector("[data-i18n='followinglink']");
      if (!el) return;
      const userid = getUserId();
      const link = `following/#${userid}`;
      el.setAttribute("href", link);
      el.classList.remove("d-none");
    }
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
    populateContent().then(() => {
      toggleUsersIFollow();
      globalHidePageSpinner();
    });
  }

  showContentForLeaders();
}

init();
