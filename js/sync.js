async function syncEvents() {
  const endpoint = `${getApiHost()}/sync-events`;
  const accessToken = await getAccessToken();
  const isOnline = navigator.onLine;
  const controller = new AbortController();
  const timeout = 8000;

  return new Promise((resolve, reject) => {
    if (!isOnline)
      return reject(new Error("sync failed because user is offline"));

    fetch(endpoint, {
      mode: "cors",
      method: "GET",
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
      signal: controller.signal,
      keepalive: true,
    })
      .then((res) => res.json())
      .then(async (data) => {
        const { events, eventsByFollowedUsers } = data;
        let localEvents = (await localforage.getItem("events")) || [];
        let localEventsByFollowedUsers =
          (await localforage.getItem("eventsByFollowedUsers")) || [];

        // Validate sync response
        if (!Array.isArray(events)) {
          hideToast();
          reject(new Error("Events in sync response must be an array."));
        }
        if (!Array.isArray(eventsByFollowedUsers)) {
          hideToast();
          reject(
            new Error(
              "Events by followed users in sync response must be an array."
            )
          );
        }

        // Compare local vs. remote events, and update the UI only if a change occurred
        const hash = {};
        const eventsLocalJSON = JSON.stringify(localEvents);
        const eventsRemoteJSON = JSON.stringify(events);
        hash.local =
          (await invitesCrypto.hash(eventsLocalJSON)) || JSON.stringify([]);
        hash.remote =
          (await invitesCrypto.hash(eventsRemoteJSON)) || JSON.stringify([]);

        // Compare local vs. remote events by followed users, and update the UI only if a change occurred
        const hashFollowedUsers = {};
        const eventsFollowedUsersLocalJSON = JSON.stringify(
          localEventsByFollowedUsers
        );
        const eventsFollowedUsersRemoteJSON = JSON.stringify(
          eventsByFollowedUsers
        );
        hashFollowedUsers.local =
          (await invitesCrypto.hash(eventsFollowedUsersLocalJSON)) ||
          JSON.stringify([]);
        hashFollowedUsers.remote =
          (await invitesCrypto.hash(eventsFollowedUsersRemoteJSON)) ||
          JSON.stringify([]);

        hideToast();

        // Update IDB
        if (events.length) {
          await localforage.setItem("events", events);
        } else {
          await localforage.setItem("events", []);
        }
        if (eventsByFollowedUsers.length) {
          await localforage.setItem(
            "eventsByFollowedUsers",
            eventsByFollowedUsers
          );
        } else {
          await localforage.setItem("eventsByFollowedUsers", []);
        }

        // Update the view if events have changed
        let changed = false;
        if (
          hash.local !== hash.remote ||
          hashFollowedUsers.local !== hashFollowedUsers.remote
        ) {
          changed = true;
        }

        resolve(events, eventsByFollowedUsers, changed);
      })
      .catch((err) => {
        console.error(err);
        hideToast();
        reject(err);
      });

    setTimeout(() => {
      controller.abort();
      reject(new Error("event sync timed out"));
    }, timeout);
  });
}
