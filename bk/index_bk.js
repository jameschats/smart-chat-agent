require("dotenv/config");
const axios = require("axios");
const oauth = require("axios-oauth-client");
const express = require("express");
const app = express();
var XMLHttpRequest = require("xhr2");
var xhr = new XMLHttpRequest();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.use(express.json());
const port = 3000;

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

io.on("connetion", socket => {
  console.log("new connection");
  socket.on("disconnect", () => {
    console.log("disconnected");
  });
});

// const CLIENT_ID='a715e417b7201b993f9286a8c24af754'
// const CLIENT_SECRET='12f38b51d854c8b2f697b743d3b59f0e16af2713'
const CLIENT_ID = "86a5943229b2c7bde3e8e1e08cdf304a";
const CLIENT_SECRET = "D6fENszbZuVLuP7xpIyQmDhAB238UABN";
//const INTEGRATION_URL='moment-card-sender-85aa5.web.app'
const INTEGRATION_URL = "https://8797-27-57-17-167.ngrok.io";
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

app.post("/event", async (req, res) => {
  try {
    const { body } = req;

    const event = body.payload.event;
    console.log("event");
    console.log(event);

    io.emit("so_incoming_event", event);

    // const users = chat.users
    // const customer = users.find(user => user.type === 'customer')
    // const { user_agent } = customer.last_visit
    // const { name } = customer.name

    // //console.log('user_agent', user_agent)
    // console.log('name', name)
    // // if (user_agent.includes('chat-guard')) {
    // //   await closeChat(chat.id)
    // // }
    // if (name.includes('chatbot_shan')) {
    //   await closeChat(chat.id)
    // }

    res.status(200).send();
  } catch (error) {
    if (error.response && error.response.data) {
      console.log("deactivate chat error", error.response.data.error);
    }
  }
});

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

function writefile(data) {
  // write to js file
  const fs = require("fs");

  const content = data;

  fs.writeFile("/test.txt", content, err => {
    if (err) {
      console.error(err);
      return;
    }
    //file written successfully
    console.log("successful");
  });
}
async function logmessage(data) {
  try {
    // if (process.env.NODE_ENV === 'development') {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
    axios.defaults.httpsAgent = httpsAgent;
    // eslint-disable-next-line no-console
    console.log(`RejectUnauthorized is disabled.`);
    //}
    const response = await axios.post(
      "https://localhost:7041/api/dashboard/write?data=" + data
    );
    console.log("Request successful!");

    //     let xhr = new XMLHttpRequest();
    // xhr.open("POST", "https://localhost:7041/api/dashboard/write");

    // xhr.setRequestHeader("Accept", "application/json");
    // xhr.setRequestHeader("Content-Type", "application/json");

    // xhr.onload = () => console.log(xhr.responseText);

    // // let data = `{
    // //   "Id": 78912,
    // //   "Customer": "Jason Sweet",
    // // }`;

    // xhr.send("data="+data)
    // console.log('successful')
  } catch (error) {
    if (error.response) {
      console.log("error1: " + error.reponse.status);
    } else {
      console.log("error2: " + error.message);
    }
  }
}

app.get("/install", async (req, res) => {
  const { code } = req.query;

  const getAuth = oauth.client(axios.create(), {
    url: `${ACCOUNTS_URL}/token`,
    grant_type: "authorization_code",
    client_id: `${CLIENT_ID}`,
    client_secret: `${CLIENT_SECRET}`,
    redirect_uri: `${INTEGRATION_URL}/install`,
    code
  });

  try {
    const auth = await getAuth();
    accessToken = auth.access_token;

    console.log("accessToken", accessToken);
    logmessage("accessToken : " + accessToken);
    writefile("accessToken : " + accessToken);
    const exists = await checkWebhookExists();

    console.log("exists", exists);
    // logmessage('exists : ' + exists);

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

app.listen(port, () => {
  console.log("started server");
  console.log(`Chat guard listening at http://localhost:${port}`);
});
