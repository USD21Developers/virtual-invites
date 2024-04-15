importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js"
);

workbox.window.addEventListener("push", (event) => {
  // Handle push event here
  console.log("Push event received:", event);
});

workbox.window.addEventListener("notificationclick", (event) => {
  // Handle notification click event here
  console.log("Notification clicked:", event);
});

self.__WB_MANIFEST;
