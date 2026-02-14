const admin = require("../config/firebase");

const sendPush = async (token, title, body, data = {}) => {
  try {
    const message = {
      token,
      notification: {
        title,
        body,
      },
      data,
    };

    const response = await admin.messaging().send(message);

    console.log("Push sent:", response);
  } catch (error) {
    console.error("Push error:", error);
  }
};

module.exports = sendPush;
