importScripts("/third_party/workbox/workbox-v7.0.0/workbox-sw.js");

workbox.setConfig({
  modulePathPrefix: "/third_party/workbox/workbox-v7.0.0/",
});

// Use workbox methods
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST, {
  directoryIndex: "index.html",
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
      caches.open("user-images").then((cache) => {
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
  let clickURL = "";
  try {
    clickURL = event.notification.data.clickURL;
  } catch (err) {
    clickURL = null;
    console.log(err);
  }
  event.notification.close();

  if (clickURL) {
    event.waitUntil(clients.openWindow(clickURL));
  }
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
