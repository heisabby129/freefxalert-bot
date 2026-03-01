const http = require("http");
const https = require("https");

const BOT_TOKEN   = "8568199054:AAE7q3MtTEOlFrQnIGcH3Sntzltkik0eE6c";
const ADMIN_ID    = "5872932014";
const AFFILIATE   = "https://one.exnessonelink.com/a/c_i881b93buq";
const VIDEO_LINK  = "https://youtu.be/ow6jpNizr0c?si=dCRgWdwPspRExiX8";
const MIN_DEPOSIT = "$50";
const GROUP_LINK  = "https://t.me/freefxalert";
const API         = "https://api.telegram.org/bot" + BOT_TOKEN;

// ── Simple HTTPS POST to Telegram ────────────────────────────
function tg(endpoint, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const opts = {
      hostname: "api.telegram.org",
      path: "/bot" + BOT_TOKEN + "/" + endpoint,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
    };
    const req = https.request(opts, (res) => {
      let raw = "";
      res.on("data", d => raw += d);
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); } catch(e) { resolve({}); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function sendMsg(chat_id, text, keyboard) {
  const payload = { chat_id, text, parse_mode: "HTML", disable_web_page_preview: true };
  if (keyboard) payload.reply_markup = keyboard;
  return tg("sendMessage", payload);
}

function sendPhotoAdmin(uid, uname, fname, file_id) {
  const who = uname ? "@" + uname : (fname || "User");
  return tg("sendPhoto", {
    chat_id: ADMIN_ID,
    photo: file_id,
    parse_mode: "HTML",
    caption:
      "📸 <b>Deposit Screenshot</b>\n\n" +
      "👤 " + who + "\n" +
      "🆔 <code>" + uid + "</code>\n\n" +
      "✅ <code>/approve " + uid + "</code>\n" +
      "❌ <code>/reject " + uid + "</code>"
  });
}

const levelKb = {
  inline_keyboard: [[
    { text: "1️⃣ Beginner",                    callback_data: "beginner"     },
    { text: "2️⃣ Intermediate/Already Trading", callback_data: "intermediate" }
  ]]
};

const fundedKb = {
  inline_keyboard: [[
    { text: "✅ I'm Funded!", callback_data: "funded" }
  ]]
};

// ── Handle each Telegram update ──────────────────────────────
async function handleUpdate(update) {

  // BUTTON TAPS
  if (update.callback_query) {
    const cb   = update.callback_query;
    const cid  = cb.message.chat.id;
    const data = cb.data;
    const name = cb.from.first_name || "there";

    await tg("answerCallbackQuery", { callback_query_id: cb.id });

    if (data === "beginner") {
      await sendMsg(cid,
        "Perfect, " + name + "! We'll guide you step by step. 👇\n\n" +
        "✅ <b>Step 1:</b> Open your trading account:\n" +
        "👉 <a href=\"" + AFFILIATE + "\">Click Here to Open Account</a>\n\n" +
        "✅ <b>Step 2:</b> Watch beginner setup video (5 mins):\n" +
        "👉 <a href=\"" + VIDEO_LINK + "\">Watch Setup Video</a>\n\n" +
        "✅ <b>Step 3:</b> Deposit minimum <b>" + MIN_DEPOSIT + "</b> to activate full access.\n\n" +
        "After funding, tap the button below 👇",
        fundedKb
      );
    }
    else if (data === "intermediate") {
      await sendMsg(cid,
        "Good. That changes your positioning completely.\n\n" +
        "To access our education, analysis & signals, your account must be connected via our partner link.\n\n" +
        "✅ <b>Open / re-open your account here:</b>\n" +
        "👉 <a href=\"" + AFFILIATE + "\">Click Here</a>\n\n" +
        "✅ Deposit minimum <b>" + MIN_DEPOSIT + "</b>\n\n" +
        "Click <b>\"I'm Funded\"</b> once done 👇",
        fundedKb
      );
    }
    else if (data === "funded") {
      await sendMsg(cid,
        "🔥 <b>VERIFICATION STEP</b>\n\n" +
        "Almost there! Please send me:\n\n" +
        "• Your <b>Trading Account Number</b> (type and send)\n" +
        "• A <b>screenshot of your deposit</b> (send as photo)\n\n" +
        "⏳ Verification takes 5–30 minutes.\n" +
        "(We confirm from affiliate dashboard)\n\n" +
        "<i>Send your account number now 👇</i>"
      );
    }
    return;
  }

  // REGULAR MESSAGES
  if (!update.message) return;

  const msg   = update.message;
  const cid   = msg.chat.id;
  const uid   = String(msg.from.id);
  const uname = msg.from.username || null;
  const fname = msg.from.first_name || "there";
  const text  = (msg.text || "").trim();

  // ADMIN COMMANDS
  if (uid === ADMIN_ID) {
    if (text.startsWith("/approve ")) {
      const target = text.replace("/approve ", "").trim();
      await sendMsg(Number(target),
        "✅ <b>You're in!</b>\n\n" +
        "Welcome to the Private Community! 🎉\n\n" +
        "Here's your link:\n" +
        "👉 <a href=\"" + GROUP_LINK + "\">Join Free Trading Community</a>\n\n" +
        "Start with the <b>\"Beginner Roadmap\"</b> pinned in the group.\n\n" +
        "See you inside! 🚀"
      );
      await sendMsg(cid, "✅ Done! User " + target + " approved and sent the group link.");
      return;
    }
    if (text.startsWith("/reject ")) {
      const target = text.replace("/reject ", "").trim();
      await sendMsg(Number(target),
        "❌ <b>Verification Failed</b>\n\n" +
        "We couldn't verify your deposit. Please make sure:\n\n" +
        "• You opened your account via our partner link\n" +
        "• You deposited minimum " + MIN_DEPOSIT + "\n\n" +
        "Type /start to try again."
      );
      await sendMsg(cid, "❌ User " + target + " rejected.");
      return;
    }
  }

  // /start
  if (text === "/start") {
    await sendMsg(cid,
      "🔥 <b>Welcome to the Free Trading Community!</b> 🎯\n\n" +
      "Inside you'll get:\n" +
      "✅ Free Forex Education (Beginner → Advanced)\n" +
      "✅ Weekly Market Analysis\n" +
      "✅ Live Trade Breakdowns\n" +
      "✅ Giveaways\n" +
      "✅ VIP Signals\n\n" +
      "To join, you must have a funded trading account through our partner link.\n\n" +
      "<b>Are you:</b>",
      levelKb
    );
    return;
  }

  // PHOTO - deposit screenshot
  if (msg.photo) {
    const file_id = msg.photo[msg.photo.length - 1].file_id;
    await sendPhotoAdmin(uid, uname, fname, file_id);
    await sendMsg(cid,
      "📸 Screenshot received! Thank you " + fname + ".\n\n" +
      "⏳ Your verification is being reviewed.\n" +
      "We'll notify you within 5–30 minutes. Hang tight! 🙏"
    );
    return;
  }

  // TEXT - account number
  if (text && !text.startsWith("/")) {
    const who = uname ? "@" + uname : fname;
    await sendMsg(ADMIN_ID,
      "📨 <b>New Verification Message</b>\n\n" +
      "👤 " + who + "\n" +
      "🆔 <code>" + uid + "</code>\n\n" +
      "📝 " + text + "\n\n" +
      "✅ <code>/approve " + uid + "</code>\n" +
      "❌ <code>/reject " + uid + "</code>"
    );
    await sendMsg(cid,
      "✅ Account number received!\n\n" +
      "Now send a <b>screenshot of your deposit</b> as a photo. 📸\n\n" +
      "<i>Screenshot your funded balance and send it here 👇</i>"
    );
    return;
  }

  // FALLBACK
  await sendMsg(cid,
    "👋 Hey " + fname + "! Type /start to join the Free Trading Community. 🚀"
  );
}

// ── HTTP Server ───────────────────────────────────────────────
const server = http.createServer((req, res) => {
  if (req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("FreefxalertBot is alive! 🤖");
    return;
  }

  if (req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const update = JSON.parse(body);
        await handleUpdate(update);
      } catch(e) {
        console.error("Error:", e);
      }
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("FreefxalertBot running on port " + PORT);
});
