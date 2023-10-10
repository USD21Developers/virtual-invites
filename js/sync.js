function backgroundSync() {
  return new Promise(async (resolve, reject) => {
    //
  });
}

function syncChurches() {
  const endpoint = `${getApiServicesHost()}/churches`;
  const isOnline = navigator.onLine;
  const controller = new AbortController();
  const timeout = 60000;

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
  const timeout = 60000;

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
    const timeout = 60000;
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
    const controller = new AbortController();
    const timeout = 60000;
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
            const decrypted = await invitesCrypto.decrypt(
              datakey,
              encryptionObject
            );
            decryptedInvite.recipient.sms = decrypted;
          }

          // Replace e-mail encryption object with decrypted string
          if (invite.recipient.email) {
            const encryptionObject = JSON.parse(invite.recipient.email);
            const decrypted = await invitesCrypto.decrypt(
              datakey,
              encryptionObject
            );
            decryptedInvite.recipient.email = decrypted;
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
            .then(() => {
              resolve(invites);
            });
        });
      })
      .catch((err) => {
        reject(new Error(err));
      });

    setTimeout(() => {
      controller.abort();
      reject(new Error("Invites sync timed out"));
    }, timeout);
  });
}

function syncNotesForInvite(
  invitationid,
  unsyncedNotes = [],
  notesSelector = "#notes",
  notesSpinnerSelector = "#notes-spinner",
  noNotesSelector = "#no-notes-container"
) {
  return new Promise(async (resolve, reject) => {
    const notesEl = document.querySelector(notesSelector);
    const notesSpinnerEl = document.querySelector(notesSpinnerSelector);
    const noNotesEl = document.querySelector(noNotesSelector);
    const allNotesLocal = (await localforage.getItem("notes")) || [];
    const endpoint = `${getApiHost()}/notes-for-invite`;
    const controller = new AbortController();
    const accessToken = await getAccessToken();

    // Show spinner if no notes were found
    if (!allNotesLocal.length) {
      if (notesEl) notesEl.innerHTML = "";
      if (notesSpinnerEl) notesSpinnerEl.classList.remove("d-none");
      if (noNotesEl) noNotesEl.classList.add("d-none");
    }

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

        // Hide notes spinner
        notesSpinnerEl.classList.add("d-none");

        const notes = data.notes.map(async (note) => {
          const decryptedNote = note;

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
        });

        // Remove unsyncedNotes because sync succeeded
        await localforage.removeItem("unsyncedNotes");

        // Overwrite notes with response from the server
        Promise.all(notes).then(async (notesForThisInvite) => {
          const allInvites = (await localforage.getItem("invites")) || [];
          const thisInvite =
            allInvites.find((item) => item.invitationid === invitationid) ||
            null;
          const allNotes = (await localforage.getItem("notes")) || [];
          const allNotesHashBefore = await invitesCrypto.hash(
            JSON.stringify(allNotes)
          );

          if (!thisInvite) {
            return reject(
              new Error("cannot sync notes because invite was not found")
            );
          }

          const notesForOtherInvites = allNotes.filter((item) => {
            if (item.invitationid !== invitationid) {
              if (item.recipient.sms && thisInvite.recipient.sms) {
                if (thisInvite.recipient.sms === item.recipient.sms) {
                  return true;
                }
              } else if (item.recipient.email && thisInvite.recipient.email) {
                if (thisInvite.recipient.email === item.recipient.email) {
                  return true;
                }
              } else {
                return false;
              }
            } else {
              return false;
            }
          });

          // Combine notes for this invite with notes for other invites
          if (notesForThisInvite.length) {
            allNotes.concat(notesForThisInvite);
          }
          if (notesForOtherInvites.length) {
            allNotes.concat(notesForOtherInvites);
          }

          // Sort all notes by date
          const allNotesSorted = allNotes.length
            ? allNotes.slice().sort(compareDates)
            : [];

          // Determine whether it's necessary to show a toast saying that notes were updated
          const allNotesHashAfter = await invitesCrypto.hash(
            JSON.stringify(allNotesSorted)
          );
          if (allNotesHashBefore !== allNotesHashAfter) {
            const msgNotesUpdated = getGlobalPhrase("notesUpdatedReload");
            showToast(msgNotesUpdated, null, "info");
          }

          // If no notes were found, update UI accordingly
          if (!allNotesSorted.length) {
            if (notesEl) notesEl.innerHTML = "";
            if (noNotesEl) noNotesEl.classList.remove("d-none");
          }

          // Overwrite notes
          localforage.setItem("notes", allNotesSorted).then(() => {
            resolve(notes);
          });
        });
      })
      .catch((err) => {
        reject(new Error(err));
      });

    setTimeout(() => {
      controller.abort();
      reject(new Error("Sync of notes for an invite timed out"));
    }, 30000);
  });
}
