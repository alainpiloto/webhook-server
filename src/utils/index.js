const { get, isEmpty, first } = require("lodash");

const getEventItems = (body) => {
  console.log("body from getMessageType", JSON.stringify(body, null, 2));

  const object = get(body, "object", "");
  const entry = get(body, "entry", []);
  const id = get(entry, "[0].id", "");
  const changes = get(entry, "[0].changes", []);
  const value = get(changes, "[0].value", []);
  const statuses = get(value, "statuses", []);
  const contacts = get(value, "contacts", []);
  const messages = get(value, "messages", []);
  const field = get(changes, "field", "");
  const context = get(messages, "[0].context", {});
  // console.logs of the above variables

  // return the above variables
  return {
    object,
    entry,
    id,
    changes,
    value,
    statuses,
    contacts,
    messages,
    field,
    context,
  };
};

const getEventType = (body) => {
  const { value, statuses } = getEventItems(body);
  let type = null;
  const button = get(messages, "[0].button", {});

  if (!isEmpty(statuses)) {
    type = "status";
  }
  if (!isEmpty(button)) {
    type = "quickReply";
  }

  return type;
};

const getNewStatus = (body) => {
  const { statuses, messages } = getEventItems(body);

  let newStatus = null;

  if (!isEmpty(statuses)) {
    const status = get(statuses, "[0].status", []);
    if (status === "delivered") {
      newStatus = "sent";
    }
    if (status === "read") {
      newStatus = "read";
    }
    return newStatus;
  }

  if (!isEmpty(messages)) {
    const buttonPayload = get(messages, "[0].button.payload", null);
    console.log("buttonPayload 200", buttonPayload);
    const payloadObject = JSON.parse(buttonPayload);
    const clienTresponse = get(payloadObject, "response", null);
    newStatus = clienTresponse;
    return newStatus;
  }
};

module.exports = {
  getEventItems,
  getEventType,
  getNewStatus,
};
