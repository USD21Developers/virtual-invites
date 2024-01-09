async function redirectIfNecessary() {
  let redirectedOnOpen = sessionStorage.getItem("redirectedOnOpen") || null;

  if (redirectedOnOpen) {
    return (window.location.href = redirectedOnOpen);
  }

  const settings = await localforage.getItem("settings");
  const { openingPage } = settings;

  switch (openingPage) {
    case "home":
      redirectedOnOpen = "/";
      break;
    case "send an invite":
      redirectedOnOpen = "/send/";
      break;
    case "my invites":
      redirectedOnOpen = "/invites/";
      break;
    case "follow up list":
      redirectedOnOpen = "/followup/";
      break;
    default:
      redirectedOnOpen = "/";
  }

  sessionStorage.setItem("redirectedOnOpen", redirectedOnOpen);
  window.location.href = redirectedOnOpen;
}

async function init() {
  redirectIfNecessary();
  await populateContent();
  globalHidePageSpinner();
  syncEvents();
}

init();
