
const admin = require('firebase-admin');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.join(__dirname, 'Jarvis', '.env.local') });

async function testConnections() {
  console.log('--- Testing Connections ---');

  // 1. Test MongoDB
  console.log('\n1. Testing MongoDB...');
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is missing');
  } else {
    try {
      console.log('Connecting to:', mongoUri.replace(/:([^@]+)@/, ':****@'));
      await mongoose.connect(mongoUri);
      console.log('✅ MongoDB Connected Successfully');
      await mongoose.disconnect();
    } catch (err) {
      console.error('❌ MongoDB Connection Failed:', err.message);
    }
  }

  // 2. Test Firebase Admin
  console.log('\n2. Testing Firebase Admin...');
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Firebase credentials missing');
  } else {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
      }
      // Try to list users as a simple check
      await admin.auth().listUsers(1);
      console.log('✅ Firebase Admin Initialized & Verified Successfully');
    } catch (err) {
      console.error('❌ Firebase Admin Failed:', err.message);
    }
  }

  console.log('\n--- Test Complete ---');
}

testConnections();
