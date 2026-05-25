const express = require("express");
const path = require("path");
const axios = require("axios");
const app = express();

require("dotenv").config();

// Set EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// 1. Define your specific dynamic EJS route first
app.get("/i/:eventid/:userid/:recipientid", (req, res) => {
  const { eventid, userid, recipientid } = req.params;

  res.render("invite", {
    title: "Invitation",
    eventid: eventid,
    userid: userid,
    recipientid: recipientid,
  });
});

// Web app manifest: proxy from upstream API, forwarding Accept-Language and Cookie headers
app.get("/manifest/", async (req, res) => {
  exports.GET = (req, res) => {
    let localizedContent = {
      name: {
        en: "Invites",
      },
      short_name: {
        en: "Invites",
      },
      description: {
        en: "The Invites app is a tool for members in good standing with the International Christian Churches (a.k.a. SoldOut Discipling Movement), online at usd21.org.  It enables users to send digital invites to people that they invite to church functions, such as Sunday services or small discussion groups known as Bible Talks.",
      },
      screenshots: {
        en: [],
      },
    };

    let manifest = {
      name: localizedContent.name.en,
      short_name: localizedContent.short_name.en,
      description: localizedContent.description.en,
      icons: [
        {
          src: "https://invites.mobi/android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "https://invites.mobi/android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "https://invites.mobi/maskable-android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "https://invites.mobi/maskable-android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
      theme_color: "#102951",
      background_color: "#8882d3",
      display: "standalone",
      orientation: "portrait",
      start_url: "https://invites.mobi/?utm_source=homescreen",
      id: "03420b27-a52f-4643-af3a-857d238673dd",
      dir: "auto",
      scope: "/",
      categories: ["productivity", "religion"],
    };

    if (req.cookies.preAuthArray) {
      const strPreAuthArray = req.cookies.preAuthArray;
      const preAuthArray = strPreAuthArray.split(",").map(Number);
      const churchid = preAuthArray[0];
      const authorizedby = preAuthArray[1];
      const authcode = preAuthArray[2];

      manifest.start_url = `${manifest.start_url}&churchid=${churchid}&authorizedby=${authorizedby}&authcode=${authcode}`;
    }

    let preferredLanguage = req.headers["accept-language"];

    let favoriteLanguages = preferredLanguage
      ? preferredLanguage.split(",")
      : ["en"];

    favoriteLanguages.reverse();

    favoriteLanguages.forEach(function (fullLanguageCode) {
      let simplifiedCode = fullLanguageCode.slice(0, 2);

      if (localizedContent.name[simplifiedCode]) {
        manifest.name = localizedContent.name[simplifiedCode];
      }

      if (localizedContent.short_name[simplifiedCode]) {
        manifest.short_name = localizedContent.short_name[simplifiedCode];
      }

      if (localizedContent.description[simplifiedCode]) {
        manifest.description = localizedContent.description[simplifiedCode];
      }

      if (localizedContent.screenshots[simplifiedCode]) {
        manifest.screenshots = localizedContent.screenshots[simplifiedCode];
      }
    });

    res.setHeader("Content-Type", "application/json");

    res.status(200).send(manifest);
  };
});

// 2. Serve everything else out of the public folder statically
app.use(express.static(path.join(__dirname, "public")));

// Handle 404s if a file or route isn't found
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// Use the environment port or default to 3001
const PORT = process.env.INVITES_MOBI_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running internally on port ${PORT}`);
});
