function getApiHost() {
  let host;

  switch(window.location.hostname) {
    case "localhost":
      host = `${window.location.origin}/api/`;
      break;
    case "staging.invites.usd21.org":
      host = "https://api.usd21.org/invites/staging/api/";
      break;
    case "invites.usd21.org":
      host = "https://api.usd21.org/invites/api/";
      break;
  }

  return host;
}