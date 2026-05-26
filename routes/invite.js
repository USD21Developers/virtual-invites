const moment = require("moment");
const fs = require("fs");
const path = require("path");
const getTimezoneFromIp = require("../lib/getTimezoneFromIp");

function removeLocationInfoFromDiscreetEvents(arrayOfEvents) {
  if (!Array.isArray(arrayOfEvents)) return [];

  const events = arrayOfEvents.map((event) => {
    const { locationvisibility } = event;
    const isDiscreetLocation = locationvisibility === "discreet" ? true : false;

    if (!isDiscreetLocation) {
      return event;
    }

    const modifiedEvent = {
      ...event,
      locationaddressline1: null,
      locationaddressline2: null,
      locationaddressline3: null,
      locationcoordinates: null,
      locationname: null,
      otherlocationdetails: null,
    };

    return modifiedEvent;
  });

  return events;
}

module.exports = (req, res) => {
  // Set database
  let isLocal = false;
  let isStaging = false;
  if (req.headers && req.headers.referer) {
    if (req.headers.referer.indexOf("staging") >= 0) {
      isStaging = true;
    } else if (req.headers.referer.indexOf("localhost") >= 0) {
      isLocal = true;
    }
  }

  const db = isStaging
    ? require("../database/database-invites-test")
    : require("../database/database-invites");

  let { eventid, userid, recipientid } = req.params;
  eventid = Number(eventid);
  userid = Number(userid);

  const loggedInUserId = parseInt(req.query.userid, 10);
  const isLoggedInUser =
    Number.isInteger(loggedInUserId) &&
    loggedInUserId > 0 &&
    loggedInUserId === userid;

  if (!Number.isFinite(eventid)) {
    return res.status(400).send({
      msg: "eventid must be numeric",
      msgType: "error",
    });
  }
  if (!Number.isFinite(userid)) {
    return res.status(400).send({
      msg: "userid must be numeric",
      msgType: "error",
    });
  }

  const timezone = "America/Phoenix";

  const getUnsubscribeToken = async (recipientid, userid) => {
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

  const getEvent = (db, eventid) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          *,
          CASE 
            WHEN frequency != 'once' AND startdate < CURDATE() THEN CONCAT(DATE_FORMAT(DATE_ADD(startdate, INTERVAL (DATEDIFF(CURDATE(), startdate) DIV 7 + 1) * 7 DAY), '%Y-%m-%dT%H:%i:%s'), 'Z')
            ELSE CONCAT(DATE_FORMAT(startdate, '%Y-%m-%dT%H:%i:%s'), 'Z')
          END AS startdateNext,
          (
            SELECT COUNT(*)
            FROM events 
            WHERE eventid = ? 
            AND (
              DATE_ADD(startdate, INTERVAL durationInHours HOUR) < NOW() 
              OR 
              multidayenddate < NOW()
            )
          ) AS isPast
        FROM
          events
        WHERE
          eventid = ?
        LIMIT
          1
        ;
      `;

      db.query(sql, [eventid, eventid, eventid], (error, result) => {
        if (error) {
          console.log(error);
          return reject(new Error("unable to query for event"));
        }

        if (!result.length) {
          return reject(new Error("event not found"));
        }

        let event;

        event = removeLocationInfoFromDiscreetEvents(result);

        return resolve(event[0]);
      });
    });
  };

  const getUser = (db, userid) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          userid,
          churchid,
          firstname,
          lastname,
          nameDisplayedOnInvite,
          email,
          gender,
          profilephoto,
          lang,
          country,
          settings
        FROM
          users u
        WHERE
          userid = ?
        ;
      `;

      db.query(sql, [userid], (error, result) => {
        if (error) {
          console.log(error);
          return reject(new Error("unable to query for user"));
        }

        if (!result.length) {
          return reject(new Error("user not found"));
        }

        const userObject = result[0];

        return resolve(userObject);
      });
    });
  };

  const getRecipient = (db, eventid, userid, recipientid) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          invitationid,
          isDeleted,
          recipientname,
          sharedfromtimezone,
          lang,
          invitedAt
        FROM
          invitations
        WHERE
          eventid = ?
        AND
          userid = ?
        AND
          recipientid = ?
        LIMIT
          1
        ;
      `;

      db.query(sql, [eventid, userid, recipientid], (error, result) => {
        if (error) {
          console.log(error);
          return reject(new Error("unable to query for recipient"));
        }

        if (!result.length) {
          return reject(new Error("recipient not found"));
        }

        return resolve(result[0]);
      });
    });
  };

  const recordThatInviteWasViewed = function (invitationid, userid, timezone) {
    return new Promise((resolve, reject) => {
      const interactionType = "viewed invite";

      if (!invitationid)
        return reject(new Error("invitationid is a required argument"));
      if (!userid) return reject(new Error("userid is a required argument"));
      if (!timezone)
        return reject(new Error("timezone is a required argument"));

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

  // Main method
  (async (db, res) => {
    try {
      const event = eventid
        ? await getEvent(db, eventid).catch(() => null)
        : null;

      if (!event) {
        return res.status(404).send({
          msg: "event not found",
          msgType: "error",
        });
      }

      if (event.frequency !== "once") {
        event.startDateOriginal =
          moment(event.startdate).format("YYYY-MM-DDTHH:mm:ss") + "Z";
        event.startdate = event.startdateNext;
        delete event.startdateNext;
      }

      const user = userid ? await getUser(db, userid).catch(() => null) : null;

      if (user && user.settings) {
        const settings = user.settings;

        if (settings.hasOwnProperty("eventsByFollowedUsers")) {
          if (settings.eventsByFollowedUsers.hasOwnProperty("contactInfo")) {
            if (settings.eventsByFollowedUsers.contactInfo.override) {
              user.contactInfo = settings.eventsByFollowedUsers.contactInfo;
            }
          }
        }

        delete user.settings;
      }

      const recipient =
        eventid && userid && recipientid
          ? await getRecipient(db, eventid, userid, recipientid).catch(
              () => null,
            )
          : null;

      // Record that invite was viewed
      let timezone = recipient.sharedfromtimezone
        ? recipient.sharedfromtimezone
        : "America/Phoenix";

      if (recipient) {
        // Detect the client's timezone via IP geolocation off the response
        // critical path; fall back to the sender's timezone on failure.
        (async () => {
          try {
            const detected = await getTimezoneFromIp(req.clientIp);
            if (detected) timezone = detected;
          } catch (e) {}
          recordThatInviteWasViewed(recipient.invitationid, userid, timezone);
        })();
      }

      res.render("invite", {
        invite: {
          event: event,
          user: user,
          recipient: recipient,
        },
        isLoggedInUser: isLoggedInUser,
      });
    } catch (err) {
      console.error("Unhandled error in invite handler:", err);
      if (!res.headersSent) {
        return res
          .status(500)
          .send({ msg: "internal server error", msgType: "error" });
      }
    }
  })(db, res);
};
