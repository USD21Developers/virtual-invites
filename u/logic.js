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

async function getUserInfo() {
  let userid = parseInt(getHash()) || "";

  // Validate hash
  if (typeof userid !== "number") return;
  if (userid.length > 10) return;
  userid = Math.abs(userid);

  const endpoint = `${getApiHost()}/userprofile/${userid}`;
  const accessToken = await getAccessToken();

  return new Promise((resolve, reject) => {
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

  followedByEl.innerHTML = followedByText;
  followingEl.innerHTML = followingText;
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

function attachListeners() {
  document
    .querySelector("#btnFollow")
    .addEventListener("click", onFollowClicked);
}

async function init() {
  await populateContent();
  await getUserInfo();
  attachListeners();
  globalHidePageSpinner();
}

init();
