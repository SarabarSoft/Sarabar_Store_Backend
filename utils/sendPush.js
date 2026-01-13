const admin = require("../config/firebase");

const sendPush = async (fcmToken, title, body, data = {}) => {
  try {
    if (!fcmToken) return;

    const message = {
      token: fcmToken,
      notification: {
        title,
        body
      },
      data
    };

    const response = await admin.messaging().send(message);
    console.log("Push sent:", response);
    return response;

  } catch (error) {
    console.error("Push error:", error.message);
  }
};

module.exports = sendPush;
