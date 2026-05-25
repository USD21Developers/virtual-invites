function getPushSubscription() {
  return new Promise((resolve, reject) => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then(function (registration) {
          if (!registration) {
            throw new Error("service worker could not be registered");
          }

          if (!registration.pushManager) {
            throw new Error("push messages are not supported");
          }

          registration.pushManager
            .getSubscription()
            .then(function (subscription) {
              if (subscription) {
                return resolve(subscription);
              }

              const urlBase64ToUint8Array = (base64String) => {
                const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
                const base64 = (base64String + padding)
                  .replace(/\-/g, "+")
                  .replace(/_/g, "/");

                const rawData = window.atob(base64);
                const outputArray = new Uint8Array(rawData.length);

                for (let i = 0; i < rawData.length; ++i) {
                  outputArray[i] = rawData.charCodeAt(i);
                }
                return outputArray;
              };

              const VAPID_PUBLIC_KEY =
                window.location.hostname === "localhost"
                  ? "BKnHjp6KUZvweNGC36UO8MnmydUW-xqgANz4K9UovnZpJXx4uWNa4aP1MJ_eFfj66s6kridOKRUA-Wy05FceJoY"
                  : "BLvcNxeIt_iASml9uC0DGSN0Akkeoc-QxoeGjz09FLu7G3YLxLTftw0pIKOqFtwdssmqQeWnKAfIAs98RmnQUP4";

              const subscribeOptions = {
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
              };

              return registration.pushManager.subscribe(subscribeOptions);
            })
            .then(function (pushSubscription) {
              return resolve(pushSubscription);
            })
            .catch((error) => {
              console.error(error);
              console.log("subscription doesn't exist");
              return reject(new Error("subscription doesn't exist"));
            });
        })
        .catch((error) => {
          return reject(null);
        });
    } else {
      const msg = "Push messaging is not supported";
      console.warn(msg);
      return reject(new Error(msg));
    }
  });
}
