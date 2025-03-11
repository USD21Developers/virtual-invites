function backgroundSync() {
  return new Promise(async (resolve, reject) => {
    //
  });
}

function syncChurches() {
  const endpoint = `${getApiHost()}/sync-churches`;
  const isOnline = navigator.onLine;
  const controller = new AbortController();
  const timeout = 60000;
  let syncSuccessful = false;

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

        const { churches, churchesWithRegisteredUsers } = data;
        const churchesJSON = JSON.stringify(churches);
        const churchesWithRegisteredUsersJSON = JSON.stringify(
          churchesWithRegisteredUsers
        );
        const churchesJSONStored = localStorage.getItem("churches");
        const hashChurchesRemote = await invitesCrypto.hash(churchesJSON);
        const hashChurchesLocal = await invitesCrypto.hash(churchesJSONStored);
        let churchesHaveChanged = false;

        if (hashChurchesLocal !== hashChurchesRemote) {
          churchesHaveChanged = true;
          localStorage.setItem("churches", churchesJSON);
        }

        localStorage.setItem(
          "churchesWithRegisteredUsers",
          churchesWithRegisteredUsersJSON
        );

        syncSuccessful = true;

        return resolve({
          churchesHaveChanged: churchesHaveChanged,
          churches: churches,
          churchesWithRegisteredUsers: churchesWithRegisteredUsers,
        });
      })
      .catch((err) => {
        console.error(err);
        return reject(err);
      });

    setTimeout(() => {
      if (!syncSuccessful) {
        controller.abort(`"Timeout reached (${timeout / 1000} seconds)"`);
        return reject(new Error("Churches sync timed out"));
      }
    }, timeout);
  });
}

async function syncEvents() {
  const endpoint = `${getApiHost()}/sync-events`;
  const accessToken = await getAccessToken();
  const isOnline = navigator.onLine;
  const controller = new AbortController();
  const timeout = 60000;
  let syncSuccessful = false;

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
        const {
          events,
          eventsByFollowedUsers,
          followedUsers,
          eventsFromMyInvites,
        } = data;
        let localEvents = (await localforage.getItem("events")) || [];
        let localEventsByFollowedUsers =
          (await localforage.getItem("eventsByFollowedUsers")) || [];

        // Validate sync response
        if (!Array.isArray(events)) {
          hideToast();
          return reject(
            new Error("'events' in sync response must be an array.")
          );
        }
        if (!Array.isArray(eventsByFollowedUsers)) {
          hideToast();
          return reject(
            new Error(
              "'eventsByFollowedUsers' in sync response must be an array."
            )
          );
        }
        if (!Array.isArray(eventsFromMyInvites)) {
          hideToast();
          return reject(
            new Error(
              "'eventsFromMyInvites' in sync response must be an array."
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

        // Compare local vs. remote events for all invites, and update the UI only if a change occurred
        const hasheventsFromMyInvites = {};
        const localEventsFromMyInvites = await localforage.getItem(
          "eventsFromMyInvites"
        );
        const eventsFromMyInvitesLocalJSON = JSON.stringify(
          localEventsFromMyInvites
        );
        const eventsFromMyInvitesRemoteJSON =
          JSON.stringify(eventsFromMyInvites);
        hasheventsFromMyInvites.local =
          (await invitesCrypto.hash(eventsFromMyInvitesLocalJSON)) ||
          JSON.stringify([]);
        hasheventsFromMyInvites.remote =
          (await invitesCrypto.hash(eventsFromMyInvitesRemoteJSON)) ||
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
        await localforage.setItem("eventsFromMyInvites", eventsFromMyInvites);

        // Update the view if events have changed
        let eventsHaveChanged = false;
        if (
          hashEvents.local !== hashEvents.remote ||
          hashEventsByFollowedUsers.local !==
            hashEventsByFollowedUsers.remote ||
          hasheventsFromMyInvites.local !== hasheventsFromMyInvites.remote
        ) {
          eventsHaveChanged = true;
        }

        syncSuccessful = true;

        return resolve({
          eventsHaveChanged: eventsHaveChanged,
          events: events,
          eventsByFollowedUsers: eventsByFollowedUsers,
          followedUsers: followedUsers,
        });
      })
      .catch((err) => {
        console.error(err);
        // hideToast();
        return reject(err);
      });

    setTimeout(() => {
      if (!syncSuccessful) {
        controller.abort(`"Timeout reached (${timeout / 1000} seconds)"`);
        return reject(new Error("Events sync timed out"));
      }
    }, timeout);
  });
}

