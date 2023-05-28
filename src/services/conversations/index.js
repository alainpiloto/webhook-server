const { get, isEmpty } = require("lodash");
const {
  updateConversation,
  getConversationByMessageId,
} = require("../../APIServices/conversations");
const { getEventItems, getNewStatus } = require("../../utils");

const changeConversationReplyStatus = async (body) => {
  //   const { message_id, conversationId, replyStatusReference, newStatus } = data;
  const { statuses, context } = getEventItems(body);

  const isMessageStatus = !isEmpty(statuses);
  console.log("isMessageStatus", isMessageStatus);

  let message_id = null;

  if (isMessageStatus) {
    message_id = get(statuses, "[0].id", null);
    await getConversationByMessageId(message_id);
  }

  if (context?.id) {
    console.log("context.id", context.id);

    message_id = context.id;
    console.log(
      "message as a response to init message in database",
      message_id
    );

    console.log("button quick reply");
    await getConversationByMessageId(message_id);
  }

  const conversationResponse = await getConversationByMessageId(message_id);
  console.log("conversationResponse 36", conversationResponse);
  console.log("conversation data", conversationResponse.data);
  console.log("message_id from get", message_id);

  if (conversationResponse?.data?.length > 0) {
    console.log("conversation data inside", conversationResponse.data[0]);
    const conversationId = conversationResponse.data[0].id;
    console.log("conversationId", conversationId);

    const replyStatusReference = get(
      conversationResponse,
      "data[0].attributes.reminder_reply_status",
      []
    );

    console.log("reminder_reply_status", replyStatusReference);

    console.log("before setting MessageStatus");

    const newStatus = getNewStatus(body);
    console.log("newStatus", newStatus);
    const reminderStatusUpdated = [
      ...(replyStatusReference || []),
      {
        createdAt: new Date(),
        fromStatus: "notSentYet",
        statusName: newStatus,
      },
    ];

    const params = {
      reminder_reply_status: JSON.stringify(reminderStatusUpdated),
    };

    const response = await updateConversation(conversationId, params);
  }
};

module.exports = {
  changeConversationReplyStatus,
};
