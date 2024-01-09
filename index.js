async function redirectIfNecessary() {
  let redirectedOnOpen = sessionStorage.getItem("redirectedOnOpen") || null;

  // If we've already redirected, bail out here.
  if (redirectedOnOpen) {
    return;
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

  // Save the fact (and the place) that we redirected
  sessionStorage.setItem("redirectedOnOpen", redirectedOnOpen);

  // Must be the "Opening Page," so redirect.
  window.location.href = redirectedOnOpen;
}

async function init() {
  redirectIfNecessary();
  await populateContent();
  globalHidePageSpinner();
  syncEvents();
}

init();