function syncFollowing() {
  return new Promise(async (resolve, reject) => {
    const isOnline = navigator.onLine;
    const controller = new AbortController();
    const timeout = 60000;
    const userid = getUserId();
    const accessToken = await getAccessToken();
    const endpoint = `${getApiHost()}/following/${userid}`;
    let syncSuccessful = false;

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
          syncSuccessful = true;
          return resolve(following);
        }

        throw new Error(msg);
      })
      .catch((err) => {
        console.error(err);
        // hideToast();
        return reject(err);
      });

    setTimeout(() => {
      if (!syncSuccessful) {
        controller.abort(`"Timeout reached (${timeout / 1000} seconds)"`);
        return reject(new Error("Following sync timed out"));
      }
    }, timeout);
  });
}

function syncPushSubscription() {
  return new Promise((resolve, reject) => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          if (!registration) {
            return reject(new Error("service worker could not be registered"));
          }

          if (!registration.pushManager) {
            return reject(new Error("push messages are not supported"));
          }

          registration.pushManager
            .getSubscription()
            .then(async (subscription) => {
              if (!subscription) return resolve();

              const isOnline = navigator.onLine;
              const controller = new AbortController();
              const timeout = 60000;
              const endpoint = `${getApiHost()}/push-subscribe`;

              if (!isOnline) {
                return reject(
                  new Error("Push subscription sync failed: user is offline")
                );
              }

              const accessToken = await getAccessToken();
              let syncSuccessful = false;

              fetch(endpoint, {
                mode: "cors",
                method: "POST",
                body: JSON.stringify({
                  subscriptionObject: subscription,
                }),
                headers: new Headers({
                  "Content-Type": "application/json",
                  authorization: `Bearer ${accessToken}`,
                }),
                keepalive: true,
              })
                .then((res) => res.json())
                .then((data) => {
                  if (data.msgType === "success") {
                    syncSuccessful = true;
                    return resolve();
                  }

                  return reject(data.msg);
                })
                .catch((err) => {
                  return reject(new Error(err));
                });

              setTimeout(() => {
                controller.abort(
                  `"Timeout reached (${timeout / 1000} seconds)"`
                );
                return reject(new Error("Push subscription sync timed out"));
              }, timeout);
            })
            .catch((error) => {
              console.error(error);
              return reject(error);
            });
        })
        .catch((error) => {
          return reject(error);
        });
    }
  });
}

function syncUpdatedInvites() {
  return new Promise(async (resolve, reject) => {
    const unsyncedFollowups =
      (await localforage.getItem("unsyncedFollowups")) || [];
    const isOnline = navigator.onLine;
    const controller = new AbortController();
    const timeout = 60000;
    const endpoint = `${getApiHost()}/sync-updated-invites`;

    if (!isOnline) {
      return reject(new Error("Updated invites sync failed: user is offline"));
    }

    const accessToken = await getAccessToken();
    let syncSuccessful = false;

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        unsyncedFollowups: unsyncedFollowups,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
      keepalive: true,
    })
      .then((res) => res.json())
      .then((data) => {
        // Remove unsynced updates because sync succeeded
        localforage.removeItem("unsyncedFollowups");
        syncSuccessful = true;

        return resolve();
      })
      .catch((err) => {
        return reject(new Error(err));
      });

    setTimeout(() => {
      if (!syncSuccessful) {
        controller.abort(`Timeout reached (${timeout / 1000} seconds)`);
        return reject(new Error("Updated invites sync timed out"));
      }
    }, timeout);
  });
}

