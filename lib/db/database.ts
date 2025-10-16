import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
} from "@/lib/firebase/firestore";

export const userDb = {
  createUser: (data) => createDocument("users", data),
  getUser: (id) => getDocument("users", id),
  updateUser: (id, data) => updateDocument("users", id, data),
  deleteUser: (id) => deleteDocument("users", id),
};

export const onRampSessionDb = {
  createSession: (data) => createDocument("onRampSessions", data),
  getSession: (id) => getDocument("onRampSessions", id),
  updateSession: (id, data) => updateDocument("onRampSessions", id, data),
  deleteSession: (id) => deleteDocument("onRampSessions", id),
};

export const offRampRequestDb = {
  createRequest: (data) => createDocument("offRampRequests", data),
  getRequest: (id) => getDocument("offRampRequests", id),
  updateRequest: (id, data) => updateDocument("offRampRequests", id, data),
  deleteRequest: (id) => deleteDocument("offRampRequests", id),
};

export const txReceiptDb = {
  createReceipt: (data) => createDocument("txReceipts", data),
  getReceipt: (id) => getDocument("txReceipts", id),
  updateReceipt: (id, data) => updateDocument("txReceipts", id, data),
  deleteReceipt: (id) => deleteDocument("txReceipts", id),
};
