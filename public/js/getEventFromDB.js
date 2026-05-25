async function getEventFromDB() {
  const eventid = Math.abs(parseInt(getHash()));
  const endpoint = `${getApiHost()}/event-get`;
  const accessToken = await getAccessToken();
  const controller = new AbortController();

  if (typeof eventid !== "number") return;

  spinner("show");

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
      populateDetails(data);
      spinner("hide");
    })
    .catch((err) => {
      console.error(err);
      spinner("hide");
    });

  setTimeout(() => {
    controller.abort("Timeout reached (8 seconds)");
    spinner("hide");
  }, 8000);
}
