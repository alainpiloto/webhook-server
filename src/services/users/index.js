const { strapi } = require("../../axiosInstances");

const getUsers = async () => {
  try {
    const response = await strapi("api/users");
    console.log("response of getUsers", response.data);
    return response.data;
  } catch (error) {
    console.error("error", error);
  }
};

const updateUser = async ({ userId, params }) => {
  console.log("params", params);
  try {
    const response = await strapi.put(
      `api/users/${userId}`,

      {
        ...params,
      }
    );
  } catch (error) {
    console.log(error, "error updating google session");
    const errorMessages = error.response.data.error.message;
    throw new Error(errorMessages);
  }
};

module.exports = { getUsers, updateUser };
