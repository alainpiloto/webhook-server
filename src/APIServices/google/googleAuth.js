const { default: axios } = require("axios");

require("dotenv").config();

const refreshToken = async (token) => {
  try {
    const url =
      "https://oauth2.googleapis.com/token?" +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
        // refresh_token: token,
        refresh_token:
          "1//05zAhod6Nr9pjCgYIARAAGAUSNwF-L9IrWLY6vGD0EpCIv_CV90VWnXIX-GhPT1P4XENyhliBJcTNEbt7rzblr0mflv6pYFx3oN0",
      });

    const response = await axios(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });
    const data = response.data;
    console.log("data from refresh token line 21", data);
    return data;
  } catch (error) {
    console.error("error", error);
  }
};

module.exports = {
  refreshToken,
};
