module.exports = async function getUnsubscribeToken(db, recipientid, userid) {
  return new Promise((resolve, reject) => {
    const sql = `
        SELECT
          invitationid,
          userid
        FROM
          invitations
        WHERE
          recipientid = ?
        AND
          userid = ?
        LIMIT 1
        ;
      `;
    db.query(sql, [recipientid, userid], (error, result) => {
      if (error) {
        console.log(error);
        return reject(error);
      }

      if (!result.length) {
        return reject(
          new Error("an invitation with this userid was not found"),
        );
      }

      const invitationid = result[0].invitationid;
      const userid = result[0].userid;
      const secret = process.env.INVITES_HMAC_SECRET;
      const jsonwebtoken = require("jsonwebtoken");
      const jwt = jsonwebtoken.sign(
        {
          invitationid: invitationid,
          userid: userid,
        },
        secret,
        { expiresIn: "100y" },
      );
      const unsubscribeToken = Buffer.from(jwt).toString("base64");

      return resolve(unsubscribeToken);
    });
  });
};
