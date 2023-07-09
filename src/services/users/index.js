const { strapi } = require("../../axiosInstances");

const getUsers = async () => {
  try {
    const response = await strapi("api/users");
    return response.data;
  } catch (error) {
    console.error("error", error);
  }
};

const updateUser = async ({ userId, params }) => {
  try {
    const response = await strapi.put(
      `api/users/${userId}`,

      {
        ...params,
      }
    );
  } catch (error) {
    const errorMessages = error.response.data.error.message;
    throw new Error(errorMessages);
  }
};

const updateGoogleSession = async (params) => {
  const { userId, refreshToken, accessToken, accessTokenExpires } = params;
  try {
    const response = await strapi.put(
      `api/users/${userId}`,

      {
        googleSession: {
          refreshToken,
          accessToken,
          accessTokenExpires,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.STRAPI_TOKEN}`,
        },
      }
    );
  } catch (error) {
    console.log(error, "error updating google session");
  }
};
module.exports = { getUsers, updateUser, updateGoogleSession };
