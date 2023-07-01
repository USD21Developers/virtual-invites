function populateLinksToFollowedUsers() {
  document.querySelectorAll("a[href='../following/']").forEach((item) => {
    const userId = getUserId();
    const href = `../following/#${userId}`;
    item.setAttribute("href", href);
  });
}

function renderEvents() {
  return new Promise((resolve, reject) => {
    localforage
      .getItem("events")
      .then((myEvents) => {
        const el = document.querySelector("#myEvents");
        let eventsHTML = "";
        if (!Array.isArray(myEvents)) return resolve();
        if (!myEvents.length) {
          el.innerHTML = `
            <div class="text-center">
              ${getPhrase("noEventsFromMe")}
            </div>`;
          return resolve();
        }
        myEvents.forEach((myEvent) => {
          const {
            country,
            lang,
            eventid,
            frequency,
            multidaybegindate,
            multidayenddate,
            startdate,
            timezone,
            title,
            locationname,
            locationaddressline1,
            locationaddressline2,
            locationaddressline3,
          } = myEvent;
          const locale = `${lang.toLowerCase()}-${country.toUpperCase()}`;
          const from = getPhrase("from");
          const to = getPhrase("to");
          let when = "";

          if (frequency === "once") {
            if (multidaybegindate) {
              const multidayBeginDateLocal = new Date(
                moment.tz(multidaybegindate, timezone).format()
              );
              const multidayEndDateLocal = new Date(
                moment.tz(multidayenddate, timezone).format()
              );
              const whenDateFrom = Intl.DateTimeFormat(locale, {
                dateStyle: "short",
              }).format(multidayBeginDateLocal);
              const whenTimeFrom = Intl.DateTimeFormat(locale, {
                timeStyle: "short",
              }).format(multidayBeginDateLocal);
              const whenDateTo = Intl.DateTimeFormat(locale, {
                dateStyle: "short",
              }).format(multidayEndDateLocal);
              const whenTimeTo = Intl.DateTimeFormat(locale, {
                timeStyle: "short",
              }).format(multidayEndDateLocal);
              when = `
                ${from} ${whenDateFrom} &bull; ${whenTimeFrom}<br>
                ${to} ${whenDateTo} &bull; ${whenTimeTo}<br>
              `;
            } else {
              const whenDateLocal = new Date(
                moment.tz(startdate, timezone).format()
              );
              const whenDate = Intl.DateTimeFormat(locale, {
                dateStyle: "short",
              }).format(whenDateLocal);
              const whenTime = Intl.DateTimeFormat(locale, {
                timeStyle: "short",
              }).format(whenDateLocal);
              when = `
                ${whenDate} &bull; ${whenTime}
              `;
            }
          } else {
            let whenDate = "";
            switch (frequency) {
              case "Every Sunday":
                whenDate = getPhrase("frequencyEverySunday");
                break;
              case "Every Monday":
                whenDate = getPhrase("frequencyEveryMonday");
                break;
              case "Every Tuesday":
                whenDate = getPhrase("frequencyEveryTuesday");
                break;
              case "Every Wednesday":
                whenDate = getPhrase("frequencyEveryWednesday");
                break;
              case "Every Thursday":
                whenDate = getPhrase("frequencyEveryThursday");
                break;
              case "Every Friday":
                whenDate = getPhrase("frequencyEveryFriday");
                break;
              case "Every Saturday":
                whenDate = getPhrase("frequencyEverySaturday");
                break;
            }
            const whenTime = Intl.DateTimeFormat(locale, {
              timeStyle: "short",
              timeZone: "UTC",
            }).format(new Date(startdate.replace("Z", "")));
            when = `${whenDate} &bull; ${whenTime}`;
          }

          const template = `
            <div class="row border-bottom pb-2 mb-2">
              <div class="col-8 mb-3 pl-0">
                <strong>${title}</strong>
                <div class="small secondary">${when}</div>
                <div class="small text-secondary">
                  ${
                    locationname && locationname.length
                      ? locationname + "<br>"
                      : ""
                  }
                  ${
                    locationaddressline1 && locationaddressline1.length
                      ? locationaddressline1
                      : ""
                  }
                  ${
                    locationaddressline2 && locationaddressline2.length
                      ? "<br>" + locationaddressline2
                      : ""
                  }
                  ${
                    locationaddressline3 && locationaddressline3.length
                      ? "<br>" + locationaddressline3
                      : ""
                  }
                </div>
              </div>
              <div class="col-4 text-right text-nowrap px-0">
                <a
                  href="edit/#${eventid}"
                  class="action_editLink d-inline-block text-center"
                >
                  <span class="material-icons material-symbols-outlined">
                    edit
                  </span>
                  <div class="mt-1 small">${getPhrase("btnEdit")}</div>
                </a>

                <a
                  href="delete/#${eventid}"
                  class="action_deleteLink danger d-inline-block text-center"
                >
                  <span class="material-icons material-symbols-outlined">
                    delete
                  </span>
                  <div class="mt-1 small">${getPhrase("btnDelete")}</div>
                </a>
              </div>
            </div>
          `;
          eventsHTML += template;
        });
        el.innerHTML = eventsHTML;
        showMaterialIcons();
        resolve(myEvents);
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
}

async function renderFollowedEvents() {
  return new Promise(async (resolve, reject) => {
    const el = document.querySelector("#followedEvents");
    const eventsByFollowedUsers = await localforage.getItem(
      "eventsByFollowedUsers"
    );
    const followedUsers = await localforage.getItem("followedUsers");

    if (!followedUsers) return [];

    let html = "";

    if (!followedUsers.length) {
      el.innerHTML = `
        <div class="text-muted text-center">
          ${getPhrase("notFollowingAnyone")}
        </div>`;
      return resolve();
    } else if (!eventsByFollowedUsers.length) {
      el.innerHTML = `
        <div class="text-center" id="noEventsFromUsersIFollow">
          ${getPhrase("noEventsFromUsersIFollow")}
        </div>`;
      return resolve();
    }

    followedUsers.forEach(async (followedUser) => {
      const eventsByFollowedUser = eventsByFollowedUsers.filter(
        (item) => item.createdBy === followedUser.userid
      );
      if (eventsByFollowedUser.length) {
        const followedUserEventsHTML = await renderFollowedUser(
          followedUser,
          eventsByFollowedUser
        );
        el.innerHTML += followedUserEventsHTML;
      }
    });

    resolve(html);
  });
}

async function renderFollowedUser(followedUser, eventsByFollowedUser) {
  const {
    churchid,
    firstname,
    gender,
    lang,
    lastname,
    profilephoto,
    userid,
    usertype,
  } = followedUser;
  const name = `${firstname} ${lastname}`;
  let church = getStoredChurch(churchid);
  if (!church) {
    await getChurches();
    church = getStoredChurch(churchid);
  }
  const churchName = church.name;
  let churchPlace = church.place;

  const loggedInUserId = getUserId();
  const userCountry = JSON.parse(
    atob(localStorage.getItem("refreshToken").split(".")[1])
  ).country;
  const userLang = getLang();
  const countries = JSON.parse(localStorage.getItem("countries")).names;
  const followedUserCountryName = getCountryName(church.country, countries);
  const phraseClose = getGlobalPhrase("close");

  if (userCountry !== church.country) {
    churchPlace = `${church.place}<br>${followedUserCountryName}`;
  }

  const followedUserEventHTML = await renderListOfEvents(eventsByFollowedUser);

  let html = `
    <div class="card border-dark bg-light mb-4 followedUser" data-followid="${userid}">
      <div class="card-header border-bottom-0 pb-0">
        <button
          type="button"
          class="close ml-3 mb-3"
          data-dismiss="alert"
          data-followid="${userid}"
          aria-label="${phraseClose}"
        >
          <span aria-hidden="true">×</span>
        </button>
        <div class="media">
          <a href="../u/#${userid}">
            <img
              class="align-self-start mr-3"
              width="90"
              height="90"
              src="${profilephoto}"
              alt="${name}"
            />
          </a>
          <div class="media-body">
            <a
              href="../u/#${userid}"
              class="text-underline font-weight-bold text-dark"
            >
              ${name}
            </a>
            <div>
              <small>
                ${churchName}<br />
                ${churchPlace}
              </small>
            </div>
          </div>
        </div>
      </div>
      <div class="card-body">
        <div class="list-group">
          ${followedUserEventHTML}
        </div>
      </div>
    </div>
  `;

  return html;
}

function renderListOfEvents(eventsByFollowedUser) {
  return new Promise(async (resolve, reject) => {
    const badgeBibleTalk = `
      <div class="badge badge-light border border-dark badge-pill mt-1 mb-2 mr-2">
        ${getGlobalPhrase("bibletalk")}
      </div>
    `;

    const badgeChurchService = `
      <div class="badge badge-light border border-dark badge-pill mt-1 mb-2 mr-2">
        ${getGlobalPhrase("churchservice")}
      </div>
    `;

    const badgeOnline = `
      <div class="badge badge-light border border-dark badge-pill mt-1 mb-2 mr-2">
        ${getGlobalPhrase("streamed")}
      </div>
    `;

    let listHTML = "";

    for (let i = 0; i < eventsByFollowedUser.length; i++) {
      const eventInfo = eventsByFollowedUser[i];
      const { eventid } = eventInfo;
      const { churchid, hasvirtual, title, type } = eventInfo;
      const eventDateTime = await showEventDateTime(eventInfo);
      let badgeHTML = "";

      if (type === "bible talk") {
        badgeHTML = badgeBibleTalk;
      } else if (type === "church") {
        badgeHTML = badgeChurchService;
      }

      if (hasvirtual === 1) {
        badgeHTML += badgeOnline;
      }

      listHTML += `
      <a
        href="#"
        class="list-group-item list-group-item-action"
        data-eventid="${eventid}"
      >
        <div class="text-dark"><strong>${title}</strong></div>
        <div>${eventDateTime}</div>
        <div class="eventBadges">
          ${badgeHTML}
        </div>
      </a>
    `;
    }

    resolve(listHTML);
  });
}

async function onFollowedEventClicked(e) {
  e.preventDefault();
  const eventid = Number(e.currentTarget.getAttribute("data-eventid"));
  const events = await localforage.getItem("eventsByFollowedUsers");

  if (!Array.isArray(events) || !events.length) {
    console.error("events not found in IndexedDB");
    return;
  }

  const event = events.filter((item) => item.eventid === eventid);

  if (!event.length) {
    console.error(`event ${eventid} not found`);
    return;
  }

  const eventInfo = event[0];

  showEvent(eventInfo);
}

async function onFollowedUserUnfollowed(e) {
  e.preventDefault();
  const followId = Number(e.currentTarget.getAttribute("data-followid"));
  const followedUsers = await localforage.getItem("followedUsers");

  if (!Array.isArray(followedUsers)) {
    console.error(`user ${followId} not found`);
    return;
  }

  const userInfo = followedUsers.filter((item) => item.userid === followId);

  if (!userInfo.length) {
    console.error(`info for user ${followId} not found`);
  }

  const { firstname, lastname, profilephoto, gender } = userInfo[0];

  const profilePhotoUrl = profilephoto.replace("400", "140");

  const title = getPhrase("unfollowConfirm");

  let header = getPhrase("unfollowHeader");

  header = header.replace("{firstname}", firstname);
  header = header.replace("{lastname}", lastname);

  const warningText =
    gender === "male" ? getPhrase("unfollowMale") : getPhrase("unfollowFemale");

  const body = `
    <div class="text-center mb-3">
      <img src="${profilePhotoUrl}" width="140" height="140" class="profilePhoto">
    </div>

    <p class="text-center">
      <strong>${header}</strong>
    </p>
    
    <p class="text-center">
      ${warningText}
    </p>

    <p class="text-center mt-4">
      <button class="btn btn-danger text-white" id="modalConfirmUnfollow" data-followid="${followId}">
        ${getGlobalPhrase("unfollow")}
      </button> 
      <button class="btn btn-link ml-4" data-dismiss="modal">
        ${getGlobalPhrase("cancel")}
      </button>
    </p>
  `;

  showModal(body, title, true);

  document
    .querySelector("#modalConfirmUnfollow")
    .addEventListener("click", onUnfollowConfirmed);
}

async function onUnfollowConfirmed(e) {
  const userid = Number(e.target.getAttribute("data-followid"));

  // Unfollow from IndexedDB
  const eventsByFollowedUsers = await localforage.getItem(
    "eventsByFollowedUsers"
  );
  const followedUsers = await localforage.getItem("followedUsers");
  const eventsByFollowedUsers2 = eventsByFollowedUsers.filter(
    (item) => item.createdBy !== userid
  );
  const followedUsers2 = followedUsers.filter((item) => item.userid !== userid);
  await localforage.setItem("eventsByFollowedUsers", eventsByFollowedUsers2);
  await localforage.setItem("followedUsers", followedUsers2);

  // Close modal
  $("#modal").modal("hide");

  // Remove list of events of followed user
  const followedEvents = document.querySelector("#followedEvents");
  const followedUserEvents = document.querySelector(
    `.followedUser[data-followid="${userid}"]`
  );
  if (followedUserEvents) followedUserEvents.remove();
  if (Array.isArray(followedUsers2)) {
    if (!followedUsers2.length) {
      followedEvents.innerHTML = `
        <div class="text-muted text-center">
          ${getPhrase("notFollowingAnyone")}
        </div>
      `;
    }
  }

  (async () => {
    const followedUsersIDB = await localforage.getItem("followedUsers");
    if (followedUsersIDB) {
      const updated = followedUsersIDB?.filter(
        (item) => item.userid !== Number(userid)
      );
      await localforage.setItem("followedUsers", updated);
    }

    const eventsByFollowedUsers = await localforage.getItem(
      "eventsByFollowedUsers"
    );
    if (eventsByFollowedUsers) {
      const updated = eventsByFollowedUsers?.filter(
        (item) => item.createdBy !== Number(userid)
      );
      await localforage.setItem("eventsByFollowedUsers", updated);
    }
  })();

  $("#modal").on("hidden.bs.modal", (e) => {
    popupQuantityOfEvents("unfollow");
  });

  // Unfollow from API (silently)
  const accessToken = await getAccessToken();
  const endpoint = `${getApiHost()}/unfollow-user`;
  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      userid: userid,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
    }),
  })
    .then((res) => res.json())
    .then(async (data) => {
      const { msg } = data;

      if (msg === "unfollow successful") {
        syncEvents();
        syncFollowing();
      }

      if (msg !== "unfollow successful") {
        throw new Error(msg);
      }
    })
    .catch((e) => console.error(e));
}

