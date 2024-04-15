importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js"
);

workbox.window.addEventListener("push", function (e) {
  const dataObj = e.data.json();
  const notificationData = dataObj.notification;
  const notificationTitle = notificationData.title;
  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.image,
  };

  //Do some logic to fulfill the notificationOptions
  e.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

workbox.window.addEventListener("notificationclick", (event) => {
  // Handle notification click event here
  console.log("Notification clicked:", event);
});

self.__WB_MANIFEST;
