require("dotenv/config");
const axios = require("axios");
const oauth = require("axios-oauth-client");
const express = require("express");
const app = express();
const path = require("path");
var XMLHttpRequest = require("xhr2");
var xhr = new XMLHttpRequest();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const ngrok = require("ngrok");
const { writeFile } = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");

// const io = require("socket.io")(server,
//   {
//   allowEIO3: true // false by default
// });

app.use(express.json());
const port = 3000;

app.use(cors());

// // Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

io.on("connetion", socket => {
  console.log("new connection");
  socket.on("disconnect", () => {
    console.log("disconnected");
  });
});

// prod - server side app
const CLIENT_ID = "86a5943229b2c7bde3e8e1e08cdf304a";
const CLIENT_SECRET = "ZPbqHvzVXsnlugb7SJHhngXBcHyCv88H";
//const INTEGRATION_URL='https://92b9-2401-4900-1cdc-5c1a-40ed-17ee-2ae2-5d7b.ngrok.io'

// acutal one  - js app
//const CLIENT_ID='e22c3b45ca9c5c0fbbfe835dee988f5f'
//const CLIENT_SECRET='nA0YRjVLiNHBUqTBiXyuhY9ChOWUVIfx'
const INTEGRATION_URL = "https://moment-card-sender-85aa5.web.app";

const API_URL = "https://api.livechatinc.com";
const ACCOUNTS_URL = "https://accounts.livechat.com";

const apiClient = axios.create({
  baseURL: API_URL
});

// DON'T DO IT IN PROD
let accessToken;

const enableWebhook = async () => {
  try {
    console.log(
      "sending https://api.livechatinc.com/v3.3/configuration/action/enable_license_webhooks"
    );

    logmessage("enableWebhook()");
    await apiClient.post(
      "/v3.3/configuration/action/enable_license_webhooks",
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
  } catch (error) {
    if (error.response && error.response.data) {
      console.log("enableWebhook error", error.response.data.error);
    }
  }
};

const registerWebhook = async () => {
  try {
    console.log(
      "sending https://api.livechatinc.com/v3.3/configuration/action/register_webhook"
    );

    logmessage("registerWebhook()");
    const { data } = await apiClient.post(
      "/v3.3/configuration/action/register_webhook",
      {
        //url: `${INTEGRATION_URL}/chat`,
        url: `${INTEGRATION_URL}/event`,
        description: "Test webhook",
        //action: 'incoming_chat',
        action: "incoming_event",
        secret_key: "secret",
        type: "license",
        owner_client_id: CLIENT_ID
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    console.log("data", data);
    return data;
  } catch (error) {
    if (error.response && error.response.data) {
      console.log("registerWebhook error", error.response.data.error);
    }
  }
};

const checkWebhookExists = async () => {
  try {
    console.log(
      "sending https://api.livechatinc.com/v3.3/configuration/action/list_webhooks"
    );

    logmessage("checkWebhookExists()");
    const { data } = await apiClient.post(
      "/v3.3/configuration/action/list_webhooks",
      {
        owner_client_id: CLIENT_ID
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    console.log("data", data);
    //return data.some(item => item.action === 'incoming_chat')
    return data.some(item => item.action === "incoming_event");
  } catch (error) {
    if (error.response && error.response.data) {
      console.log("checkWebhook error", error.response.data.error);
    }
  }
};

const closeChat = async id => {
  try {
    console.log("closing chat", id);
    await apiClient.post(
      "/v3.3/agent/action/deactivate_chat",
      {
        id
      },
      {
        headers: {
          Authorization: `Bearer ACCESS_TOKEN`
        }
      }
    );
  } catch (error) {
    if (error.response && error.response.data) {
      console.log("closeChat error", error.response.data.error);
    }
  }
};

app.post("/chat", async (req, res) => {
  try {
    const { body } = req;
    const chat = body.payload.chat;
    const users = chat.users;
    const customer = users.find(user => user.type === "customer");
    const { user_agent } = customer.last_visit;
    const { name } = customer.name;

    //console.log('user_agent', user_agent)
    console.log("name", name);
    // if (user_agent.includes('chat-guard')) {
    //   await closeChat(chat.id)
    // }
    if (name.includes("chatbot_shan")) {
      await closeChat(chat.id);
    }

    res.status(200).send();
  } catch (error) {
    if (error.response && error.response.data) {
      console.log("deactivate chat error", error.response.data.error);
    }
  }
});

// Where we will keep books
let books = [];

app.post("/book", (req, res) => {
  const book = req.body;

  // Output the book to the console for debugging
  console.log(book);
  books.push(book);

  res.send("Book is added to the database");
});

app.get("/books", (req, res) => {
  console.log(books);
  res.json(books);
});

app.post("/event", (req, res) => {
  try {
    logmessage("event");
    console.log("event0");
    const { body } = req;
    console.log("event1");
    const event = body.payload.event;
    console.log("event2");
    console.log(event);
    logmessage(event);

    io.emit("so_incoming_event", event);

    res.status(200).send(event);
  } catch (error) {
    if (error.response && error.response.data) {
      console.log("deactivate chat error", error.response.data.error);
    }
  }
});

async function logmessage(data) {
  try {
    //const response = await axios.post("https://localhost:7041/api/dashboard/write?data="+data)
    const response = await axios.post(
      "https://migrationnoura.azurewebsites.net/api/inboundapi/shopify/postapi",
      data
    );
    console.log("Request successful!");
    // xhr.send("data="+data)
    // console.log('successful')
  } catch (error) {
    if (error.response) {
      console.log("error1: " + error.message);
      //console.log('error1: ')
    } else {
      console.log("error2: " + error.message);
    }
  }
}

// momentsend.com/install?code=234323423sdff234234
// code
// https://accounts.livechat.com/token
// accessToken
// https://api.livechatinc.com/v3.3/configuration/action/list_webhooks
// (checks if incoming_event is registered)
// if not exists
// https://api.livechatinc.com/v3.3/configuration/action/register_webhook
// momentsend.com/incomingevent
// https://api.livechatinc.com/v3.3/configuration/action/enable_license_webhooks

app.get("/install", async (req, res) => {
  //app.get('/', async (req, res) => {
  const { code } = req.query;

  console.log("code: " + code);

  const getAuth = oauth.client(axios.create(), {
    url: `${ACCOUNTS_URL}/token`,
    grant_type: "authorization_code",
    client_id: `${CLIENT_ID}`,
    client_secret: `${CLIENT_SECRET}`,
    redirect_uri: `${INTEGRATION_URL}/install`,
    code
  });

  try {
    logmessage("before getAuth()");
    const auth = await getAuth();
    accessToken = auth.access_token;

    logmessage("accessToken", accessToken);
    console.log("accessToken", accessToken);
    // logmessage('accessToken : ' + accessToken);
    // writefile('accessToken : ' + accessToken);
    const exists = await checkWebhookExists();

    console.log("exists", exists);
    //logmessage('exists : ' + exists);

    if (!exists) {
      await registerWebhook();
      await enableWebhook();
    }

    res.send("<script>window.close();</script>");
  } catch (error) {
    console.log("error", error);
    res.send(`Error: ${error.message}`);
  }
});

server.listen(port, () => {
  console.log("started server");
  logmessage("started server");
  console.log(`Chat guard listening at http://localhost:${port}`);
});

// ngrok.connect(port, function (err, url) {
//   console.log(`Node.js local server is publicly-accessible at ${url}`);
// });
