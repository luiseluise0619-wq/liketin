const admin = require('firebase-admin');
const logger = require('../utils/logger');

let auth = null;
let messaging = null;
let storage = null;

// Firebase is optional in local/dev/test. Guard initialization so the API can
// boot without credentials (features that need Firebase will no-op / throw
// only when actually invoked).
if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString()
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  auth = admin.auth();
  messaging = admin.messaging();
  storage = admin.storage();
} else {
  logger.warn('FIREBASE_SERVICE_ACCOUNT_BASE64 not set — Firebase features disabled');
}

module.exports = { auth, messaging, storage, admin };
