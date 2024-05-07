// Import Workbox libraries
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js"
);

// Precache and route all assets (this includes a "fetch" listener, so no need to add one for precached assets)
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

// Allow updated service worker to become active immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Add runtime caching
/* self.addEventListener("fetch", (event) => {
  if (
    event.request.url.includes("/i18n/") &&
    event.request.url.endsWith(".json")
  ) {
    event.respondWith(
      caches.open("translations").then((cache) => {
        return cache.match(event.request).then((response) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return response || fetchPromise;
        });
      })
    );
  }
}); */

// Add push event listener
self.addEventListener("push", (event) => {
  const { title, body, data } = event.data.json();
  const options = {
    body: body,
    data: data,
    icon: "./android-chrome-192x192.png",
  };
  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "pushReceived" });
        });
      });
    })
  );
});

// Handle notification click event
self.addEventListener("notificationclick", (event) => {
  if (!event.hasOwnProperty("notification")) return;
  if (!event.notification.hasOwnProperty("data")) return;
  if (!event.notification.data.hasOwnProperty("followUpURL")) return;

  const followUpURL = event.notification.data.followUpURL;
  event.notification.close();
  event.waitUntil(clients.openWindow(followUpURL));
});

function setCountry(country) {
  localStorage.setItem("country", country);
}

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const refreshToken = localStorage.getItem("refreshToken") || "";

    if (!refreshToken.length) return reject("refresh token missing");

    let isLocalhost = false;
    if (location && location.hasOwnProperty("hostname")) {
      if (
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1"
      ) {
        isLocalhost = true;
      }
    }

    const apiHost = isLocalhost
      ? "http://localhost:4000/invites"
      : "https://api.usd21.org/invites";

    const endpoint = `${apiHost}/refresh-token`;

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        refreshToken: refreshToken,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        switch (data.msg) {
          case "tokens renewed":
            const { accessToken, refreshToken } = data;
            localStorage.setItem("refreshToken", refreshToken);
            const country =
              JSON.parse(atob(accessToken.split(".")[1])).country || "us";
            setCountry(country);
            resolve(accessToken);
            break;
          default:
            resolve("could not get access token");
            break;
        }
      })
      .catch((error) => {
        console.log(error);
        return reject(error);
      });
  });
}

// If the push subscription changes (e.g. expires and is auto-renewed), update the it on the server
self.addEventListener(
  "pushsubscriptionchange",
  (event) => {
    console.log(`"pushsubscriptionchange" event was fired`, event);
    const conv = (val) =>
      btoa(String.fromCharCode.apply(null, new Uint8Array(val)));
    const getPayload = (subscription) => ({
      endpoint: subscription.endpoint,
      publicKey: conv(subscription.getKey("p256dh")),
      authToken: conv(subscription.getKey("auth")),
    });

    const subscription = self.registration.pushManager
      .subscribe(event.oldSubscription.options)
      .then(async (subscription) => {
        const endpoint = `${getApiHost()}/push-update-subscription`;
        const accessToken = await getAccessToken();

        fetch(endpoint, {
          mode: "cors",
          method: "POST",
          headers: {
            "Content-type": "application/json",
            authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            oldSubscription: getPayload(event.oldSubscription),
            newSubscription: getPayload(subscription),
          }),
        });
      });
    event.waitUntil(subscription);
  },
  false
);
