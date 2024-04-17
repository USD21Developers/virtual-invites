// Import Workbox libraries
import { precacheAndRoute } from "workbox-precaching";

// Precache and route all assets
precacheAndRoute(self.__WB_MANIFEST);

// Add runtime caching
self.addEventListener("fetch", (event) => {
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
});

// Add push event listener
self.addEventListener("push", (event) => {
  const title = "Push Notification";
  const options = {
    body: event.data.text(),
    icon: "./android-chrome-192x192.png",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click event
self.addEventListener("notificationclick", (event) => {
  console.log(event);
  event.notification.close();
  event.waitUntil(clients.openWindow("https://example.com"));
});
