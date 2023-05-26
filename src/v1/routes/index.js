const express = require("express");
const router = express.Router();

router.route("/").get((req, res) => {
  console.log("You are in the main route");
  res.send("<h1>Hello World!</h1>");
});

module.exports = router;
