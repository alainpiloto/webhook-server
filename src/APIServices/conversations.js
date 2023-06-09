const { strapi } = require("../axiosInstances");

const updateConversation = async (conversationId, params) => {
  try {
    const response = await strapi.put(`api/conversations/${conversationId}`, {
      data: {
        ...params,
      },
    });
    return response;
  } catch (error) {
    console.error("error", error);
  }
};

const getConversationByMessageId = async (message_id) => {
  try {
    const response = await strapi(
      `api/conversations?populate=*&filters[init_message_id]=${message_id}`
    );
    return response;
  } catch (error) {
    console.error("error", error);
  }
};

module.exports = {
  updateConversation,
  getConversationByMessageId,
};
