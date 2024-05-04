// Import Workbox libraries
// import { precacheAndRoute } from "workbox-precaching";
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js"
);

// Precache and route all assets
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

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

    const isLocalhost =
      location.hostname === "localhost" || location.hostname === "127.0.0.1"
        ? true
        : false;

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
self.addEventListener("pushsubscriptionchange", async (event) => {
  const { oldSubscription, newSubscription } = event;
  const endpoint = `${getApiHost}/push-update-subscription`;
  const accessToken = await getAccessToken();

  event.waitUntil(
    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        oldSubscription: oldSubscription,
        newSubscription: newSubscription,
      }),
    })
  );
});

self.addEventListener("message", (event) => {
  // Handle messages received from main thread
  const message = event.data;
  if (message.type === "hello") {
    console.log("Message received in service worker: ", message.data);

    // Send a response back to the main thread
    event.source.postMessage({
      type: "response",
      data: "Hello from service worker!",
    });
  }
});
