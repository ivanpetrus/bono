/**
 * Created by ivanpetrus on 9/12/16.
 */
var Botkit = require('botkit');

if (!process.env.SLACK_ID || !process.env.SLACK_SECRET || !process.env.PORT) {
    console.log('Error: Specify SLACK_ID SLACK_SECRET and PORT in environment');
    process.exit(1);
}

var controller = Botkit.slackbot({})

exports.controller = controller

//CONNECTION FUNCTIONS=====================================================
exports.connect = function(team_config){
    var bot = controller.spawn(team_config);
    controller.trigger('create_bot', [bot, team_config]);
}
exports.connect_teams =function(teams){
    for (var t in teams){
        var team = teams[t];
        if (team.bot) {

            if (_bots[team.id]){continue;}
            var bot = controller.spawn(team).startRTM(function(err) {
                if (err) {
                    console.log('Error connecting bot to Slack:',err);
                } else {
                    trackBot(bot);
                }
            });
        }
    }

}

var send_reminder = function(user,team_id){
    var bot = getBot(team_id);
    if (bot !=null){
        bot.startPrivateConversation({
            user: user
        },function (err, convo) {
            if (err!=null){console.error(err);}
            else {
                convo.say('hey man');
            }
        })
    }
}

// just a simple way to make sure we don't
// connect to the RTM twice for the same team
var _bots = {};

function trackBot(bot) {
    _bots[bot.config.id] = bot;
}
function getBot(team_id) {
    return _bots[team_id];
}

controller.on('create_bot',function(bot,team) {

    if (_bots[bot.config.id]) {
        // already online! do nothing.
        console.log("already online! do nothing.")
    }
    else {
        bot.startRTM(function(err) {

            if (!err) {
                trackBot(bot);

                console.log("RTM ok")

                controller.saveTeam(team, function(err, id) {
                    if (err) {
                        console.log("Error saving team")
                    }
                    else {
                        console.log("Team " + team.name + " saved")
                    }
                })
            }

            else{
                console.log("RTM failed")
            }

            bot.startPrivateConversation({user: team.createdBy},function(err,convo) {
                if (err) {
                    console.log(err);
                } else {
                    convo.say('Hello, I am a @bono that has just joined your team');
                    convo.say('I will help you to manage team members!');
                }
            });

        });
    }
});

// Handle events related to the websocket connection to Slack
controller.on('rtm_open',function(bot) {
    console.log('** The RTM api just connected!');
});
controller.on('rtm_close',function(bot) {
    console.log('** The RTM api just closed');
    // you may want to attempt to re-open
});


controller.hears('hello','direct_message',function(bot,message) {
    bot.reply(message,'Hello!');
});
controller.hears('//reminder= ','direct_message',function(bot,message) {
    bot.reply(message,'Hello!');
});

controller.hears('^stop','direct_message',function(bot,message) {
    bot.reply(message,'Goodbye');
    bot.rtm.close();
});
/*
controller.on('direct_message,mention,direct_mention',function(bot,message) {
    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    },function(err) {
        if (err) { console.log(err) }
        bot.reply(message,'I heard you loud and clear boss.');
    });
});*/


