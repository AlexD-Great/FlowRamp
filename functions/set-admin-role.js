const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Cloud Function to set admin role
exports.setAdminRole = functions.https.onCall(async (data, context) => {
  // Security check - only existing admins can set new admins
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const callerUid = context.auth.uid;
  const targetEmail = data.email;
  
  // Verify caller is admin
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  if (!callerDoc.exists || callerDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  // Get target user
  const userRecord = await admin.auth().getUserByEmail(targetEmail);
  
  // Set custom claim
  await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });
  
  // Update Firestore document
  await admin.firestore().collection('users').doc(userRecord.uid).set({
    uid: userRecord.uid,
    email: targetEmail,
    role: 'admin',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return { success: true, message: `Admin role set for ${targetEmail}` };
});