async function showEvent(event) {
  const {
    churchid,
    contactemail,
    contactfirstname,
    contactlastname,
    contactphone,
    contactphonecountrydata,
    country,
    createdBy,
    description,
    duration,
    durationInHours,
    eventid,
    frequency,
    hasvirtual,
    lang,
    locationaddressline1,
    locationaddressline2,
    locationaddressline3,
    locationcoordinates,
    locationname,
    locationvisibility,
    multidaybegindate,
    multidayenddate,
    otherlocationdetails,
    startdate,
    timezone,
    title,
    type,
    virtualconnectiondetails,
    sharewithfollowers,
  } = event;

  const eventTimeAndDateHTML = await showEventDateTime(event);
  let locationHTML = "";
  let modalHTML = "";
  let footerHTML = "";
  const userid = getUserId();
  const operatingSystem = getMobileOperatingSystem();
  const mapCoordinates = locationcoordinates
    ? `${locationcoordinates.x}, ${locationcoordinates.y}`
    : "";
  let coordinatesLink = "";
  if (operatingSystem === "iOS") {
    coordinatesLink = `https://maps.apple.com/?daddr=${mapCoordinates}&t=m`;
  } else {
    coordinatesLink = `https://www.google.com/maps/search/?api=1&query=${mapCoordinates}`;
  }

  if (locationvisibility === "public") {
    if (locationaddressline1 && locationaddressline1.length) {
      locationHTML = `
        <div class="location">
          ${
            locationname && locationname.length
              ? "<div class='location_name'>" + locationname + "</div>"
              : ""
          }

          <div class='mb-2 location_address'>
            ${
              locationaddressline1.length
                ? "<div class='location_address-line'>" +
                  locationaddressline1 +
                  "</div>"
                : ""
            }
            ${
              locationaddressline2 && locationaddressline2.length
                ? "<div class='location_address-line'>" +
                  locationaddressline2 +
                  "</div>"
                : ""
            }
            ${
              locationaddressline3 && locationaddressline3.length
                ? "<div class='location_address-line'>" +
                  locationaddressline3 +
                  "</div>"
                : ""
            }
          </div>

          ${
            mapCoordinates.length
              ? "<p><a href='" +
                coordinatesLink +
                "' class='text-primary'>" +
                getPhrase("mapAndDirections") +
                "</a></p>"
              : ""
          }

          ${
            otherlocationdetails && otherlocationdetails.length
              ? "<div class='mt-2 location_details'>" +
                breakify(otherlocationdetails) +
                "</div>"
              : ""
          }
        </div>
      `;
    } else {
      if (locationcoordinates) {
        locationHTML = `
          <a href="${coordinatesLink}" class="text-primary">
            ${getPhrase("mapAndDirections")}
          </a>
        `;
      }
    }
  }

  if (locationvisibility === "discreet") {
    locationHTML = getPhrase("inquireForLocation");
  }

  modalHTML = `
    <div class="mb-4">
      <div>
        <strong class="text-dark">${getPhrase("datetime")}</strong>
      </div>
      ${eventTimeAndDateHTML}
    </div>

    <div class="my-4">
      <div>
        <strong class="text-dark">${getPhrase("place")}</strong>
      </div>
      ${locationHTML}
    </div>
    
    <div class="mt-4 mb-3">
      <div>
        <strong class="text-dark">${getPhrase("description")}</strong>
      </div>
      ${breakify(description)}
    </div>
  `;

  if (userid === createdBy) {
    footerHTML = `
      <a href="delete/#${eventid}" class="btn btn-link text-uppercase" data-dismiss="modal">
        ${getPhrase("cancel")}
      </a>
      <a href="delete/#${eventid}" class="btn btn-danger text-uppercase ml-2">
        ${getPhrase("delete")}
      </a>
      <a href="edit/#${eventid}" class="btn btn-info text-uppercase ml-2">
        ${getPhrase("edit")}
      </a>
    `;
  }

  const modalEl = document.querySelector("#modal");
  modalEl.querySelector(".modal-title").innerHTML = title;
  modalEl.querySelector(".modal-body").innerHTML = modalHTML;
  modalEl.querySelector(".modal-footer").innerHTML = footerHTML;

  $("#modal").modal();
}

function onPageShow(event) {
  if (event.persisted) {
    window.location.reload();
  }
}

function attachListeners() {
  document
    .querySelector("#followedEvents")
    .querySelectorAll("a[data-eventid]")
    .forEach((item) => {
      item.addEventListener("click", onFollowedEventClicked);
    });

  document
    .querySelector("#followedEvents")
    .querySelectorAll("[data-dismiss='alert']")
    .forEach((item) =>
      item.addEventListener("click", onFollowedUserUnfollowed)
    );

  window.addEventListener("pageshow", onPageShow);
}

async function init() {
  await populateContent();
  await renderEvents();
  await renderFollowedEvents();
  populateLinksToFollowedUsers();

  const { eventsHaveChanged } = await syncEvents();

  globalHidePageSpinner();

  if (eventsHaveChanged) {
    globalShowPageSpinner();
    await renderEvents();
    await renderFollowedEvents();
    populateLinksToFollowedUsers();
    globalHidePageSpinner();
  }

  attachListeners();
}

init();
