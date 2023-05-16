/*
 * Starter Project for WhatsApp Echo Bot Tutorial
 *
 * Remix this as the starting point for following the WhatsApp Echo Bot tutorial
 *
 */

"use strict";

const first = require("lodash/first");

// require axios for making http requests

// Access token for your app
// (copy token from DevX getting started page
// and save it as environment variable into the .env file)
// const token = process.env.WHATSAPP_TOKEN;
const token =
  "EAANHOOT6xKYBABkwbURjdszYckZAa8N3SGnbXsqYNK9s8HcvpfbjMvbCu410170q0HjbNWO9gOVREi17NFOSCJyVLGp2ZAbeIDTcxOCVRFZBbKTRZA7XZAAdgOWMTz0C96FYkb9ZAXRGSzZBBqBGND9Hgsz9Iw5xHWikCSG05N7vPsGjsqQbzeu1HAg5uzY1NSsdQOSlehbIQZDZD";

// Imports dependencies and set up http server
const request = require("request"),
  express = require("express"),
  body_parser = require("body-parser"),
  axios = require("axios").default,
  app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1339, () => console.log("webhook is listening"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const strapiUrl = axios.create({
  // baseURL: "https://dentaflowstrapi.up.railway.app/",
  baseURL: "http://localhost:1337/api/",
  headers: {
    "Content-Type": "application/json",
    Authorization:
      "Bearer " +
      "e474145b413004a5480039e56b3544a1a06881264788a7adf18994891babcf4637e4d7be3cfb11be06023797ec191928758dcc254b0ef0f8572b5253a1bbe8c986efe93fe528e6472676d14dca168e7f5a0c9f265e7248b0a160748701877039380e836c556e8634d59471d08f608a74622a10292a315cdc7532822d37d12517",
  },
});

console.log("strapiUrl", strapiUrl);

// Accepts POST requests at /webhook endpoint
app.post("/webhook", (req, res) => {
  // Parse the request body from the POST
  let body = req.body;
  console.log(JSON.stringify(req.body, null, 2));

  const changeReminderStatus = async (params) => {
    const {
      message_id,
      appointment_id,
      reminderStatusReference = [],
      newStatus,
    } = params;

    const reminderStatusUpdated = [
      ...reminderStatusReference,
      {
        createdAt: new Date(),
        fromStatus: "notSentYet",
        statusName: newStatus,
      },
    ];
    try {
      const response = await axios({
        method: "PUT",
        url: `http://localhost:1337/api/appointments/${appointment_id}`,
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer " +
            "e474145b413004a5480039e56b3544a1a06881264788a7adf18994891babcf4637e4d7be3cfb11be06023797ec191928758dcc254b0ef0f8572b5253a1bbe8c986efe93fe528e6472676d14dca168e7f5a0c9f265e7248b0a160748701877039380e836c556e8634d59471d08f608a74622a10292a315cdc7532822d37d12517",
        },
        data: {
          data: {
            reminderStatus: JSON.stringify(reminderStatusUpdated),
          },
        },
      });
      console.log("response", response.data);
    } catch (error) {
      console.error("error", error);
    }
  };

  const changeReminderReplyStatus = async (conversationId) => {
    console.log("conversationId", conversationId);
    const payload = {
      replied: true,
      repliedAt: new Date(),
      msg_id_replied: req.body.entry[0].changes[0].value.messages[0].id,
    };
    try {
      const response = await axios({
        method: "PUT",
        url: `http://localhost:1337/api/conversations/${conversationId}`,
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer " +
            "e474145b413004a5480039e56b3544a1a06881264788a7adf18994891babcf4637e4d7be3cfb11be06023797ec191928758dcc254b0ef0f8572b5253a1bbe8c986efe93fe528e6472676d14dca168e7f5a0c9f265e7248b0a160748701877039380e836c556e8634d59471d08f608a74622a10292a315cdc7532822d37d12517",
        },

        data: {
          data: {
            reminder_reply_status: JSON.stringify(payload),
          },
        },
      });
      console.log("response", response.data);
    } catch (error) {
      console.error("error changing reminder_reply_status", error);
    }
  };

  const getConversationByMessageId = async (message_id) => {
    try {
      const response = await axios({
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer " +
            "e474145b413004a5480039e56b3544a1a06881264788a7adf18994891babcf4637e4d7be3cfb11be06023797ec191928758dcc254b0ef0f8572b5253a1bbe8c986efe93fe528e6472676d14dca168e7f5a0c9f265e7248b0a160748701877039380e836c556e8634d59471d08f608a74622a10292a315cdc7532822d37d12517",
        },
        url: `http://localhost:1337/api/conversations?populate=*&filters[init_message_id]=${message_id}`,
      });

      console.log("conversation data", response.data);
      console.log("message_id from get", message_id);
      if (response.data?.data.length > 0) {
        console.log("conversation data inside", response.data.data[0]);
        const conversationId = response.data.data[0].id;

        const appointment_id =
          response.data.data[0].attributes.appointment.data.id;

        const reminderStatusReference =
          response.data.data[0].attributes.appointment.data.attributes
            .reminderStatus;

        const reminder_reply_status =
          response.data.data[0].attributes.reminder_reply_status?.replied ??
          false;

        console.log("reminder_reply_status", reminder_reply_status);

        console.log("before setting MessageStatus");
        const isMessageStatus = !!req.body.entry[0].changes[0].value?.statuses;
        if (isMessageStatus) {
          const messageStatus =
            req.body.entry[0].changes[0].value?.statuses[0].status;

          console.log("messageStatus", messageStatus);
          if (messageStatus === "delivered") {
            changeReminderStatus({
              message_id,
              appointment_id,
              reminderStatusReference,
              newStatus: "sent",
            });
          }
          if (messageStatus === "read") {
            changeReminderStatus({
              message_id,
              appointment_id,
              reminderStatusReference,
              newStatus: "read",
            });
            return;
          }
        }

        const buttonPayload =
          req.body.entry[0].changes[0]?.value?.messages[0].button.payload;

        const newStatus = first(buttonPayload.split(":"));

        const type = body.entry[0].changes[0].value.messages[0].type;
        if (type === "button") {
          if (!reminder_reply_status) {
            changeReminderStatus({
              message_id,
              appointment_id,
              reminderStatusReference,
              newStatus,
            });
            changeReminderReplyStatus(conversationId);
          }
        }
        console.log("reminderStatusReference", reminderStatusReference);
        console.log("appointment_id", appointment_id);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const isMessageStatus = !!req.body.entry[0].changes[0].value?.statuses;
  console.log("isMessageStatus", isMessageStatus);

  if (isMessageStatus) {
    const message_id = req.body.entry[0].changes[0].value?.statuses[0].id;
    getConversationByMessageId(message_id);
  }

  if (req.body.object) {
    console.log("is an object");
    if (
      body.entry[0].changes[0].value &&
      body.entry[0].changes[0].value.messages &&
      body.entry[0].changes[0].value.messages[0] &&
      body.entry[0].changes[0].value.messages[0].context &&
      body.entry[0].changes[0].value.messages[0].context.id
    ) {
      const message_id = body.entry[0].changes[0].value.messages[0].context.id;
      console.log(
        "message as a response to init message in database",
        message_id
      );

      console.log("button quick reply");
      getConversationByMessageId(message_id);
    }
  }

  // Check the Incoming webhook message

  // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  if (req.body.object) {
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
    ) {
      let phone_number_id =
        req.body.entry[0].changes[0].value.metadata.phone_number_id;
      let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
      let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload
      axios({
        method: "POST", // Required, HTTP method, a string, e.g. POST, GET
        url:
          "https://graph.facebook.com/v12.0/" +
          phone_number_id +
          "/messages?access_token=" +
          token,
        data: {
          messaging_product: "whatsapp",
          to: from,
          text: { body: "Ack: " + msg_body },
        },
        headers: { "Content-Type": "application/json" },
      });
    }
    res.sendStatus(200);
  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp API
    res.sendStatus(404);
  }
});

// Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/webhook", (req, res) => {
  /**
   * UPDATE YOUR VERIFY TOKEN
   *This will be the Verify Token value when you set up webhook
   **/
  // const verify_token = process.env.VERIFY_TOKEN;
  const verify_token = "HAPPY";
  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});
