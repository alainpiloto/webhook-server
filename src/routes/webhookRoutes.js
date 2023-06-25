const express = require("express");
const {
  webhookGetHandler,
  webhookPostHandler,
} = require("../controllers/webhookController");

const router = express.Router();

// Ruta GET para el webhook
router.get("/webhook", webhookGetHandler);

// Ruta POST para el webhook
router.post("/webhook", webhookPostHandler);

module.exports = router;
