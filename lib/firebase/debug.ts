// Debug Firebase Configuration
import firebaseConfig from "./config";

export function debugFirebaseConfig() {
  console.log("=== Firebase Config Debug ===");
  console.log("apiKey:", firebaseConfig.apiKey ? "✓ Set" : "✗ Missing");
  console.log("authDomain:", firebaseConfig.authDomain ? "✓ Set" : "✗ Missing");
  console.log("projectId:", firebaseConfig.projectId ? "✓ Set" : "✗ Missing");
  console.log("storageBucket:", firebaseConfig.storageBucket ? "✓ Set" : "✗ Missing");
  console.log("messagingSenderId:", firebaseConfig.messagingSenderId ? "✓ Set" : "✗ Missing");
  console.log("appId:", firebaseConfig.appId ? "✓ Set" : "✗ Missing");
  console.log("Full config:", firebaseConfig);
  console.log("===========================");
}
