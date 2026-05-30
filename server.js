const express = require("express");
const path = require("path");
const axios = require("axios");
const requestIp = require("request-ip");
const cookieParser = require("cookie-parser");
const app = express();

require("dotenv").config();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(requestIp.mw());
app.use(cookieParser());

app.get("/i/:eventid/:userid/:recipientid", require("./routes/invite"));
app.get("/manifest", require("./routes/manifest"));

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res) => {
  res.status(404).send("Page not found");
});

const PORT = process.env.INVITES_MOBI_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running internally on port ${PORT}`);
});
