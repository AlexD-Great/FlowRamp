require("dotenv").config({ path: "../.env" });
const { queryDocuments, updateDocument } = require("../lib/firebase-admin");
const { getTransactionStatus } = require("../lib/flow-client");

const PENDING_STATUS = "pending";

async function checkDeposits() {
  console.log("Checking for new deposits...");

  try {
    const pendingRequests = await queryDocuments("offRampRequests", "status", "==", PENDING_STATUS);

    if (pendingRequests.length === 0) {
      console.log("No pending requests found.");
      return;
    }

    for (const request of pendingRequests) {
      console.log(`Checking request: ${request.id}`);
      // In a real application, you would query the Flow blockchain for transactions
      // to the service wallet with the correct memo.
      // For this example, we will just simulate a successful deposit.
      const depositFound = true;

      if (depositFound) {
        console.log(`Deposit found for request: ${request.id}`);
        await updateDocument("offRampRequests", request.id, { status: "funded" });
        // In a real application, you would trigger the payout process here.
      }
    }
  } catch (error) {
    console.error("Error checking deposits:", error);
  }
}

checkDeposits();
