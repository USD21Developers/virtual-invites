const moment = require("moment");
const getInvitePhrases = require("./getInvitePhrases");

// Resolve the public-facing domain from the environment, used to build the
// click-through URL of the push notification.
function getDomain() {
  switch ((process.env.ENV || "").toLowerCase()) {
    case "production":
      return "https://invites.mobi";
    case "staging":
      return "https://staging.invites.mobi";
    default:
      return `http://localhost:${process.env.INVITES_MOBI_PORT || 5555}`;
  }
}

/**
 * Notifies the sender, via Web Push, that their invite was viewed.
 *
 * Self-contained: builds the push payload from on-disk i18n phrases, enforces
 * the 24-hour rate limit, honors the recipient's unsubscribe flag, sends to all
 * of the user's push subscriptions whose account still has push notifications
 * enabled, and records the time of notification.
 *
 * Intended to be called fire-and-forget from the invite route.
 *
 * @param {Object} db - invites database connection
 * @param {Object} args
 * @param {Object} args.event - event object (from getEvent; must include lang)
 * @param {Object} args.user - sender/user object (must include userid)
 * @param {Object} args.recipient - recipient object (must include invitationid, recipientname)
 * @param {boolean} [args.isUser] - true when the sender is viewing their own invite (skip notifying)
 * @returns {Promise}
 */
module.exports = async function notifySenderByPush(
  db,
  { event, user, recipient, isUser } = {},
) {
  if (!event || !user || !recipient || isUser) return;

  const phrases = getInvitePhrases(event.lang);
  const domain = getDomain();
  const invitationid = recipient.invitationid;

  // Determine whether we may notify via push (rate limit + unsubscribe).
  const gate = await new Promise((resolve, reject) => {
    const sql = `
      SELECT
        unsubscribedFromPush,
        lastTimeNotifiedViaPush
      FROM
        invitations
      WHERE
        invitationid = ?
      LIMIT 1
      ;
    `;
    db.query(sql, [invitationid], (error, result) => {
      if (error) {
        console.log(error);
        return reject(
          new Error("unable to query for last time user was notified via push"),
        );
      }
      if (!result.length) {
        return reject(new Error("invitation not found"));
      }
      return resolve(result[0]);
    });
  });

  let proceed = true;
  if (gate.lastTimeNotifiedViaPush) {
    const okToNotify = moment(gate.lastTimeNotifiedViaPush).add(24, "hours");
    if (moment().utc().isBefore(okToNotify)) proceed = false;
  }
  if (gate.unsubscribedFromPush === 1) proceed = false;
  if (!proceed) return;

  // Build the push payload.
  const title = (phrases["pushInviteViewed"] || "").replaceAll(
    "{RECIPIENT-NAME}",
    recipient.recipientname,
  );
  const body = (phrases["pushFollowUp"] || "").replaceAll(
    "{RECIPIENT-NAME}",
    recipient.recipientname,
  );
  const clickURL = `${domain}/r/#/${invitationid}`;

  // Fetch the user's push subscriptions (only if their account still has push
  // notifications enabled), then deliver to each.
  const subscriptions = await new Promise((resolve, reject) => {
    const sql = `
      SELECT
        ps.subscription AS subscription
      FROM
        pushsubscriptions ps
      INNER JOIN users u ON u.userid = ps.userid
      WHERE
        ps.userid = ?
      AND
        u.userstatus = 'registered'
      AND
        JSON_EXTRACT(u.settings, "$.enablePushNotifications") = true
      ;
    `;
    db.query(sql, [user.userid], (error, result) => {
      if (error) {
        console.log(error);
        return reject(new Error("unable to query for push subscription"));
      }
      return resolve(result);
    });
  });

  if (!subscriptions.length) return;

  const webpush = require("web-push");
  const payload = JSON.stringify({
    data: { clickURL: clickURL },
    title: title,
    body: body,
  });

  const options = {
    timeout: 30 * 1000, // 30 seconds
    TTL: 86000, // ~24 hours
    urgency: "high", // deliver immediately
    vapidDetails: {
      subject: process.env.VAPID_IDENTIFIER,
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    },
  };

  const sends = subscriptions.map((item) => {
    // mysql2 auto-parses JSON columns into objects, but older rows/drivers may
    // return a JSON string, so handle both.
    const subscription =
      typeof item.subscription === "string"
        ? JSON.parse(item.subscription)
        : item.subscription;
    return webpush.sendNotification(subscription, payload, options).catch((error) => {
      // A 410 from Apple means the subscription is gone; other providers can
      // return 410 spuriously, so only surface Apple's. Swallow the rest.
      if (
        error.statusCode === 410 &&
        error.endpoint &&
        error.endpoint.includes("apple")
      ) {
        console.log("expired Apple push subscription:", error.endpoint);
      }
    });
  });

  await Promise.all(sends);

  // Record the time of notification.
  await new Promise((resolve) => {
    const sql = `
      UPDATE
        invitations
      SET
        lastTimeNotifiedViaPush = UTC_TIMESTAMP()
      WHERE
        invitationid = ?
      ;
    `;
    db.query(sql, [invitationid], (error) => {
      if (error) {
        console.log(
          new Error(
            "unable to update invite with last time user was notified via push",
          ),
        );
      }
      return resolve();
    });
  });
};
