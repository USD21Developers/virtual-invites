// Import Workbox libraries
// import { precacheAndRoute } from "workbox-precaching";
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js"
);

// Precache and route all assets
workbox.precaching.precacheAndRoute([{"revision":"2525ba72ea472c55bf8b2153e9ea9f11","url":"_assets/img/animated_checkmark.gif"},{"revision":"acc8530b443802f974d029539da39847","url":"_assets/img/avatar_female.svg"},{"revision":"0a2201888b5e03738e2b919b3b469530","url":"_assets/img/avatar_male.svg"},{"revision":"8c9a1bc2f5a27616a0edb3527dd767b3","url":"_assets/img/logo.svg"},{"revision":"5fd2fe001e2615b8dacec9db8fbe7aaf","url":"_assets/img/spinner.svg"},{"revision":"4a9abc4412f5071069695ede3991928e","url":"_assets/svg/icons/account_circle.svg"},{"revision":"f997137f7b7f30b40e7ad4f743d72e9b","url":"_assets/svg/icons/addToCalendar-Apple.svg"},{"revision":"7e50c5505b877c122d0db9e041d91ce0","url":"_assets/svg/icons/addToCalendar-Google.svg"},{"revision":"8f40d9f9ba96803443d2118e4304cfc6","url":"_assets/svg/icons/addToCalendar-iCalFile.svg"},{"revision":"04ca9eaafb7c2e4d46c6044f77ff20d8","url":"_assets/svg/icons/calendar.svg"},{"revision":"a4572fc955153ccdc7f602a4ab52e141","url":"_assets/svg/icons/camera.svg"},{"revision":"3cd34752163855b363dab61cefc3b95b","url":"_assets/svg/icons/chevron_right.svg"},{"revision":"7d170ab99cb1c6449445f0a90b842ea8","url":"_assets/svg/icons/close.svg"},{"revision":"8c6575d862d6610c5b3f58858158ebd6","url":"_assets/svg/icons/contact_support.svg"},{"revision":"9ed79be8b0a1f61194e99fbcb3695544","url":"_assets/svg/icons/delete-grey.svg"},{"revision":"261a1fca44f02dc7a319edaa79147cc2","url":"_assets/svg/icons/delete-red.svg"},{"revision":"87cbed57a6356fb4f067460715b46b54","url":"_assets/svg/icons/delete.svg"},{"revision":"c9d9b29fdf2ac8ba0fa5dc5ea7ecf881","url":"_assets/svg/icons/edit-grey.svg"},{"revision":"fd89e44692c100f28ced3f49e881d871","url":"_assets/svg/icons/edit-red.svg"},{"revision":"e71a1aaca1dc8c17d283d74f1f21400d","url":"_assets/svg/icons/edit.svg"},{"revision":"5b6bd9c9d11078eae6df6450aa9cc3ef","url":"_assets/svg/icons/email.svg"},{"revision":"d5f6b185c3072ce8de707b6c69f65e92","url":"_assets/svg/icons/event.svg"},{"revision":"66a7ed638c113b8b4321ae9077d7e812","url":"_assets/svg/icons/home.svg"},{"revision":"52b07740baf806d0df5115f657163df8","url":"_assets/svg/icons/insert_invitation.svg"},{"revision":"a12db7022c887007c7181b95e579444f","url":"_assets/svg/icons/list_alt.svg"},{"revision":"c9080957b2bc8063537c27ef1fc40518","url":"_assets/svg/icons/logout.svg"},{"revision":"14797d0c4dc33079cca993291dc49e5b","url":"_assets/svg/icons/menu.svg"},{"revision":"7dab3b33b8c272eeb8ac49a7a310c355","url":"_assets/svg/icons/people.svg"},{"revision":"b72b91c6272f9d9feaaecc3a7cd73aed","url":"_assets/svg/icons/phone.svg"},{"revision":"8c19cd35546b6b9f7a2cf2be8fde5502","url":"_assets/svg/icons/place.svg"},{"revision":"69527283a2f3604ca7e6e7f8c6b25d7c","url":"_assets/svg/icons/send.svg"},{"revision":"d5b3bfbb9dcb6eb099983522d0188542","url":"_assets/svg/icons/settings.svg"},{"revision":"a8e54483dc7ba55714a02e54dc1f0c3c","url":"_assets/svg/icons/sms.svg"},{"revision":"47048b9caa7dcd2e1b99d2e92c6a6944","url":"android-chrome-192x192.png"},{"revision":"3884fb820055f852ead922bbb5baf1c1","url":"android-chrome-512x512.png"},{"revision":"2f6ba3afa7265b79699c8707a8c9aab2","url":"apple-touch-icon.png"},{"revision":"4ecd00e01c69b1109d46e532bab4f861","url":"authorize/index.html"},{"revision":"e0d67a9efc0d75bfb3b71d9c139928cc","url":"authorize/logic.js"},{"revision":"f6c56be7938001df87037446b829848e","url":"css/daemonite-material.css"},{"revision":"c9f9cfbf3450ba7b88b7bde525cca86a","url":"css/global.css"},{"revision":"b3daf50a8304b7c8993d117a8ebd0fe3","url":"css/material-4.1.1-dist/js/material.min.js"},{"revision":"d130f178733149257cffc29274cf7af2","url":"events/add/index.html"},{"revision":"a99674f8df88f4d00fbe4c3600620d6b","url":"events/add/logic.js"},{"revision":"b26e9e0a144699d4f3750f706f0de47d","url":"events/add/style.css"},{"revision":"f1ed1a11e9c2550720ed5f9182724191","url":"events/delete/index.html"},{"revision":"49912f3dad1aff988481e092d68a10cf","url":"events/delete/logic.js"},{"revision":"10a16b1e7ee85e790b4c4e736cd48748","url":"events/edit/index.html"},{"revision":"445b6b74152a843b4b778077bca374fd","url":"events/edit/logic.js"},{"revision":"6fba3a01c156c3c79f162348972e63aa","url":"events/edit/style.css"},{"revision":"98afe2283987b38670fd4c02521d7963","url":"events/index.html"},{"revision":"737816978fcb295ee99dabe90758b66b","url":"events/logic.js"},{"revision":"7d5a9983483446cf7589187bc6ae440e","url":"events/needed/index.html"},{"revision":"d0c203126cb0187f4f108e4ec9f27439","url":"events/needed/logic.js"},{"revision":"012082919764ada46aec28180959d7ea","url":"events/needed/style.css"},{"revision":"2b278adcfb1bc2788b373b498e238a59","url":"events/style.css"},{"revision":"83b47baaedfab34c9861008fb2276ff0","url":"favicon-16x16.png"},{"revision":"2d2e271ef3b25b898cd3863e44dec06c","url":"favicon-32x32.png"},{"revision":"7d5f72f2f428b722fc0cc2a291134a2e","url":"follow/index.html"},{"revision":"66de199452ea26e5ccb8571c20372eb7","url":"follow/logic.js"},{"revision":"86ff907d30cb21d12a159bccb5149b00","url":"follow/style.css"},{"revision":"6127ccbf158f146b583a3588bd1e3bb7","url":"followers/index.html"},{"revision":"eb9897c5ded7ca595f5fac665ad98402","url":"followers/logic.js"},{"revision":"40779d6689d16a334b42d896a455e5b8","url":"followers/style.css"},{"revision":"30a5787b61861f928208ffe92f6e2f54","url":"following/index.html"},{"revision":"6559dce454bb1f1fd8f9ee29d300f26f","url":"following/logic.js"},{"revision":"28cba14e1762e5c1d7077280f47621be","url":"following/style.css"},{"revision":"b77bec378f688c0de95474ff9288886b","url":"followup/index.html"},{"revision":"468c41455c3f216a021bf58a90e1e7e2","url":"followup/logic.js"},{"revision":"d41d8cd98f00b204e9800998ecf8427e","url":"followup/style.css"},{"revision":"d41d8cd98f00b204e9800998ecf8427e","url":"index.css"},{"revision":"8c817e3a8d109426da38c7793603ff16","url":"index.html"},{"revision":"71f68e09c92c54339b04324d737ed564","url":"index.js"},{"revision":"66646d56cb31fa7b72bb64e898c2ab87","url":"invites/index.html"},{"revision":"ad8a99921a2bd95062e9cbbd26e8cea3","url":"invites/logic.js"},{"revision":"765fd56fe2deb0b4dd7d164f519eb7e6","url":"invites/style.css"},{"revision":"b5403a3e4eb21ee963207fb84bfa520a","url":"js/cdn.jsdelivr.net_npm_datebook@8.0.0_dist_datebook.min.js"},{"revision":"415ea4fbd13b4a5b82fd147710709ae2","url":"js/cdnjs.cloudflare.com_ajax_libs_croppie_2.6.5_croppie.min.css"},{"revision":"971e2b863ccdb5d43003cdc5f4e0d923","url":"js/cdnjs.cloudflare.com_ajax_libs_localforage_1.10.0_localforage.min.js"},{"revision":"5c3d21324208bc391e661eca7f6347fb","url":"js/cdnjs.cloudflare.com_ajax_libs_moment-timezone_0.5.34_moment-timezone-with-data-10-year-range.min.js"},{"revision":"5c158b940513c7dc2ebd901455e9b63d","url":"js/cdnjs.cloudflare.com_ajax_libs_moment.js_2.29.1_moment.min.js"},{"revision":"83fb8c4d9199dce0224da0206423106f","url":"js/cdnjs.cloudflare.com_ajax_libs_popper.js_1.14.3_umd_popper.min.js"},{"revision":"99b0a83cf1b0b1e2cb16041520e87641","url":"js/code.jquery.com_jquery-3.3.1.slim.min.js"},{"revision":"0099f79501eafbe2fd0d5457d8479e2e","url":"js/enforceaccess.js"},{"revision":"b676d1739a90e9a1b5f41c9c9dce80f1","url":"js/getEventFromDB.js"},{"revision":"62697fbf23175de108cf980bfcb70bab","url":"js/getMobileOperatingSystem.js"},{"revision":"ea5b58985a1d163fb81f17670e3374e6","url":"js/getPushSubscription.js"},{"revision":"f4210a40ebc48133facf152988f7292c","url":"js/getRelativeDate.js"},{"revision":"d89328c494d5d8170e04e181e76e17b9","url":"js/global.js"},{"revision":"6b7fb2ee130535419a67afb198f41c2b","url":"js/intl-tel-input-17.0.0/css/intlTelInput.min.css"},{"revision":"416250f60d785a2e02f17e054d2e4e44","url":"js/intl-tel-input-17.0.0/img/flags.png"},{"revision":"d429a5777afaf2fc349652e812e9bb11","url":"js/intl-tel-input-17.0.0/img/flags@2x.png"},{"revision":"9f9f0dcd6d9f29b53354bb582a04b38b","url":"js/intl-tel-input-17.0.0/js/data.min.js"},{"revision":"af98816dc416ce47a73b1c9b36cd6bfd","url":"js/intl-tel-input-17.0.0/js/intlTelInput.min.js"},{"revision":"8f3a2154b225b6257161c4dfc9b89c9c","url":"js/intl-tel-input-17.0.0/js/utils.js"},{"revision":"36cb0e834d725f98259a9decf3b173f9","url":"js/isDateInPast.js"},{"revision":"05e28e3f2f06a1bb057a97206cbd3009","url":"js/linkifyjs/linkify-html.min.js"},{"revision":"9fc36c3bca2d59c7d4304f5ab99bfdc3","url":"js/linkifyjs/linkify.min.js"},{"revision":"a531d97d539c3473b9059841ddda77e8","url":"js/olderbrowsers.js"},{"revision":"ea58889c516e953d6e78ca4834f834c4","url":"js/qrious/qrious.min.js"},{"revision":"9efba70d5adce9e3b93fe643abcb204a","url":"js/relativeTimeFormatPolyfill.js"},{"revision":"eb5fac582a82f296aeb74900b01a2fa3","url":"js/stackpath.bootstrapcdn.com_bootstrap_4.1.1_js_bootstrap.min.js"},{"revision":"af531e40511d6faecb8bcdfea25cb8d8","url":"js/sync.js"},{"revision":"7258a1d9d5f038e4e941278b10b64b76","url":"js/to-title-case.js"},{"revision":"02894d91a7958a583eaabe0d80479267","url":"login/forgot/index.html"},{"revision":"e7b30b3cc4031010f1187854dcc3aad4","url":"login/forgot/logic.js"},{"revision":"d39d35026d53368ce0ffbd423bb35348","url":"login/index.html"},{"revision":"46b9c117b0a0299acd25c6b30b61e8fe","url":"login/logic.js"},{"revision":"5c2280e32ac39e571a41ce38d69e9ac1","url":"login/reset/index.html"},{"revision":"850c147b312120562bc8be89abafc436","url":"login/reset/logic.js"},{"revision":"b063363dce207e98befe89b5ba2e020d","url":"logout/index.html"},{"revision":"618b3145f5af279fd5897955ec80ebf4","url":"logout/logic.js"},{"revision":"e73eda81aef42b060d32ad9cba86cfaa","url":"mstile-150x150.png"},{"revision":"ee6719fb4ce72f75315fc745b6acb3b5","url":"profile/index.html"},{"revision":"c7cf8e8717209cacf99e6219d7cf0281","url":"profile/logic.js"},{"revision":"0ce47de0c2913994aa2f7ec3a18a84c9","url":"profile/photo/index.html"},{"revision":"098d917e95c9524ddbaffa9f6f07f200","url":"profile/photo/logic.js"},{"revision":"661cde053055ef74de534d3e04edcaa1","url":"profile/photo/style.css"},{"revision":"61d45ddf1a5447bf85e65115c2c81dad","url":"profile/style.css"},{"revision":"a24cb5962308ea08ea0e6b206ea2e5c5","url":"r/index.html"},{"revision":"26df90e92ee9d87482298138d7639408","url":"r/logic.js"},{"revision":"0a579f9c510d200f2eb225d8a52b01bb","url":"r/style.css"},{"revision":"cc43ae7420b4fc8ccb063e6a3021040d","url":"register/confirm/index.html"},{"revision":"95c60ea582b34e756cad7076c66245e0","url":"register/confirm/logic.js"},{"revision":"ffd61034b846d03559130364302db494","url":"register/index.html"},{"revision":"d11f72221d9ec47da17e57da41ed3388","url":"register/logic.js"},{"revision":"9df4810de1904722cb7ccc90aaff961f","url":"register/style.css"},{"revision":"3979195946003abe5aeaaa745b7c06e3","url":"safari-pinned-tab.svg"},{"revision":"c142edb96fa285f42b990d57f1b4a8ba","url":"send/index.html"},{"revision":"262ec50daa69aa05b2c588b6ede20d8a","url":"send/logic.js"},{"revision":"a8148b383199fd29bfa065320f79b5e8","url":"send/style.css"},{"revision":"64fcedb737b9143326873acf4d480177","url":"settings/index.html"},{"revision":"11a2508a5d1e8d172057877122280deb","url":"settings/logic.js"},{"revision":"520c948aa8ac6918c1b99eb0dda1e63b","url":"settings/style.css"},{"revision":"237a314404300bb244328a02ac0e478d","url":"site.webmanifest"},{"revision":"f54a34df3c83414a2a9f3da81d0014c7","url":"templates/default/index.css"},{"revision":"65eb2232bf51f6117366863f30c0137d","url":"templates/default/index.html"},{"revision":"25f3e8d1dd9347decc0b961047ce0a33","url":"templates/default/index.js"},{"revision":"b196aafce2133810d53255d75a270200","url":"u/e/index.html"},{"revision":"2f663e10d05a281e1178669f49a6f7fb","url":"u/e/logic.js"},{"revision":"477e4d30325ce8a09d83388024af2262","url":"u/e/style.css"},{"revision":"7b45de7224cc7ba163723e5cfac30fba","url":"u/index.html"},{"revision":"9fdc6ae0e95a683caf25ae17d8219b83","url":"u/logic.js"},{"revision":"3497b4f549ca576769576fa07d9bc281","url":"u/style.css"}]);

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
  const { title, body, data } = event.data.json();
  const options = {
    title: title,
    body: body,
    icon: "./android-chrome-192x192.png",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click event
self.addEventListener("notificationclick", (event) => {
  const { data } = event.notification;
  const { followUpURL } = data;
  console.log(event.notification);
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
