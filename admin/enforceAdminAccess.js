(() => {
  const refreshTokenJSON = localStorage.getItem("refreshToken");

  if (!refreshTokenJSON) window.location.href = "/";

  const refreshToken = JSON.parse(atob(refreshTokenJSON.split(".")[1]));

  const isAdmin = refreshToken.canAuthToAuth === 1;

  if (!isAdmin) {
    window.location.href = "/";
  }
})();