function syncInvites() {
  return new Promise(async (resolve, reject) => {
    const isOnline = navigator.onLine;
    const controller = new AbortController();
    const timeout = 60000;
    const unsyncedInvites =
      (await localforage.getItem("unsyncedInvites")) || [];

    const endpoint = `${getApiHost()}/sync-invites`;

    if (!isOnline) {
      return reject(new Error("Invites sync failed:  user is offline"));
    }

    const accessToken = await getAccessToken();
    let syncSuccessful = false;

    const invitesBeforeSync = await localforage.getItem("invites");
    const hashBeforeSync = await invitesCrypto.hash(
      JSON.stringify(invitesBeforeSync)
    );

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

        // Add interactions
        const allInteractions = data.interactions;

        const invites = data.invites.map(async (invite) => {
          const decryptedInvite = invite;
          const interactions = allInteractions
            ? allInteractions.filter(
                (interaction) =>
                  interaction.invitationid === invite.invitationid
              )
            : [];

          // Attach interactions to invite
          invite.interactions = interactions;

          // Replace SMS encryption object with decrypted string
          if (invite.recipient.sms) {
            const encryptionObject = JSON.parse(invite.recipient.sms);
            const decrypted = await invitesCrypto
              .decrypt(datakey, encryptionObject)
              .catch((error) => {
                decryptedInvite.recipient.sms = "";
                return;
              });
            decryptedInvite.recipient.sms = decrypted;
          }

          // Replace e-mail encryption object with decrypted string
          if (invite.recipient.email) {
            const encryptionObject = JSON.parse(invite.recipient.email);
            const decrypted = await invitesCrypto
              .decrypt(datakey, encryptionObject)
              .catch((error) => {
                decryptedInvite.recipient.email = "";
                return;
              });

            if (validateEmail(decrypted)) {
              decryptedInvite.recipient.email = decrypted;
            } else {
              decryptedInvite.recipient.email = "";
            }
          }

          return decryptedInvite;
        });

        // Remove unsyncedInvites because sync succeeded
        localforage.removeItem("unsyncedInvites");

        // Overwrite invites with response from the server
        Promise.all(invites).then((invites) => {
          localforage
            .setItem("invites", invites)
            .then(() => {
              localforage.setItem(
                "eventsFromMyInvites",
                data.eventsFromMyInvites
              );
            })
            .then(async () => {
              const invitesAfterSync = JSON.stringify(
                await localforage.getItem("invites")
              );
              const hashAfterSync = await invitesCrypto.hash(invitesAfterSync);
              let changed = false;

              if (hashBeforeSync !== hashAfterSync) {
                changed = true;
              }

              syncSuccessful = true;
              return resolve({
                changed: changed,
                invites: invites,
              });
            });
        });
      })
      .catch((err) => {
        return reject(new Error(err));
      });

    setTimeout(() => {
      if (!syncSuccessful) {
        controller.abort(`Timeout reached (${timeout / 1000} seconds)`);
        return reject(new Error("Invites sync timed out"));
      }
    }, timeout);
  });
}

function syncNotesForInvite(invitationid, unsyncedNotes = []) {
  return new Promise(async (resolve, reject) => {
    const endpoint = `${getApiHost()}/notes-for-invite`;
    const controller = new AbortController();
    const accessToken = await getAccessToken();
    let syncSuccessful = false;

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        invitationid: invitationid,
        unsyncedNotes: unsyncedNotes,
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
          const errorMessage =
            "Sync of notes for an invite failed:  datakey is missing";
          console.error(errorMessage);
          return reject(new Error(errorMessage));
        }

        if (!Array.isArray(data.notes)) {
          const errorMessage =
            "Sync of notes for an invite failed:  returned notes key is not an array";
          console.error(errorMessage);
          return reject(new Error(errorMessage));
        }

        const notes = data.notes.map(async (note) => {
          const decryptedNote = note;

          if (!note.hasOwnProperty("recipient")) {
            return;
          }

          if (!note.hasOwnProperty("summary")) {
            return;
          }

          if (!note.hasOwnProperty("text")) {
            return;
          }

          try {
            if (note.recipient) {
              const encryptionObject = note.recipient;
              const decrypted = await invitesCrypto.decrypt(
                datakey,
                encryptionObject
              );
              decryptedNote.recipient = JSON.parse(decrypted);
            }

            if (note.summary) {
              const encryptionObject = note.summary;
              const decrypted = await invitesCrypto.decrypt(
                datakey,
                encryptionObject
              );
              decryptedNote.summary = JSON.parse(decrypted);
            }

            if (note.text) {
              const encryptionObject = note.text;
              const decrypted = await invitesCrypto.decrypt(
                datakey,
                encryptionObject
              );
              decryptedNote.text = JSON.parse(decrypted);
            }

            return decryptedNote;
          } catch (error) {
            return resolve();
          }
        });

        // Remove unsyncedNotes because sync succeeded
        localforage.removeItem("unsyncedNotes");

        // Wait for notes to be decrypted then return them, just for this invite
        Promise.all(notes).then((notesForThisInvite) => {
          syncSuccessful = true;
          return resolve(notesForThisInvite);
        });
      })
      .catch((err) => {
        return reject(new Error(err));
      });

    setTimeout(() => {
      if (!syncSuccessful) {
        controller.abort(`Timeout reached (30 seconds)`);
        return reject(new Error("Sync of notes for an invite timed out"));
      }
    }, 30000);
  });
}

