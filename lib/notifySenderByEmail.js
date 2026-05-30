const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const moment = require("moment");
const { JSDOM } = require("jsdom");
const getInvitePhrases = require("./getInvitePhrases");
const getUnsubscribeToken = require("./getUnsubscribeToken");

// Cache the email template so we only read it from disk once per process.
let templateHtml = null;
function getEmailTemplate() {
  if (templateHtml === null) {
    const templatePath = path.join(
      __dirname,
      "..",
      "public",
      "i",
      "sender-notification-email.html",
    );
    templateHtml = fs.readFileSync(templatePath, "utf8");
  }
  return templateHtml;
}

// Resolve the public-facing domain from the environment, used to build links
// inside the email (follow-up, unsubscribe).
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

// Low-level Mailjet transport.  Resolves with { statusCode, statusText }.
function sendEmailViaMailjet(recipientName, recipientEmail, senderName, subject, body) {
  const Mailjet = require("node-mailjet");
  const mailjet = Mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY,
  );

  return new Promise((resolve, reject) => {
    mailjet
      .post("send", { version: "v3.1" })
      .request({
        Messages: [
          {
            From: {
              Email: process.env.MAILJET_SENDER_EMAIL_INVITES,
              Name: senderName,
            },
            To: [{ Email: recipientEmail, Name: recipientName }],
            Subject: subject,
            HTMLPart: body,
          },
        ],
      })
      .then((result) => {
        const { response } = result;
        resolve({ statusCode: 200, statusText: response.statusText });
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * Notifies the sender, via e-mail, that their invite was viewed.
 *
 * Self-contained: builds the e-mail HTML from the on-disk template + i18n
 * phrases, enforces the 24-hour rate limit, honors the recipient's unsubscribe
 * flag and the user's notification settings, sends via Mailjet, and records the
 * time of notification.
 *
 * Intended to be called fire-and-forget from the invite route.
 *
 * @param {Object} db - invites database connection
 * @param {Object} args
 * @param {Object} args.event - event object (from getEvent; must include lang, timezone, country)
 * @param {Object} args.user - sender/user object (must include email, firstname, lastname)
 * @param {Object} args.recipient - recipient object (must include invitationid, recipientname, invitedAt)
 * @param {string|number} args.recipientid - recipientid route param
 * @param {number} args.userid - userid route param
 * @param {boolean} [args.isUser] - true when the sender is viewing their own invite (skip notifying)
 * @returns {Promise}
 */
module.exports = async function notifySenderByEmail(
  db,
  { event, user, recipient, recipientid, userid, isUser } = {},
) {
  if (!event || !user || !recipient || isUser) return;

  const phrases = getInvitePhrases(event.lang);
  const domain = getDomain();

  // Determine whether we may notify via e-mail (rate limit, unsubscribe, settings).
  const gate = await new Promise((resolve, reject) => {
    const sql = `
      SELECT
        i.invitationid,
        i.unsubscribedFromEmail,
        i.lastTimeNotifiedViaEmail,
        u.settings
      FROM
        invitations i
      INNER JOIN users u ON u.userid = i.userid
      WHERE
        i.invitationid = ?
      LIMIT 1
      ;
    `;

    db.query(sql, [recipient.invitationid], (error, result) => {
      if (error) {
        console.log(error);
        return reject(
          new Error("unable to query for last time user was notified via e-mail"),
        );
      }
      if (!result.length) {
        return reject(new Error("invitation not found"));
      }
      return resolve(result[0]);
    });
  });

  const invitationid = gate.invitationid;
  let proceed = true;

  if (gate.lastTimeNotifiedViaEmail) {
    const okToNotify = moment(gate.lastTimeNotifiedViaEmail).add(24, "hours");
    if (moment().utc().isBefore(okToNotify)) proceed = false;
  }

  if (gate.unsubscribedFromEmail === 1) proceed = false;

  let settings = gate.settings || null;
  if (typeof settings === "string") {
    try {
      settings = JSON.parse(settings);
    } catch (err) {
      settings = null;
    }
  }
  if (
    settings &&
    Object.prototype.hasOwnProperty.call(settings, "enableEmailNotifications") &&
    settings.enableEmailNotifications !== true
  ) {
    proceed = false;
  }

  if (!proceed) return;

  // Build the e-mail HTML from the template.
  const messageID = crypto.randomUUID();
  const userLocale = `${event.lang || "en"}-${(event.country || "us").toUpperCase()}`;
  const timeZone = event.timezone || "America/Phoenix";

  const dateOpts = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZone: timeZone,
  };

  const dateTimeNow = new Intl.DateTimeFormat(userLocale, dateOpts).format(
    new Date(),
  );
  const dateTimeSent = new Intl.DateTimeFormat(userLocale, dateOpts).format(
    new Date(recipient.invitedAt),
  );

  const isRecurringEvent = event.frequency !== "once";
  const isMultiDay = event.multidaybegindate ? true : false;

  let eventDateTime;
  if (isRecurringEvent || !isMultiDay) {
    eventDateTime = new Intl.DateTimeFormat(userLocale, dateOpts).format(
      new Date(event.startdate),
    );
  } else {
    const shortOpts = { ...dateOpts, weekday: "short", month: "short" };
    const fromDateTime = new Intl.DateTimeFormat(userLocale, shortOpts).format(
      new Date(event.startdate),
    );
    const toDateTime = new Intl.DateTimeFormat(userLocale, shortOpts).format(
      new Date(event.enddate),
    );
    eventDateTime = `${fromDateTime} - ${toDateTime}`;
  }

  const followUpLink = `${domain}/r/?utm_source=email#/${recipient.invitationid}`;

  let latitude;
  let longitude;
  if (event.locationcoordinates) {
    if (Object.prototype.hasOwnProperty.call(event.locationcoordinates, "x")) {
      longitude = event.locationcoordinates.x;
    }
    if (Object.prototype.hasOwnProperty.call(event.locationcoordinates, "y")) {
      latitude = event.locationcoordinates.y;
    }
  }

  const { document } = new JSDOM(getEmailTemplate()).window;

  document.title = (phrases["email-subject-viewed-invite"] || "")
    .replaceAll("{RECIPIENT-NAME}", recipient.recipientname)
    .replaceAll("{EVENT-TITLE}", event.title);

  // Match i18n keys with template keys.
  document.querySelectorAll("[data-i18n]").forEach((item) => {
    const key = item.getAttribute("data-i18n");
    if (Object.prototype.hasOwnProperty.call(phrases, key)) {
      item.innerHTML = phrases[key];
    }
    item.removeAttribute("data-i18n");
  });

  // Match template vars with computed values (replaces the original eval()).
  const vars = { eventDateTime, dateTimeSent, dateTimeNow, messageID };
  document.querySelectorAll("[data-var]").forEach((item) => {
    const key = item.getAttribute("data-var");
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      item.innerHTML = vars[key];
    }
    item.removeAttribute("data-var");
  });

  // Match event data with template event vars.
  document.querySelectorAll("[data-event]").forEach((item) => {
    const key = item.getAttribute("data-event");
    item.innerHTML = event[key];
    item.removeAttribute("data-event");
  });

  // Populate the unsubscribe link.
  const unsubscribeToken = await getUnsubscribeToken(db, recipientid, userid);
  const unsubscribeLink = `${domain}/unsubscribe/?${unsubscribeToken}`;
  const unsubscribeEl = document.querySelector("#unsubscribe");
  if (unsubscribeEl) unsubscribeEl.setAttribute("href", unsubscribeLink);

  // Optional "view invite" link (only present in some templates).
  const viewInviteLinkEl = document.querySelector("#viewInviteLink");
  if (viewInviteLinkEl) {
    if (latitude && longitude) {
      const viewInviteLink = `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`;
      if (viewInviteLinkEl.hasAttribute("href")) {
        viewInviteLinkEl.setAttribute("href", viewInviteLink);
      }
    } else {
      viewInviteLinkEl.remove();
    }
  }

  let subject = (phrases["email-subject-viewed-invite"] || "")
    .replaceAll("{RECIPIENT-NAME}", recipient.recipientname)
    .replaceAll("{EVENT-TITLE}", event.title);

  let body = document.body.innerHTML;
  body = body.replaceAll("{RECIPIENT-NAME}", recipient.recipientname);

  if (event.isDeleted === 1) {
    const deletedColor = "#f44336"; // corresponds to --var(danger) on the front end
    const isDeleted =
      phrases["email-event-is-deleted"] || phrases["eventIsDeleted"] || "";
    const eventIsDeletedHTML = `
      <strike style="color: ${deletedColor}">${event.title}</strike></a>
      <span style="white-space: nowrap">
        &nbsp;
        <span style="color: ${deletedColor}">${isDeleted}</span>
      </span>
    `;
    body = body.replaceAll("{EVENT-TITLE}", eventIsDeletedHTML);
  } else {
    body = body.replaceAll("{EVENT-TITLE}", event.title);
  }

  body = body.replaceAll("{FOLLOW-UP-LINK}", followUpLink);
  body = body.replaceAll("{EVENT-TIMEZONE}", timeZone);

  const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body id="invitesemail">
    ${body}
  </body>
</html>
  `.trim();

  // Send the e-mail, then record the time of notification on success.
  const recipientName = `${user.firstname} ${user.lastname}`;
  const emailResult = await sendEmailViaMailjet(
    recipientName,
    user.email,
    "invites.mobi",
    subject,
    html,
  );

  const emailSucceeded =
    emailResult.statusCode >= 200 && emailResult.statusCode < 300;

  if (!emailSucceeded) {
    throw new Error(`e-mail send failed (status ${emailResult.statusCode})`);
  }

  await new Promise((resolve, reject) => {
    const sql = `
      UPDATE
        invitations
      SET
        lastTimeNotifiedViaEmail = UTC_TIMESTAMP()
      WHERE
        invitationid = ?
      ;
    `;
    db.query(sql, [invitationid], (error) => {
      if (error) {
        console.log(error);
        return reject(
          new Error(
            "unable to update invite with last time user was notified via e-mail",
          ),
        );
      }
      return resolve();
    });
  });

  return emailResult;
};
