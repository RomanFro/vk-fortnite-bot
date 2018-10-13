/**
 * This is an implementation of the simple bot
 * which works using vk callback api
 * and fortnitetracker api.
 *
 * Command from the message starts with exclamation mark
 * and is followed by fortnite username.
 * Example: !ninja
 * Output: KD and WR
 *
 * @module index
 */

'use strict';

require('dotenv').load();

const PORT            = process.env.PORT; // server port
const TOKEN           = process.env.TOKEN; // vk access token
const GROUP_ID        = process.env.GROUP_ID; // vk group id
const CALLBACK_SECRET = process.env.CALLBACK_SECRET; // vk callback api secret
const TRN_API_KEY     = process.env.TRN_API_KEY; // fortnitetracker api key

const express    = require('express');
const bodyParser = require('body-parser');
const { Bot }    = require('node-vk-bot');
const request    = require('request');

const bot = new Bot({
  token: TOKEN,
  group_id: GROUP_ID
}).start();

const app = express();

app.use(bodyParser.json());

app.post('/bot', (req, res) => {
    if (req.body.type == 'confirmation') {
        return res.send(CALLBACK_SECRET)
    };

    if (req.body.type === 'message_new') {
        if (req.body.object.body.includes('!')) {
            const username = req.body.object.body.slice(1);
            const vk_user_id = req.body.object.user_id;

            bot.send(`Getting stats for ${username}`, vk_user_id);

            const options = {
                url: `https://api.fortnitetracker.com/v1/profile/pc/${username}`,
                headers: {
                    'TRN-Api-Key': TRN_API_KEY
                }
            };

            try {
                request(options, (e, response, body) => {
                    if (e) {
                        console.error(e);
                    }

                    const { stats } = JSON.parse(body);

                    let msg = '';

                    Object.keys(stats).forEach(key => {
                        msg += key + ': \nKD: ' + stats[key].kd.value + '\nWR: ' + stats[key].winRatio.value + '\n\n';
                    });

                    bot.send(msg, vk_user_id);
                });
            } catch (e) {
                console.error(e);
            }
        }
    }

    bot.processUpdate(req.body);
    res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server at ${PORT}`);
});
