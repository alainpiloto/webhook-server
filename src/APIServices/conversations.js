const { strapi } = require("../axiosInstances");

const updateConversation = async (params) => {
  try {
    const response = await strapi.put(`pi/conversations/${conversationId}`, {
      data: {
        data: {
          ...params,
        },
      },
    });
    console.log("response of updateConversation", response.data);
    return response;
  } catch (error) {
    console.error("error", error);
  }
};

module.exports = {
  updateConversation,
};
