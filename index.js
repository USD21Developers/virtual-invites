async function toggleUsersIFollow() {
  const el = document.querySelector("[data-i18n='followinglink']");
  const followedUsers = await localforage.getItem("followedUsers");
  const userid = getUserId();
  const link = `following/#${userid}`;
  let isRedirecting = false;

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

  if (!launchedFromHomescreen) return;
  if (!settings) return;
  if (!settings.openingPage) return;

  switch (settings.openingPage) {
    case "home":
      break;
    case "send an invite":
      redirectUrl = "/send/";
      isRedirecting = true;
      break;
    case "my invites":
      redirectUrl = "/invites/";
      isRedirecting = true;
      break;
    case "follow up list":
      redirectUrl = "/followup/";
      isRedirecting = true;
      break;
    default:
      break;
  }

  if (isRedirecting) {
    window.location.href = redirectUrl;
  }
}

async function init() {
  redirectIfNecessary(isRedirecting);
  toggleUsersIFollow();
  await populateContent();
  if (!isRedirecting) globalHidePageSpinner();
  syncEvents();
}

init();
