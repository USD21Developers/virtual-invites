async function init() {
  await populateContent();
  globalHidePageSpinner();
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    registrations.forEach(function (registration) {
      if (registration.scope.includes("/unsubscribe/done/")) {
        registration
          .unregister()
          .then(function (success) {
            console.log("Service worker unregistered:", success);
            init();
          })
          .catch(function (error) {
            console.error("Failed to unregister service worker:", error);
          });
      }
    });
  });
}
