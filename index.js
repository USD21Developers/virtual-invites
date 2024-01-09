async function redirectIfNecessary() {
  const launchedFromHomescreen =
    window.location.search === "?utm_source=homescreen" ? true : false;
  const settings = await localforage.getItem("settings");
  const { openingPage } = settings;
  let redirectUrl = "/";

  if (launchedFromHomescreen) {
    switch (openingPage) {
      case "home":
        redirectUrl = "/";
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
        redirectUrl = "/";
    }

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
