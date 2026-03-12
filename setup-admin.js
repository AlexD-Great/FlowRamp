// ONE-TIME SETUP SCRIPT - DELETE AFTER USE
// Run: node setup-admin.js admin@example.com

const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json'); // Download from Firebase

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function setAdminRole(email) {
  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Set custom claim
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });
    
    // Update Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      role: 'admin',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log(`✅ Admin role set for ${email}`);
    console.log(`UID: ${userRecord.uid}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit();
}

const email = process.argv[2];
if (!email) {
  console.log('Usage: node setup-admin.js admin@example.com');
  process.exit(1);
}

setAdminRole(email);
