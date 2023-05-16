function backgroundSync() {
  return new Promise(async (resolve, reject) => {
    //
  });
}

function syncChurches() {
  const endpoint = `${getApiServicesHost()}/churches`;
  const isOnline = navigator.onLine;
  const controller = new AbortController();
  const timeout = 8000;

  return new Promise((resolve, reject) => {
    if (!isOnline)
      return reject(new Error("Churches sync failed because user is offline"));

    fetch(endpoint, {
      mode: "cors",
      method: "GET",
      signal: controller.signal,
      keepalive: true,
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data.msgType !== "success") {
          throw new Error(data.msg);
        }

        const { churches } = data;
        const churchesJSON = JSON.stringify(churches);
        const churchesJSONStored = localStorage.getItem("churches");
        const hashChurchesRemote = await invitesCrypto.hash(churchesJSON);
        const hashChurchesLocal = await invitesCrypto.hash(churchesJSONStored);
        let churchesHaveChanged = false;

        if (hashChurchesLocal !== hashChurchesRemote) {
          churchesHaveChanged = true;
          localStorage.setItem("churches", churchesJSON);
        }

        resolve({
          churchesHaveChanged: churchesHaveChanged,
          churches: churches,
        });
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });

    setTimeout(() => {
      controller.abort();
      reject(new Error("Churches sync timed out"));
    }, timeout);
  });
}

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
        // hideToast();
        reject(err);
      });

    setTimeout(() => {
      controller.abort();
      reject(new Error("Events sync timed out"));
    }, timeout);
  });
}

function syncFollowing() {
  return new Promise(async (resolve, reject) => {
    const isOnline = navigator.onLine;
    const controller = new AbortController();
    const timeout = 8000;
    const userid = getUserId();
    const accessToken = await getAccessToken();
    const endpoint = `${getApiHost()}/following/${userid}`;

    if (!isOnline)
      return reject(new Error("Following sync failed because user is offline"));

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
        const { msg, following } = data;

        if (msg === "retrieved list of users following") {
          await localforage.setItem("following", following);
          return resolve(following);
        }

        throw new Error(msg);
      })
      .catch((err) => {
        console.error(err);
        // hideToast();
        reject(err);
      });

    setTimeout(() => {
      controller.abort();
      reject(new Error("Following sync timed out"));
    }, timeout);
  });
}

function syncInvites() {
  return new Promise(async (resolve, reject) => {
    const isOnline = navigator.onLine;
    /* const controller = new AbortController();
    const timeout = 8000; */
    const unsyncedInvites =
      (await localforage.getItem("unsyncedInvites")) || [];
    const endpoint = `${getApiHost()}/sync-invites`;

    if (!isOnline) {
      return reject(new Error("Invites sync failed:  user is offline"));
    }

    const accessToken = await getAccessToken();

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        unsyncedInvites: unsyncedInvites,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
      keepalive: true,
    })
      .then((res) => res.json())
      .then(async (data) => {
        const datakey = localStorage.getItem("datakey") || "";

        if (!datakey.length) {
          const errorMessage = "Invites sync failed:  datakey is missing";
          console.error(errorMessage);
          return reject(new Error(errorMessage));
        }

        if (!Array.isArray(data.invites)) {
          const errorMessage =
            "Invites sync failed:  returned invites key is not an array";
          console.error(errorMessage);
          return reject(new Error(errorMessage));
        }

        const decrypted = data.invites.map(async (invite) => {
          if (invite.recipientsms !== null) {
            const encryptionObject = invite.recipientsms;
            const decrypted = await invitesCrypto.decrypt(
              datakey,
              encryptionObject
            );
            invite.recipientsms = decrypted;
          }

          if (invite.recipientemail !== null) {
            const encryptionObject = invite.recipientemail;
            const decrypted = await invitesCrypto.decrypt(
              datakey,
              encryptionObject
            );
            invite.recipientemail = decrypted;
          }

          return invite;
        });

        await localforage.setItem("unsyncedInvites", []);
        await localforage.setItem("invites", decrypted);

        resolve();
      })
      .catch((err) => {
        reject(new Error(err));
      });

    /* setTimeout(() => {
      controller.abort();
      reject(new Error("Invites sync timed out"));
    }, timeout); */
  });
}
