/**
 * Admin notification service.
 * Supports Telegram and Email (SMTP/nodemailer).
 * Only sends via channels whose env vars are configured.
 *
 * Env vars:
 *   TELEGRAM_BOT_TOKEN  — Bot token from @BotFather
 *   TELEGRAM_CHAT_ID    — Chat/group ID to send alerts to
 *   SMTP_HOST           — e.g. smtp.gmail.com
 *   SMTP_PORT           — e.g. 587
 *   SMTP_USER           — sender email address
 *   SMTP_PASS           — sender email password / app password
 *   ADMIN_EMAIL         — recipient email address
 */

const https = require("https");

// ── Telegram ────────────────────────────────────────────────────────────────

function sendTelegram(message) {
  return new Promise((resolve, reject) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return resolve(); // not configured

    const body = JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" });
    const options = {
      hostname: "api.telegram.org",
      path: `/bot${token}/sendMessage`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        if (res.statusCode !== 200) {
          console.error("[NOTIFIER] Telegram API error:", res.statusCode, data);
        } else {
          console.log("[NOTIFIER] Telegram sent OK");
        }
        resolve();
      });
    });
    req.on("error", (err) => {
      console.error("[NOTIFIER] Telegram error:", err.message);
      resolve();
    });
    req.write(body);
    req.end();
  });
}

// ── Email ────────────────────────────────────────────────────────────────────

async function sendEmail(subject, text) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const recipient = process.env.ADMIN_EMAIL;
  if (!host || !user || !pass || !recipient) return; // not configured

  try {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: { user, pass },
    });
    await transporter.sendMail({ from: user, to: recipient, subject, text });
  } catch (err) {
    console.error("[NOTIFIER] Email error:", err.message);
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Notify admin of a new buy (on-ramp) proof submission.
 */
async function notifyNewBuyOrder({ sessionId, userEmail, fiatAmount, estimatedFLOW, walletAddress }) {
  const lines = [
    `🟢 <b>New Buy Order — Proof Submitted</b>`,
    ``,
    `👤 User: ${userEmail}`,
    `💰 Amount: ₦${Number(fiatAmount).toLocaleString()}`,
    `📦 Estimated FLOW: ${estimatedFLOW} FLOW`,
    `🔑 Wallet: <code>${walletAddress}</code>`,
    `🆔 Session: <code>${sessionId}</code>`,
    ``,
    `⚡ Log in to the admin portal to review and approve.`,
  ];
  const message = lines.join("\n");
  const subject = `[FlowRamp] New Buy Order — ₦${Number(fiatAmount).toLocaleString()}`;
  const plain = lines.map((l) => l.replace(/<[^>]+>/g, "")).join("\n");

  await Promise.all([sendTelegram(message), sendEmail(subject, plain)]);
  console.log(`[NOTIFIER] Buy order alert sent for session ${sessionId}`);
}

/**
 * Notify admin of a new sell (off-ramp) proof submission.
 */
async function notifyNewSellOrder({ requestId, userEmail, flowAmount, estimatedNGN, bankDetails }) {
  const bank = bankDetails
    ? `${bankDetails.account_name} — ${bankDetails.account_number} (${bankDetails.bank_name})`
    : "N/A";
  const lines = [
    `🔴 <b>New Sell Order — Proof Submitted</b>`,
    ``,
    `👤 User: ${userEmail}`,
    `📦 FLOW Amount: ${flowAmount} FLOW`,
    `💰 Estimated Payout: ₦${Number(estimatedNGN).toLocaleString()}`,
    `🏦 Bank: ${bank}`,
    `🆔 Request: <code>${requestId}</code>`,
    ``,
    `⚡ Log in to the admin portal to review and approve.`,
  ];
  const message = lines.join("\n");
  const subject = `[FlowRamp] New Sell Order — ${flowAmount} FLOW`;
  const plain = lines.map((l) => l.replace(/<[^>]+>/g, "")).join("\n");

  await Promise.all([sendTelegram(message), sendEmail(subject, plain)]);
  console.log(`[NOTIFIER] Sell order alert sent for request ${requestId}`);
}

module.exports = { notifyNewBuyOrder, notifyNewSellOrder };
