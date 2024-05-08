const CACHE_NAME = "invites";
const urlsToCache = [
  "/",
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js",
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Cache all the assets
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Activate the new service worker immediately
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener("activate", (event) => {
  // Claim clients immediately to ensure that the new service worker takes control
  event.waitUntil(self.clients.claim());

  // Clean up old caches if any
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name !== CACHE_NAME;
          })
          .map((name) => {
            return caches.delete(name);
          })
      );
    })
  );
});

// Add runtime caching
self.addEventListener("fetch", (event) => {
  if (
    (event.request.url.includes("/profiles/") &&
      event.request.url.endsWith("__400.jpg")) ||
    (event.request.url.includes("/profiles/") &&
      event.request.url.endsWith("__140.jpg"))
  ) {
    event.respondWith(
      caches.open("invites").then((cache) => {
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

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache-first strategy
      return response || fetch(event.request);
    })
  );
});

// Import workbox after caching
importScripts("/workbox-sw.js");

// Use workbox methods
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST, {
  directoryIndex: "index.html",
});

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
  if (!event.notification.data.hasOwnProperty("clickURL")) return;

  const clickURL = event.notification.data.clickURL;
  event.notification.close();
  event.waitUntil(clients.openWindow(clickURL));
});

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

        fetch(endpoint, {
          mode: "cors",
          method: "POST",
          headers: {
            "Content-type": "application/json",
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
