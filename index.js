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
      break;
    case "my invites":
      redirectUrl = "/invites/";
      break;
    case "follow up list":
      redirectUrl = "/followup/";
      break;
    default:
      break;
  }

  if (redirectUrl) {
    window.location.href = redirectUrl;
  }
}

async function init() {
  redirectIfNecessary();
  await populateContent();
  globalHidePageSpinner();
  syncEvents();
}

init();