function syncAllNotes() {
  return new Promise(async (resolve, reject) => {
    const endpoint = `${getApiHost()}/sync-notes`;
    const controller = new AbortController();
    const unsyncedNotes = (await localforage.getItem("unsyncedNotes")) || [];
    const accessToken = await getAccessToken();
    let syncSuccessful = false;

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({ unsyncedNotes }),
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
          const errorMessage = "Sync of notes failed: datakey is missing";
          console.error(errorMessage);
          return reject(new Error(errorMessage));
        }

        if (!Array.isArray(data.notes)) {
          const errorMessage =
            "Sync of notes failed: returned notes key is not an array";
          console.error(errorMessage);
          return reject(new Error(errorMessage));
        }

        const notesPromises = data.notes.map(async (note) => {
          try {
            if (note.recipient) {
              note.recipient = JSON.parse(
                await invitesCrypto.decrypt(datakey, note.recipient)
              );
            }
            if (note.summary) {
              note.summary = JSON.parse(
                await invitesCrypto.decrypt(datakey, note.summary)
              );
            }
            if (note.text) {
              note.text = JSON.parse(
                await invitesCrypto.decrypt(datakey, note.text)
              );
            }
            return note;
          } catch (error) {
            console.error("Failed to decrypt note:", error);
            return null; // Skip this note
          }
        });

        // Handle all decryption results and remove failed ones
        Promise.allSettled(notesPromises).then((results) => {
          const validNotes = results
            .filter(
              (result) => result.status === "fulfilled" && result.value !== null
            )
            .map((result) => result.value);

          localforage.setItem("notes", validNotes).then(() => {
            syncSuccessful = true;
            return resolve(validNotes);
          });
        });
      });

    setTimeout(() => {
      if (!syncSuccessful) {
        controller.abort();
        return reject(new Error("Sync of all notes timed out"));
      }
    }, 30000);
  });
}

function syncInviteNotifications() {
  return new Promise(async (resolve, reject) => {
    const unsyncedInviteNotifications = await localforage.getItem(
      "unsyncedInviteNotifications"
    );
    const endpoint = `${getApiHost()}/sync-notifications`;
    const accessToken = await getAccessToken();

    if (!unsyncedInviteNotifications) return resolve();
    if (!Array.isArray(unsyncedInviteNotifications)) return resolve();
    if (!unsyncedInviteNotifications.length) return resolve();

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        unsyncedInviteNotifications: unsyncedInviteNotifications,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data.msgType && data.msgType === "error") {
          return reject(new Error(data.msg));
        }

        await localforage.removeItem("unsyncedInviteNotifications");

        return resolve();
      });
  });
}

function syncSettings() {
  return new Promise(async (resolve, reject) => {
    const unsyncedSettings =
      (await localforage.getItem("unsyncedSettings")) || false;
    const endpoint = `${getApiHost()}/sync-settings`;
    const accessToken = await getAccessToken();
    const settingsBefore = await localforage.getItem("settings");
    const hashBefore = await invitesCrypto.hash(JSON.stringify(settingsBefore));

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        unsyncedSettings: unsyncedSettings,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
      keepalive: true,
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data.msgType === "success") {
          const settings = data.settings;
          const pushSubscriptions = data.pushSubscriptions;
          localforage.removeItem("unsyncedSettings");
          const hashAfter = await invitesCrypto.hash(JSON.stringify(settings));
          const changed = hashBefore === hashAfter ? false : true;
          settings.changed = changed;
          await localforage.setItem("settings", settings);
          await localforage.setItem("pushSubscriptions", pushSubscriptions);
          return resolve(data);
        } else {
          return reject();
        }
      })
      .catch((err) => {
        console.error(err);
        return reject(err);
      });
  });
}
