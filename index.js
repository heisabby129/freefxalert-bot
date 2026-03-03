const http = require(“http”);
const https = require(“https”);

const BOT_TOKEN      = “8568199054:AAE7q3MtTEOlFrQnIGcH3Sntzltkik0eE6c”;
const ADMIN_ID       = “5872932014”;
const INTRO_VIDEO    = “https://youtu.be/aSJY2w-1Sks?si=2QxiSBfiBTTHr0F1”;
const NEXT_VIDEO     = “https://youtube.com/shorts/h0ykRnOLA28?si=WZ4zKE3ERIoyNk1h”;
const WATCHERS_GROUP = “https://chat.whatsapp.com/H1oZcLKhbrNFD4zynBfgy0?mode=gi_t”;

function tg(endpoint, data) {
return new Promise((resolve, reject) => {
const body = JSON.stringify(data);
const opts = {
hostname: “api.telegram.org”,
path: “/bot” + BOT_TOKEN + “/” + endpoint,
method: “POST”,
headers: {
“Content-Type”: “application/json”,
“Content-Length”: Buffer.byteLength(body)
}
};
const req = https.request(opts, (res) => {
let raw = “”;
res.on(“data”, d => raw += d);
res.on(“end”, () => {
try { resolve(JSON.parse(raw)); } catch(e) { resolve({}); }
});
});
req.on(“error”, reject);
req.write(body);
req.end();
});
}

function sendMsg(chat_id, text, keyboard) {
const payload = { chat_id, text, parse_mode: “HTML”, disable_web_page_preview: false };
if (keyboard) payload.reply_markup = keyboard;
return tg(“sendMessage”, payload);
}

const watchedKb = {
inline_keyboard: [[
{ text: “✅ Yes, I’m serious”,   callback_data: “serious”  },
{ text: “👀 I’m just checking”,  callback_data: “checking” }
]]
};

const backgroundKb = {
inline_keyboard: [
[{ text: “🟢 Complete beginner”,      callback_data: “background” }],
[{ text: “📈 I’ve traded before”,     callback_data: “background” }],
[{ text: “💸 I’ve lost money before”, callback_data: “background” }]
]
};

async function handleUpdate(update) {

if (update.callback_query) {
const cb   = update.callback_query;
const cid  = cb.message.chat.id;
const data = cb.data;
const name = cb.from.first_name || “there”;

```
await tg("answerCallbackQuery", { callback_query_id: cb.id });

if (data === "serious") {
  await sendMsg(cid,
    "🔥 Love that energy, " + name + "!\n\n" +
    "What describes you best?",
    backgroundKb
  );
}

else if (data === "checking") {
  await sendMsg(cid,
    "No problem. Stay in the watchers circle for now. 👀\n\n" +
    "Join the free group here 👇\n" +
    WATCHERS_GROUP + "\n\n" +
    "When you are ready to get serious, come back and type /start 🚀"
  );
}

else if (data === "background") {
  await sendMsg(cid,
    "Perfect! Here is your next step 👇\n\n" +
    "Watch this short video — it will show you exactly what to do next:\n\n" +
    NEXT_VIDEO + "\n\n" +
    "Once you have watched it, reply here and let me know you are ready. ✅"
  );
}

return;
```

}

if (!update.message) return;

const msg   = update.message;
const cid   = msg.chat.id;
const uid   = String(msg.from.id);
const fname = msg.from.first_name || “there”;
const text  = (msg.text || “”).trim();

if (text === “/start”) {
await sendMsg(cid,
“👋 <b>Welcome, “ + fname + “!</b>\n\n” +
“Watch this <b>15-minute video</b> before anything else.\n\n” +
“Access to the private group is limited — I only consider those who complete the video. 🎯\n\n” +
INTRO_VIDEO + “\n\n” +
“———\n\n” +
“<b>Have you watched the video and are you serious about learning how this works?</b>”,
watchedKb
);
return;
}

await sendMsg(cid,
“👋 Hey “ + fname + “! Type /start to get started. 🚀”
);
}

const server = http.createServer((req, res) => {
if (req.method === “GET”) {
res.writeHead(200, { “Content-Type”: “text/plain” });
res.end(“FreefxalertBot is alive!”);
return;
}
if (req.method === “POST”) {
let body = “”;
req.on(“data”, chunk => body += chunk);
req.on(“end”, async () => {
try {
const update = JSON.parse(body);
await handleUpdate(update);
} catch(e) { console.error(“Error:”, e); }
res.writeHead(200);
res.end(“ok”);
});
return;
}
res.writeHead(404);
res.end(“Not found”);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(“FreefxalertBot running on port “ + PORT));
