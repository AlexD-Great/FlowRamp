const admin = require("firebase-admin");

// --- Initialize Firebase Admin SDK ---
// Make sure to set the GOOGLE_APPLICATION_CREDENTIALS environment variable
// to the path of your service account key file.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

const db = admin.firestore();
const auth = admin.auth();

// --- Firestore Functions ---

const createDocument = async (collectionName, data) => {
  try {
    const docRef = await db.collection(collectionName).add(data);
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
};

const getDocument = async (collectionName, id) => {
  try {
    const docRef = db.collection(collectionName).doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return docSnap.data();
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (e) {
    console.error("Error getting document: ", e);
    throw e;
  }
};

const updateDocument = async (collectionName, id, data) => {
  try {
    const docRef = db.collection(collectionName).doc(id);
    await docRef.update(data);
  } catch (e) {
    console.error("Error updating document: ", e);
    throw e;
  }
};

const deleteDocument = async (collectionName, id) => {
  try {
    await db.collection(collectionName).doc(id).delete();
  } catch (e) {
    console.error("Error deleting document: ", e);
    throw e;
  }
};

const queryDocuments = async (collectionName, field, operator, value) => {
  try {
    const q = db.collection(collectionName).where(field, operator, value);
    const querySnapshot = await q.get();
    const results = [];
    querySnapshot.forEach((doc) => {
      results.push(doc.data());
    });
    return results;
  } catch (e) {
    console.error("Error querying documents: ", e);
    throw e;
  }
};

// --- Auth Functions ---

const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return null;
  }
};

module.exports = {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  verifyIdToken,
};
