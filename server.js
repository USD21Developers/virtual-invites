const express = require("express");
const path = require("path");
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
