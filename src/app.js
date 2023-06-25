"use strict";

require("dotenv").config();

const express = require("express");
const body_parser = require("body-parser");

const app = express().use(body_parser.json()); // creates express http server

const webhookRoutes = require("./routes/webhookRoutes");
const webhookRouter = require("./routes/webhookRoutes");

const PORT = process.env.PORT || 1339;

app.listen(PORT, () => console.log("webhook is listening", PORT));

// app.use("/api/v1", v1Router);
app.use(webhookRoutes, webhookRouter);

// Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
