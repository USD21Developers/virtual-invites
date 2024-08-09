function framebuster() {
  const isFramed = top.location === self.location ? false : true;

  if (isFramed) {
    top.location = self.location;
  }
}

function getAccessToken() {
  let needToRefresh = false;
  const accessToken = sessionStorage.getItem("accessToken") || "";
  const now = Date.now().valueOf() / 1000;
  let expiry = now;
  try {
    expiry = JSON.parse(atob(accessToken.split(".")[1])).exp;
    if (expiry < now) needToRefresh = true;
  } catch (err) {
    needToRefresh = true;
  }
  return new Promise((resolve, reject) => {
    if (!needToRefresh) return resolve(accessToken);
    const refreshToken = localStorage.getItem("refreshToken") || "";
    if (!refreshToken.length) return reject("refresh token missing");

    const endpoint = `${getAPIHost()}/refresh-token`;

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
        const logoutUrl = `/logout/`;
        switch (data.msg) {
          case "tokens renewed":
            const { accessToken, refreshToken } = data;
            localStorage.setItem("refreshToken", refreshToken);
            sessionStorage.setItem("accessToken", accessToken);
            const country =
              JSON.parse(atob(accessToken.split(".")[1])).country || "us";
            setCountry(country);
            return resolve(accessToken);
            break;
          default:
            setRedirectOnLogin();
            window.location.href = logoutUrl;
            break;
        }
      })
      .catch((error) => {
        console.error(error);
      });
  });
}

function getAPIHost(forceRemote = false) {
  const local = "http://localhost:4000/invites";
  const localIP = "http://192.168.0.85:4000/invites";
  const remote = "https://api.usd21.org/invites";
  let apiHost;

  apiHost = window.location.hostname === "localhost" ? local : remote;
  apiHost =
    window.location.hostname.indexOf("192.168.") >= 0 ? localIP : remote;

  return forceRemote ? remote : apiHost;
}

async function getPermissions() {
  const accessToken = await getAccessToken();
  const claims = JSON.parse(atob(accessToken.split(".")[1]));
  const permissions = [];

  if (claims.canAuthToAuth) permissions.push("canAuthToAuth");
  if (claims.canAuthorize) permissions.push("canAuthorize");
  if (claims.isAuthorized) permissions.push("isAuthorized");

  return permissions;
}

async function isSysadmin() {
  const accessToken = await getAccessToken();
  const claims = JSON.parse(atob(accessToken.split(".")[1]));
  const usertype = claims.usertype || "user";
  return usertype === "sysadmin" ? true : false;
}

function setCountry(country) {
  localStorage.setItem("country", country);
}

function setRedirectOnLogin() {
  const accessScriptEl = document.querySelector("#enforceaccess");
  if (accessScriptEl) {
    if (accessScriptEl.hasAttribute("data-return-here")) {
      const redirectUrl = window.location.href;
      sessionStorage.setItem("redirectOnLogin", redirectUrl);
    }
  }
}

function verifyDataKey() {
  const logoutUrl = "/logout/";
  const dataKey = localStorage.getItem("datakey") || "";

  if (!dataKey.length) {
    setRedirectOnLogin();
    return (window.location.href = logoutUrl);
  }
}

function verifyRefreshToken() {
  let logoutUrl = "/logout/";
  const refreshToken = localStorage.getItem("refreshToken") || "";
  let isAuthorized = true;

  if (!refreshToken.length) {
    setRedirectOnLogin();
    return (window.location.href = logoutUrl);
  }
  try {
    const parsedToken = JSON.parse(atob(refreshToken.split(".")[1]));
    if (Date.now() >= parsedToken.exp * 1000) {
      isAuthorized = false;
    }
  } catch (err) {
    console.error(err);
    isAuthorized = false;
  }
  if (!isAuthorized) {
    setRedirectOnLogin();
    window.location.href = logoutUrl;
  }
}

async function init() {
  const isFromHomeScreen =
    window.location.href.indexOf("utm_source=homescreen") >= 0 ? true : false;

  if (isFromHomeScreen) {
    sessionStorage.setItem("isFromHomeScreen", "true");
  } else {
    sessionStorage.removeItem("isFromHomeScreen");
  }

  framebuster();

  if (window.location.pathname === "/authorize/me/") {
    const jwt = localStorage.getItem("userToken");

    if (!jwt) {
      window.location.href = "/logout/";
    }
  } else {
    verifyRefreshToken();
    verifyDataKey();

    const permissions = await getPermissions();
    if (!permissions.includes("isAuthorized")) {
      window.location.href = "/logout/";
    }
  }
}

init();
