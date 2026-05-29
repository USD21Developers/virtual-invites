module.exports = async function recordThatInviteWasViewed(
  db,
  invitationid,
  userid,
  timezone,
) {
  return new Promise((resolve, reject) => {
    const interactionType = "viewed invite";

    if (!invitationid)
      return reject(new Error("invitationid is a required argument"));
    if (!userid) return reject(new Error("userid is a required argument"));
    if (!timezone) return reject(new Error("timezone is a required argument"));

    const sql = `
        INSERT INTO interactions(
          invitationid,
          userid,
          recipienttimezone,
          interactiontype,
          createdAt
        ) VALUES (
          ?,
          ?,
          ?,
          ?,
          UTC_TIMESTAMP()
        )
      `;

    db.query(
      sql,
      [invitationid, userid, timezone, interactionType],
      (error, result) => {
        if (error) {
          console.log(error);
          return reject(new Error("unable to record that invite was viewed"));
        }

        return resolve(result);
      },
    );
  });
};
