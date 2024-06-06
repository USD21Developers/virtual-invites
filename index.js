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

async function redirectIfNecessary() {
  const launchedFromHomescreen =
    window.location.search === "?utm_source=homescreen" ? true : false;
  const settings = await localforage.getItem("settings");
  let redirectUrl;
  let redirect = false;

  if (!launchedFromHomescreen) return redirect;
  if (!settings) return redirect;
  if (!settings.openingPage) return redirect;

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

  return redirect;
}

async function init() {
  const isRedirecting = redirectIfNecessary();
  if (!isRedirecting) {
    toggleUsersIFollow();
    await populateContent();
    globalHidePageSpinner();
    syncEvents();
  }
}

init();
