/**
 * Created by ivanpetrus on 9/11/16.
 */
var Botkit = require('botkit');

var controller = Botkit.slackbot({
    debug: false
    //include "log: false" to disable logging
    //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

// connect the bot to a stream of messages
controller.spawn({
        token: "xoxb-76437444262-96LyicC5nT0VN6lIfnyWqgRo",
}).startRTM()

// give the bot something to listen for.
controller.hears(['hello','hi'],['direct_message','direct_mention','mention'],function(bot,message) {

   //controller.storage.channels.all();
    var reply_with_attachments = {


        'attachments': [
            {
                'fallback': 'To be useful, I need you to invite me in a channel.',
                'title': 'How can I help you?',
                'text': 'To be useful, I need you to invite me in a channel ',
                'color': '#7CD197',
                "actions": [
                    {
                        "name": "chess",
                        "text": "Chess",
                        "type": "button",
                        "value": "chess"
                    },
                    {
                        "name": "maze",
                        "text": "Falken's Maze",
                        "type": "button",
                        "value": "maze"
                    },
                    {
                        "name": "war",
                        "text": "Thermonuclear War",
                        "style": "danger",
                        "type": "button",
                        "value": "war",
                        "confirm": {
                            "title": "Are you sure?",
                            "text": "Wouldn't you prefer a good game of chess?",
                            "ok_text": "Yes",
                            "dismiss_text": "No"
                        }
                    }
                ]
            }
        ],
        'icon_url': 'http://lorempixel.com/48/48'
    }

   bot.reply(message,reply_with_attachments,null);

});