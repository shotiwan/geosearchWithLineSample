'use strict';

const line = require('@line/bot-sdk');
const express = require('express');

const axios = require('axios');

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  // create a echoing text message
  const echo = { type: 'text', text: event.message.text };
  // Url to api
  axios.post('https://geosearch.cdg.co.th//g/search/batch', {
    "data": [
      {
        "input": event.message.text
      }
    ],
    "key": process.env.GEOSEARCH_KEY
  },
    {
       headers: {
        "Referer": ".cdg.co.th",
        "Content-Type": "application/json"
      }
    })
    .then(function (response) {
      console.log(response);
      const latLong = (response.data.data[0].result.match[0].LAT_LON).replace(/ /g,'');
      return client.replyMessage(event.replyToken,
        { type: 'text', text: `https://geosearch-stg.cdg.co.th/map?@${latLong},18` }//message with link
      );
    })
    .catch(function (error) {
      console.log(error);
    });

  // use reply API
  //return client.replyMessage(event.replyToken, echo);
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});