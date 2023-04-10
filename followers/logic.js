var userProfileInfo = {};

var loggedInUserProfileInfo = {};

var fetchedFollowers = [];

function followUser(userIdToFollow, e) {
  const numFollowedBy =
    parseInt(
      document.querySelector(".numFollowedBy .followquantity")?.innerText
    ) + 1;
  const numFollowing = parseInt(
    document.querySelector(".numFollowing .followquantity")?.innerText
  );
  updateFollowCounts({
    followers: numFollowedBy,
    following: numFollowing,
  });

  showUserInResults();

  return new Promise(async (resolve, reject) => {
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

    const endpoint = `${getApiHost()}/follow-user`;
    const accessToken = await getAccessToken();

    fetch(endpoint, {
      mode: "cors",
      method: "POST",
      body: JSON.stringify({
        userid: userIdToFollow,
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
            showUserInResults();
            popupQuantityOfEvents();
            syncEvents();
            resolve(data.msg);
            break;
          default:
            e.target.setAttribute("data-status", "follow");
            e.target.innerText = getPhrase("btnFollow");
            e.target.classList.remove("btn-success");
            e.target.classList.add("btn-primary");
            popupQuantityOfEvents();
            syncEvents();
            resolve(data.msg);
        }
      })
      .catch((err) => {
        console.error(err);
        popupQuantityOfEvents();
        syncEvents();
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

async function getFollowers() {
  let userid = parseInt(getHash());

  if (typeof userid !== "number") return;

  userid = Math.abs(userid);

  const endpoint = `${getApiHost()}/followers/${userid}`;
  const accessToken = await getAccessToken();

  return new Promise((resolve, reject) => {
    fetch(endpoint, {
      mode: "cors",
      method: "get",
      headers: new Headers({
        "Content-Type": "application/json",
        authorization: `Bearer ${accessToken}`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.msgType === "success") {
          showFollowers(data.followers);
          resolve(data.followers);
        } else {
          reject(new Error(data.msg));
        }
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

function getProfileInfo() {
  let profileid = parseInt(getHash());
  // Validate hash
  if (typeof profileid !== "number") return;
  if (profileid.length > 10) return;
  profileid = Math.abs(profileid);

  const profilePromise = new Promise(async (resolve, reject) => {
    let profileid = parseInt(getHash()) || "";
    const endpoint = `${getApiHost()}/userprofile/${profileid}`;
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
        userProfileInfo = data.profile;
        renderProfile(data.profile, churchinfo);
      })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        console.error(err);
      });
  });

  const userPromise = new Promise(async (resolve, reject) => {
    const userid = getUserId();
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
        loggedInUserProfileInfo = data.profile;
        resolve();
      })
      .catch((err) => {
        console.error(err);
      });
  });

  Promise.all([profilePromise, userPromise]).then(() => {
    return new Promise((resolve, reject) => resolve());
  });
}

function hideUserFromResults() {
  const followerid = getUserId();
  const selector = `.follower[data-followerid='${followerid}']`;
  const el = document.querySelector(selector);

  if (el) {
    el.classList.add("d-none");
  }
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
  const breadcrumbProfileLink = document.querySelector(
    ".breadcrumbProfileLink"
  );

  breadcrumbProfileLink.setAttribute("href", `../u/#${getHash()}`);

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
}

function showFollowButton() {
  const profileUserId = parseInt(getHash());
  const userid = getUserId();
  const buttonEl = document.querySelector(".followAction");

  if (profileUserId !== userid) {
    buttonEl.classList.remove("d-none");
  }
}

function showFollowers(followers) {
  const headlineFollowersEl = document.querySelector("#headlineFollowers");
  const followersEl = document.querySelector("#followers");
  const numFollowers = followers.length;
  const headlineText =
    numFollowers === 1
      ? getPhrase("headlineFollowers1").replace("{quantity}", numFollowers)
      : getPhrase("headlineFollowers").replace("{quantity}", numFollowers);
  let html = "";

  if (numFollowers === 0) {
    if (headlineFollowersEl) headlineFollowersEl.classList.add("d-none");
    if (followersEl) followersEl.classList.add("d-none");
  } else {
    if (headlineFollowersEl) headlineFollowersEl.classList.remove("d-none");
    if (followersEl) followersEl.classList.remove("d-none");
  }

  headlineFollowersEl.innerText = headlineText;

  followers.forEach((follower) => {
    const { firstname, gender, lastname, profilephoto, userid } = follower;
    const profilePhotoSmall = profilephoto.replace("400.jpg", "140.jpg");
    const churchId = getUserChurchId(userid);
    const churchInfo = getStoredChurch(churchId);
    const churchName = churchInfo ? churchInfo.name : "";
    const churchPlace = churchInfo ? churchInfo.place : "";
    const defaultImg =
      gender === "male" ? "avatar_male.svg" : "avatar_female.svg";
    const rowHtml = `
      <tr class="follower" data-followerid="${userid}">
        <td valign="middle" class="text-center follower_photo" width="1%">
          <a href="../u/#${userid}">
            <img src="${profilePhotoSmall}" alt="${firstname} ${lastname}" class="mr-2 mb-0" onerror="this.onerror=null;this.src='/_assets/img/${defaultImg}';" />
          </a>
        </td>

        <td class="spacer">&nbsp;</td>

        <td valign="middle" class="follower_text" width="99%">
          <a href="../u/#${userid}"><strong>${firstname} ${lastname}</strong></a>
          ${
            churchName.length
              ? "<div class='muted'><small>" + churchName + "</small></div>"
              : ""
          }
          ${
            churchPlace.length
              ? "<div class='muted'><small>" + churchPlace + "</small></div>"
              : ""
          }
        </td>
      </tr>
    `;
    html += rowHtml;
  });

  html = `<table class="followers">${html}</div>`;

  followersEl.innerHTML = html;
}

async function showUserInResults() {
  const userid = getUserId();
  const el = document.querySelector(
    `.follower[data-followerid="${userid}"].d-none`
  );
  const userAlreadyInDOM = el ? true : false;

  if (userAlreadyInDOM) {
    el.classList.remove("d-none");
  } else {
    fetchedFollowers.push(loggedInUserProfileInfo);
    fetchedFollowers.sort((a, b) => {
      const nameA = `${a.lastname}, ${b.firstname}`;
      const nameB = `${b.lastname}, ${b.firstname}`;
      return nameA > nameB ? 1 : -1;
    });
    showFollowers(fetchedFollowers);
    fetchedFollowers = await getFollowers();
  }
}

function unfollowUser(userid, e) {
  fetchedFollowers = fetchedFollowers.filter(
    (item) => item.userid != getUserId()
  );

  const numFollowedBy =
    parseInt(
      document.querySelector(".numFollowedBy .followquantity")?.innerText
    ) - 1;
  const numFollowing = parseInt(
    document.querySelector(".numFollowing .followquantity")?.innerText
  );
  updateFollowCounts({
    followers: numFollowedBy,
    following: numFollowing,
  });

  hideUserFromResults();
  showFollowers(fetchedFollowers);

  return new Promise(async (resolve, reject) => {
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
            syncEvents();
            resolve(data.msg);
            break;
          default:
            e.target.setAttribute("data-status", "followed");
            e.target.classList.remove("btn-primary");
            e.target.classList.add("btn-success");
            e.target.innerText = getPhrase("btnFollowing");
            syncEvents();
            resolve(data.msg);
        }
      })
      .catch((err) => {
        console.error(err);
        syncEvents();
        reject(err);
      });
  });
}

function updateFollowCounts(otherUserNow) {
  let numFollowedBy = otherUserNow.followers;
  let numFollowing = otherUserNow.following;
  const numFollowedByEl = document.querySelector(".numFollowedBy");
  const numFollowingEl = document.querySelector(".numFollowing");
  const followersEl = document.querySelector("#followers");
  const headlineFollowersEl = document.querySelector("#headlineFollowers");
  const headlineText =
    numFollowedBy === 1
      ? getPhrase("headlineFollowers1").replace("{quantity}", numFollowedBy)
      : getPhrase("headlineFollowers").replace("{quantity}", numFollowedBy);

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

    headlineFollowersEl.innerText = headlineText;
    followersEl.classList.remove("d-none");
    headlineFollowersEl.classList.remove("d-none");
  } else {
    followersEl.classList.add("d-none");
    headlineFollowersEl.classList.add("d-none");
  }

  if (numFollowing > 0) {
    followersEl.classList.remove("d-none");
    headlineFollowersEl.classList.remove("d-none");
    followingText = `<a href="../following/#${getHash()}" class="followCount">${followingText}</a>`;
  }

  numFollowedByEl.innerHTML = followedByText;
  numFollowingEl.innerHTML = followingText;
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
    await followUser(userid, e);
    await syncEvents();
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
    await unfollowUser(userid, e);
    await syncEvents();
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

  window.addEventListener("visibilitychange", onVisibilityChange);
}

async function init() {
  showFollowButton();
  await populateContent();
  await getProfileInfo();
  fetchedFollowers = await getFollowers();
  attachListeners();
  globalHidePageSpinner();
}

init();
