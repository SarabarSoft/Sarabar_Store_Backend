const admin = require("firebase-admin");

let serviceAccount;

if (process.env.FIREBASE_PRIVATE_KEY) {
  // 👉 Vercel / production

  console.log("✅ Using ENV Firebase credentials");

  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
} else {
  console.log("⚠ Using LOCAL firebase-service-account.json");
  // 👉 Local development
  serviceAccount = require("../firebase-service-account.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;

