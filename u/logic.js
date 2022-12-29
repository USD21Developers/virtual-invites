function followUser(userid, e) {
  return new Promise(async (resolve, reject) => {
    const endpoint = `${getApiHost()}/follow-user`;
    const accessToken = await getAccessToken();

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        userid: userid,
      }),
      keepalive: true,
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        switch (data.msg) {
          case "follow successful":
            e.target.setAttribute("data-status", "followed");
            e.target.classList.remove("btn-primary");
            e.target.classList.add("btn-success");
            const userFollowed = data.followedid;
            const whenFollowed = moment
              .tz(moment.now(), moment.tz.guess())
              .format();
            updateFollowActivity(userFollowed, whenFollowed, "followed");
            updateFollowCounts(data.otherUserNow);
            resolve(data.msg);
            break;
          default:
            e.target.setAttribute("data-status", "follow");
            e.target.innerText = getPhrase("btnFollow");
            e.target.classList.remove("btn-success");
            e.target.classList.add("btn-primary");
            resolve(data.msg);
        }
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

async function getChurchInfo(churchid) {
  return new Promise((resolve, reject) => {
    if (!churchid) return;
    const endpoint = `${getApiServicesHost()}/church/${churchid}`;

    fetch(endpoint, {
      mode: "cors",
      method: "GET",
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.msgType === "error") {
          console.error(data.msg);
          return reject(new Error(data.msg));
        }

        resolve(data.info);
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

async function getFollowStatus() {
  const followActivityJSON =
    sessionStorage.getItem("followActivity") || JSON.stringify([]);
  const followActivity = JSON.parse(followActivityJSON);
  const users = followActivity.map((item) => item.userid);
  const endpoint = `${getApiHost()}/follow-status`;
  const accessToken = await getAccessToken();

  if (!users.length) return;

  return new Promise((resolve, reject) => {
    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        userids: users,
      }),
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.msgType === "error") {
          reject(data.msg);
        } else {
          resolve(data.followStatus);
        }
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

function getUserEvents() {
  return new Promise(async (resolve, reject) => {
    let userid = parseInt(getHash()) || "";

    // Validate hash
    if (typeof userid !== "number") return reject(new Error("invalid hash"));
    if (userid.length > 10) return reject(new Error("invalid hash"));

    userid = Math.abs(userid);

    const endpoint = `${getApiHost()}/event-list/${userid}`;
    const accessToken = await getAccessToken();

    fetch(endpoint, {
      mode: "cors",
      method: "GET",
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.msgType && data.msgType !== "success") {
          throw new Error(data.msg);
        }

        renderEvents(data.events);
        resolve(data.events);
      })
      .catch((err) => {
        resolve(err);
      });
  });
}

function getUserInfo() {
  return new Promise(async (resolve, reject) => {
    let userid = parseInt(getHash()) || "";

    // Validate hash
    if (typeof userid !== "number") return reject(new Error("invalid hash"));
    if (userid.length > 10) return reject(new Error("invalid hash"));

    userid = Math.abs(userid);

    const endpoint = `${getApiHost()}/userprofile/${userid}`;
    const accessToken = await getAccessToken();

    fetch(endpoint, {
      mode: "cors",
      method: "GET",
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data.msgType !== "success") throw new Error(data.msg);
        const churchinfo = await getChurchInfo(data.profile.churchid);
        renderProfile(data.profile, churchinfo);
        resolve(data.profile, churchinfo);
      })
      .catch((err) => {
        console.error(err);
      });
  });
}

async function refreshButtons(dataFromApi) {
  let buttonsToRefresh;
  const followActivityJSON =
    sessionStorage.getItem("followActivity") || JSON.stringify([]);
  const followActivity = JSON.parse(followActivityJSON);

  if (dataFromApi) {
    buttonsToRefresh = dataFromApi;
  } else {
    if (!followActivity.length) return;
    buttonsToRefresh = followActivity.map((item) => {
      return {
        userid: item.userid,
        isFollowing: item.action === "followed" ? true : false,
      };
    });
  }

  buttonsToRefresh.forEach((item) => {
    const { userid, isFollowing } = item;
    const el = document.querySelector(`[data-follow-userid="${userid}"]`);

    if (!el) return;
    if (isFollowing) {
      el.setAttribute("data-status", "followed");
      el.classList.remove("btn-primary");
      el.classList.add("btn-success");
      el.innerText = getPhrase("btnFollowing");
    } else {
      el.setAttribute("data-status", "follow");
      el.classList.remove("btn-success");
      el.classList.add("btn-primary");
      el.innerText = getPhrase("btnFollow");
    }
  });

  if (!dataFromApi) {
    const dataFromApi = await getFollowStatus();
    refreshButtons(dataFromApi);
  }
}

async function renderEvents(events) {
  const eventsContainerEl = document.querySelector("#eventsContainer");
  const eventsEl = document.querySelector("#events");
  const eventsHeadlineEl = document.querySelector("#events_headline");

  if (!Array.isArray(events)) return;
  if (!events.length) return;

  const headlineText =
    events.length === 1
      ? getPhrase("eventsHeadline1").replace("{quantity}", events.length)
      : getPhrase("eventsHeadline").replace("{quantity}", events.length);

  var eventsHTML = "";

  for (let i = 0; i < events.length; i++) {
    if (!events.length) break;
    const item = events[i];
    const eventTitle = item.title;
    const eventTimeAndDateHTML = await showEventDateTime(item);
    let badgeHTML = "";

    // If item type is either Bible Talk or Church, display the corresponding badge
    if (item.type === "bible talk") {
      badgeHTML = `
        <div class="badge badge-light border border-dark badge-pill mt-1 mb-2 mr-2">
          ${getGlobalPhrase("bibletalk")}
        </div>
      `;
    } else if (item.type === "church") {
      badgeHTML = `
        <div class="badge badge-light border border-dark badge-pill mt-1 mb-2 mr-2">
          ${getGlobalPhrase("churchservice")}
        </div>
      `;
    }

    if (item.hasvirtual) {
      badgeHTML += `
        <div class="badge badge-light border border-dark badge-pill mt-1 mb-2 mr-2">
          ${getGlobalPhrase("online")}
        </div>
      `;
    }

    eventsHTML += `
      <a
        href="#"
        class="list-group-item list-group-item-action"
        data-eventid="${item.eventid}"
      >
        <div class="text-dark"><strong>${eventTitle}</strong></div>
        <div>
          ${eventTimeAndDateHTML}
        </div>
        ${badgeHTML}
      </a>
    `;
  }

  eventsHeadlineEl.innerText = headlineText;
  eventsEl.innerHTML = eventsHTML;
  eventsContainerEl.classList.remove("d-none");
}

function renderProfile(userdata, churchinfo) {
  const {
    country,
    createdAt,
    firstname,
    gender,
    lastname,
    numFollowedBy,
    numFollowing,
    followed,
    numEvents,
    numInvitesSent,
    profilephoto,
    userid,
  } = userdata;
  const { church_name } = churchinfo;
  const name = `${firstname} ${lastname}`;
  const profilePhotoEl = document.querySelector("#profilephoto");
  const profilePhotoAltText = getPhrase("photoAltText").replace("{name}", name);
  let followedByText = getPhrase("numFollowedBy").replace(
    "{quantity}",
    `<span class="followquantity">${numFollowedBy}</span>`
  );
  let followingText = getPhrase("numFollowing").replace(
    "{quantity}",
    `<span class="followquantity">${numFollowing}</span>`
  );
  const followedByEl = document.querySelector(".numFollowedBy");
  const followingEl = document.querySelector(".numFollowing");
  const btnFollow = document.querySelector("#btnFollow");
  const churchNameEl = document.querySelector("#churchname");
  const registrationDateEl = document.querySelector("#registrationDate");
  const genderEl = document.querySelector("#gender");
  const numEventsEl = document.querySelector("#numEvents");
  const numInvitesSentEl = document.querySelector("#numInvitesSent");

  if (church_name.length) {
    churchNameEl.innerText = church_name;
  }

  if (numFollowedBy === 1) {
    followedByText = getPhrase("followedBy1").replace(
      "{quantity}",
      `<span class="followquantity">${numFollowedBy}</span>`
    );
  }

  if (numFollowing === 1) {
    followingText = getPhrase("following1").replace(
      "{quantity}",
      `<span class="followquantity">${numFollowing}</span>`
    );
  }

  if (numFollowedBy > 0) {
    followedByText = `<a href="../followers/#${getHash()}" class="followCount">${followedByText}</a>`;
  }

  if (numFollowing > 0) {
    followingText = `<a href="../following/#${getHash()}" class="followCount">${followingText}</a>`;
  }

  document.title = document.title.replace("{name}", name);
  document
    .querySelectorAll(".fullname")
    .forEach((item) => (item.innerHTML = name));
  profilePhotoEl.setAttribute("src", profilephoto);
  profilePhotoEl.setAttribute("alt", profilePhotoAltText);
  profilePhotoEl.setAttribute("width", 200);
  profilePhotoEl.setAttribute("height", 200);
  followedByEl.innerHTML = followedByText;
  followingEl.innerHTML = followingText;

  btnFollow.setAttribute("data-follow-userid", userid);

  if (followed) {
    btnFollow.setAttribute("data-status", "followed");
    btnFollow.innerText = getPhrase("btnFollowing");
    btnFollow.classList.add("btn-success");
    btnFollow.classList.remove("btn-primary");
  } else {
    btnFollow.setAttribute("data-status", "follow");
    btnFollow.innerText = getPhrase("btnFollow");
    btnFollow.classList.remove("btn-success");
    btnFollow.classList.add("btn-primary");
  }

  const langCountry = `${getLang()}-${country}`;

  let registrationDateOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const registrationDateText = new Intl.DateTimeFormat(
    langCountry,
    registrationDateOptions
  ).format(new Date(createdAt));
  registrationDateEl.innerText = registrationDateText;

  genderEl.innerText =
    gender === "male" ? getGlobalPhrase("male") : getGlobalPhrase("female");

  numEventsEl.innerText = numEvents;

  numInvitesSentEl.innerText = numInvitesSent;
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
                ? "<div class='location_address-line'><small>" +
                  locationaddressline1 +
                  "</small></div>"
                : ""
            }
            ${
              locationaddressline2 && locationaddressline2.length
                ? "<div class='location_address-line'><small>" +
                  locationaddressline2 +
                  "</small></div>"
                : ""
            }
            ${
              locationaddressline3 && locationaddressline3.length
                ? "<div class='location_address-line'><small>" +
                  locationaddressline3 +
                  "</small></div>"
                : ""
            }
          </div>

          ${
            mapCoordinates.length
              ? "<p><a href='${coordinatesLink}' class='text-primary border-bottom border-primary'>" +
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
          <a href="${coordinatesLink}" class="text-primary border-bottom border-primary">
            ${getPhrase("mapAndDirections")}
          </a>
        `;
      }
    }
  }

  if (locationvisibility === "discreet") {
    locationHTML = getPhrase("inquireForLocation");
  }

  if (userid === createdBy) {
    modalHTML = `
      <div class="mb-3">
        <div>
          <strong class="text-dark">${getPhrase("datetime")}</strong>
        </div>
        ${eventTimeAndDateHTML}
      </div>

      <div class="mt-3 mb-3">
        <div>
          <strong class="text-dark">${getPhrase("place")}</strong>
        </div>
        ${locationHTML}
      </div>
      
      <div>
        <div>
          <strong class="text-dark">${getPhrase("description")}</strong>
        </div>
        ${breakify(description)}
      </div>
    `;
    footerHTML = `
      <a href="../events/delete/#${eventid}" class="btn btn-link text-uppercase" data-dismiss="modal">
        ${getPhrase("cancel")}
      </a>
      <a href="../events/delete/#${eventid}" class="btn btn-danger text-uppercase ml-2">
        ${getPhrase("delete")}
      </a>
      <a href="../events/edit/#${eventid}" class="btn btn-info text-uppercase ml-2">
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

function showFollowButton() {
  const profileUserId = parseInt(getHash());
  const userid = getUserId();
  const buttonEl = document.querySelector(".followAction");

  if (profileUserId !== userid) {
    buttonEl.classList.remove("d-none");
  }
}

function unfollowUser(userid, e) {
  return new Promise(async (resolve, reject) => {
    const endpoint = `${getApiHost()}/unfollow-user`;
    const accessToken = await getAccessToken();

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        userid: userid,
      }),
      keepalive: true,
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        switch (data.msg) {
          case "unfollow successful":
            e.target.setAttribute("data-status", "follow");
            e.target.classList.remove("btn-success");
            e.target.classList.add("btn-primary");
            e.target.innerText = getPhrase("btnFollow");
            const userUnfollowed = data.unfollowedid;
            const whenUnfollowed = moment
              .tz(moment.now(), moment.tz.guess())
              .format();
            updateFollowActivity(userUnfollowed, whenUnfollowed, "unfollowed");
            updateFollowCounts(data.otherUserNow);
            resolve(data.msg);
            break;
          default:
            e.target.setAttribute("data-status", "followed");
            e.target.classList.remove("btn-primary");
            e.target.classList.add("btn-success");
            e.target.innerText = getPhrase("btnFollowing");
            resolve(data.msg);
        }
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}

function updateFollowCounts(otherUserNow) {
  let numFollowedBy = otherUserNow.followers;
  let numFollowing = otherUserNow.following;
  const followedByEl = document.querySelector(".numFollowedBy");
  const followingEl = document.querySelector(".numFollowing");

  let followedByText = getPhrase("numFollowedBy").replace(
    "{quantity}",
    `<span class="followquantity">${numFollowedBy}</span>`
  );
  let followingText = getPhrase("numFollowing").replace(
    "{quantity}",
    `<span class="followquantity">${numFollowing}</span>`
  );

  if (numFollowedBy === 1) {
    followedByText = getPhrase("followedBy1").replace(
      "{quantity}",
      `<span class="followquantity">${numFollowedBy}</span>`
    );
  }

  if (numFollowing === 1) {
    followingText = getPhrase("following1").replace(
      "{quantity}",
      `<span class="followquantity">${numFollowing}</span>`
    );
  }

  if (numFollowedBy > 0) {
    followedByText = `<a href="../followers/#${getHash()}" class="followCount">${followedByText}</a>`;
  }

  if (numFollowing > 0) {
    followingText = `<a href="../following/#${getHash()}" class="followCount">${followingText}</a>`;
  }

  followedByEl.innerHTML = followedByText;
  followingEl.innerHTML = followingText;
}

async function onEventListItemClicked(e) {
  const eventid = parseInt(e.currentTarget.getAttribute("data-eventid"));
  const endpoint = `${getApiHost()}/event-get`;

  e.preventDefault();

  if (typeof eventid !== "number") return;

  const accessToken = await getAccessToken();

  fetch(endpoint, {
    mode: "cors",
    method: "POST",
    body: JSON.stringify({
      eventid: eventid,
    }),
    headers: new Headers({
      "Content-Type": "application/json",
      authorization: `Bearer ${accessToken}`,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.msgType && data.msgType !== "success") {
        throw new Error(data.msg);
      }

      showEvent(data.event);
    })
    .catch((err) => {
      console.error(err);
    });
}

async function onFollowClicked(e) {
  const userid = parseInt(e.target.getAttribute("data-follow-userid"));
  const status = e.target.getAttribute("data-status");

  if (status === "follow") {
    // Change button text from "Follow" to "Following"
    document
      .querySelectorAll(`[data-follow-userid='${userid}']`)
      .forEach((item) => {
        item.setAttribute("data-status", "followed");
        item.classList.remove("btn-primary");
        item.classList.add("btn-success");
        item.innerText = getPhrase("btnFollowing");
      });
    followUser(userid, e);
  } else if (status === "followed") {
    // Change button text from "Following" to "Follow"
    e.target.setAttribute("data-status", "follow");
    e.target.classList.remove("btn-success");
    e.target.classList.add("btn-primary");
    e.target.innerText = getPhrase("btnFollow");
    document
      .querySelectorAll(`[data-follow-userid='${userid}']`)
      .forEach((item) => {
        item.setAttribute("data-status", "follow");
        item.classList.remove("btn-success");
        item.classList.add("btn-primary");
        item.innerText = getPhrase("btnFollow");
      });
    unfollowUser(userid, e);
  }
}

function onVisibilityChange() {
  if (document.visibilityState === "visible") {
    refreshButtons();
  }
}

function attachListeners() {
  document
    .querySelector("#btnFollow")
    .addEventListener("click", onFollowClicked);

  document
    .querySelectorAll("#eventsContainer a")
    .forEach((item) => item.addEventListener("click", onEventListItemClicked));

  window.addEventListener("visibilitychange", onVisibilityChange);
}

async function init() {
  showFollowButton();
  await Promise.all([populateContent(), getUserInfo(), getUserEvents()]);
  attachListeners();
  globalHidePageSpinner();
}

init();
