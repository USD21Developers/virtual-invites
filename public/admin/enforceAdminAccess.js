(() => {
  const refreshTokenJSON = localStorage.getItem("refreshToken");

  if (!refreshTokenJSON) window.location.href = "/";

  const refreshToken = JSON.parse(atob(refreshTokenJSON.split(".")[1]));

  let isAdmin = false;

  if (
    refreshToken.canAuthToAuth === true ||
    refreshToken.canAuthToAuth === 1 ||
    getUserType() === "sysadmin"
  ) {
    isAdmin = true;
  }

  if (!isAdmin) {
    window.location.href = "/";
  }
})();
