async function syncEvents() {
  const endpoint = `${getApiHost()}/sync-events`;
  const accessToken = await getAccessToken();
  const isOnline = navigator.onLine;
  const controller = new AbortController();
  const timeout = 8000;

  return new Promise((resolve, reject) => {
    if (!isOnline)
      return reject(new Error("Events sync failed because user is offline"));

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
        const { events, eventsByFollowedUsers, followedUsers } = data;
        let localEvents = (await localforage.getItem("events")) || [];
        let localEventsByFollowedUsers =
          (await localforage.getItem("eventsByFollowedUsers")) || [];

        // Validate sync response
        if (!Array.isArray(events)) {
          hideToast();
          reject(new Error("'events' in sync response must be an array."));
        }
        if (!Array.isArray(eventsByFollowedUsers)) {
          hideToast();
          reject(
            new Error(
              "'eventsByFollowedUsers' in sync response must be an array."
            )
          );
        }

        // Compare local vs. remote events, and update the UI only if a change occurred
        const hashEvents = {};
        const eventsLocalJSON = JSON.stringify(localEvents);
        const eventsRemoteJSON = JSON.stringify(events);
        hashEvents.local =
          (await invitesCrypto.hash(eventsLocalJSON)) || JSON.stringify([]);
        hashEvents.remote =
          (await invitesCrypto.hash(eventsRemoteJSON)) || JSON.stringify([]);

        // Compare local vs. remote events by followed users, and update the UI only if a change occurred
        const hashEventsByFollowedUsers = {};
        const eventsByFollowedUsersLocalJSON = JSON.stringify(
          localEventsByFollowedUsers
        );
        const eventsByFollowedUsersRemoteJSON = JSON.stringify(
          eventsByFollowedUsers
        );
        hashEventsByFollowedUsers.local =
          (await invitesCrypto.hash(eventsByFollowedUsersLocalJSON)) ||
          JSON.stringify([]);
        hashEventsByFollowedUsers.remote =
          (await invitesCrypto.hash(eventsByFollowedUsersRemoteJSON)) ||
          JSON.stringify([]);

        hideToast();

        // Update IndexedDB
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
        await localforage.setItem("followedUsers", followedUsers);

        // Update the view if events have changed
        let eventsHaveChanged = false;
        if (
          hashEvents.local !== hashEvents.remote ||
          hashEventsByFollowedUsers.local !== hashEventsByFollowedUsers.remote
        ) {
          eventsHaveChanged = true;
        }

        resolve({
          eventsHaveChanged: eventsHaveChanged,
          events: events,
          eventsByFollowedUsers: eventsByFollowedUsers,
          followedUsers: followedUsers,
        });
      })
      .catch((err) => {
        console.error(err);
        hideToast();
        reject(err);
      });

    setTimeout(() => {
      controller.abort();
      reject(new Error("Events sync timed out"));
    }, timeout);
  });
}
