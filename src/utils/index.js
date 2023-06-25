const { get, isEmpty, first } = require("lodash");

const getEventItems = (body) => {
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
    const payloadObject = JSON.parse(buttonPayload);
    const clienTresponse = get(payloadObject, "response", null);
    newStatus = clienTresponse;
    return newStatus;
  }
};

const parseEventTitle = ({ titleRef, response }) => {
  const responseColors = {
    sent: "🟡",
    attend: "🟢",
    cancel: "🔴",
    reschedule: "🟣",
  };

  const regex = /(🟡|🟣|🟢|🔴)/g;

  const containsEmoticon = regex.test(titleRef);

  if (!containsEmoticon) {
    return `${responseColors[response]} ${titleRef}`;
  } else {
    return titleRef.replace(regex, responseColors[response]);
  }
};

module.exports = {
  getEventItems,
  getEventType,
  getNewStatus,
  parseEventTitle,
};
